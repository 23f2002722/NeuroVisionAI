from __future__ import annotations

import logging
import re
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO

from .config import MB, Settings
from .errors import ApiError
from .storage import CasePaths

log = logging.getLogger(__name__)

CHUNK = 1024 * 1024
_UNSAFE_CHARS = re.compile(r"[^A-Za-z0-9._-]+")
_JUNK_PARTS = {"__MACOSX"}
_JUNK_NAMES = {".ds_store", "thumbs.db"}
_NESTED_ARCHIVE = (".zip", ".tar", ".tgz", ".7z", ".rar")


@dataclass(frozen=True)
class IntakeInfo:
    input_type: str
    ground_truth_supplied: bool
    file_count: int


def classify_upload(filename: str) -> str | None:
    name = (filename or "").lower()
    if name.endswith(".zip"):
        return "zip"
    if name.endswith(".nii") or name.endswith(".nii.gz"):
        return "nifti"
    return None


def sanitize_name(filename: str) -> str:
    base = re.split(r"[\\/]", filename or "")[-1]
    base = _UNSAFE_CHARS.sub("_", base).lstrip(".")
    return (base[-120:] if len(base) > 120 else base) or "file"


def _too_large(settings: Settings) -> ApiError:
    limit = settings.max_upload_bytes / MB
    return ApiError(413, "FILE_TOO_LARGE", f"Upload exceeds the {limit:g} MB limit.")


def _copy_limited(source: BinaryIO, target: Path, remaining: int, settings: Settings) -> int:
    written = 0
    with open(target, "wb") as out:
        while True:
            chunk = source.read(CHUNK)
            if not chunk:
                break
            written += len(chunk)
            if written > remaining:
                raise _too_large(settings)
            out.write(chunk)
    return written


def save_uploads(files: list[tuple[str, BinaryIO]], paths: CasePaths, settings: Settings) -> int:
    """Save the upload into paths.input. Returns the number of files stored."""
    if not files:
        raise ApiError(422, "NO_FILES", "No files were uploaded.")

    kinds = [classify_upload(name) for name, _ in files]
    if any(kind is None for kind in kinds):
        raise ApiError(415, "UNSUPPORTED_FILE_TYPE",
                       "Only .zip, .nii and .nii.gz files are supported.")
    if "zip" in kinds and len(files) > 1:
        raise ApiError(422, "INVALID_UPLOAD",
                       "Upload either a single ZIP or NIfTI files, not a mix.")
    if len(files) > settings.max_upload_files:
        raise ApiError(422, "INVALID_UPLOAD",
                       f"At most {settings.max_upload_files} files can be uploaded at once.")

    paths.upload.mkdir(parents=True, exist_ok=True)
    paths.input.mkdir(parents=True, exist_ok=True)

    if kinds[0] == "zip":
        archive = paths.upload / "archive.zip"
        _copy_limited(files[0][1], archive, settings.max_upload_bytes, settings)
        count = safe_extract(archive, paths.input, settings)
        archive.unlink(missing_ok=True)
        return count

    remaining = settings.max_upload_bytes
    for name, handle in files:
        target = paths.input / sanitize_name(name)
        if target.exists():
            raise ApiError(422, "INVALID_UPLOAD", "Two uploaded files have the same name.")
        remaining -= _copy_limited(handle, target, remaining, settings)
    _check_gzip_sizes(paths.input, settings)
    return len(files)


def _clean_parts(name: str) -> list[str] | None:
    """Normalised path parts, None for ignorable junk, ApiError if unsafe."""
    normalised = name.replace("\\", "/")
    if normalised.startswith("/") or re.match(r"^[A-Za-z]:", normalised):
        raise ApiError(400, "UNSAFE_ARCHIVE", "Archive contains an unsafe path.")
    parts = [p for p in normalised.split("/") if p not in ("", ".")]
    if ".." in parts:
        raise ApiError(400, "UNSAFE_ARCHIVE", "Archive contains an unsafe path.")
    if not parts or any(p in _JUNK_PARTS for p in parts) or parts[-1].lower() in _JUNK_NAMES:
        return None
    return parts


def _gzip_isize(path: Path) -> int:
    """Uncompressed size recorded in a gzip trailer (valid below 4 GiB)."""
    with open(path, "rb") as handle:
        handle.seek(-4, 2)
        return int.from_bytes(handle.read(4), "little")


def _check_gzip_sizes(directory: Path, settings: Settings) -> None:
    total = 0
    for path in directory.rglob("*"):
        if not path.is_file():
            continue
        try:
            total += _gzip_isize(path) if path.name.lower().endswith(".gz") else path.stat().st_size
        except OSError:
            raise ApiError(400, "INVALID_ARCHIVE", "A compressed file could not be read.")
    if total > settings.max_extracted_bytes:
        raise ApiError(400, "UNSAFE_ARCHIVE", "Uploaded data is too large once decompressed.")


def safe_extract(zip_path: Path, dest: Path, settings: Settings) -> int:
    try:
        archive = zipfile.ZipFile(zip_path)
    except zipfile.BadZipFile:
        raise ApiError(400, "INVALID_ARCHIVE", "The uploaded file is not a valid ZIP archive.")

    with archive:
        members: list[tuple[zipfile.ZipInfo, list[str]]] = []
        for info in archive.infolist():
            if info.is_dir():
                continue
            parts = _clean_parts(info.filename)
            if parts is None:
                continue
            if info.flag_bits & 0x1:
                raise ApiError(400, "UNSAFE_ARCHIVE", "Encrypted archives are not supported.")
            if (info.external_attr >> 16) & 0o170000 == 0o120000:
                raise ApiError(400, "UNSAFE_ARCHIVE", "Archive contains a symbolic link.")
            lowered = parts[-1].lower()
            if lowered.endswith(_NESTED_ARCHIVE) or (
                lowered.endswith(".gz") and not lowered.endswith(".nii.gz")
            ):
                raise ApiError(400, "UNSAFE_ARCHIVE", "Nested archives are not supported.")
            members.append((info, parts))

        if not members:
            raise ApiError(422, "INVALID_MRI_CASE", "The archive contains no files.")
        if len(members) > settings.max_files:
            raise ApiError(400, "UNSAFE_ARCHIVE",
                           f"Archive has more than {settings.max_files} files.")

        declared = sum(info.file_size for info, _ in members)
        compressed = sum(info.compress_size for info, _ in members)
        if declared > settings.max_extracted_bytes:
            raise ApiError(400, "UNSAFE_ARCHIVE", "Archive is too large once extracted.")
        if declared > 10 * MB and declared / max(compressed, 1) > settings.max_compression_ratio:
            raise ApiError(400, "UNSAFE_ARCHIVE", "Archive compression ratio is suspiciously high.")

        root = dest.resolve()
        written = 0
        for info, parts in members:
            target = root.joinpath(*parts)
            if root not in target.resolve().parents:
                raise ApiError(400, "UNSAFE_ARCHIVE", "Archive contains an unsafe path.")
            if target.exists():
                raise ApiError(400, "UNSAFE_ARCHIVE", "Archive contains duplicate paths.")
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(info) as source, open(target, "wb") as out:
                while True:
                    chunk = source.read(CHUNK)
                    if not chunk:
                        break
                    written += len(chunk)
                    if written > settings.max_extracted_bytes:  # declared sizes can lie
                        raise ApiError(400, "UNSAFE_ARCHIVE", "Archive is too large once extracted.")
                    out.write(chunk)

    _check_gzip_sizes(dest, settings)
    return len(members)


def validate_case(input_dir: Path) -> IntakeInfo:
    """Fast synchronous validation so bad input gets an immediate 422."""
    from preprocessing.loader import prepare_case  # light: pydicom/nibabel only

    try:
        case = prepare_case(str(input_dir))
    except ValueError as exc:
        raise ApiError(422, "INVALID_MRI_CASE", str(exc))
    except Exception:
        log.exception("prepare_case failed")
        raise ApiError(422, "INVALID_MRI_CASE", "The MRI case could not be read.")

    ground_truth = case.get("ground_truth")
    file_count = sum(1 for p in input_dir.rglob("*") if p.is_file())

    if case["input_type"] == "nifti":
        import nibabel as nib

        shapes: dict[str, tuple] = {}
        for modality, path in case["modalities"].items():
            try:
                shape = tuple(nib.load(path).shape)
            except Exception:
                raise ApiError(422, "INVALID_MRI_CASE",
                               f"The {modality} file is not a readable NIfTI image.")
            if len(shape) != 3:
                raise ApiError(422, "INVALID_MRI_CASE",
                               f"The {modality} image must be a 3D volume (found {len(shape)}D).")
            shapes[modality] = shape

        if len(set(shapes.values())) != 1:
            detail = ", ".join(f"{k} {v}" for k, v in shapes.items())
            raise ApiError(422, "INVALID_MRI_CASE",
                           f"All modalities must have identical dimensions ({detail}).")

        if ground_truth:
            try:
                gt_shape = tuple(nib.load(ground_truth).shape)
            except Exception:
                raise ApiError(422, "INVALID_MRI_CASE",
                               "The ground-truth segmentation is not a readable NIfTI image.")
            if gt_shape != next(iter(shapes.values())):
                raise ApiError(422, "INVALID_MRI_CASE",
                               "The ground-truth segmentation has different dimensions than the MRI volumes.")

    return IntakeInfo(
        input_type=case["input_type"],
        ground_truth_supplied=bool(ground_truth),
        file_count=file_count,
    )
