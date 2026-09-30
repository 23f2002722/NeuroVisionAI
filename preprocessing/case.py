from pathlib import Path
import tempfile
import zipfile


def extract_case(zip_path):
    zip_path = Path(zip_path)

    if not zip_path.exists():
        raise FileNotFoundError(zip_path)

    extract_dir = Path(
        tempfile.mkdtemp(prefix="neurovisionai_case_")
    )

    with zipfile.ZipFile(zip_path, "r") as archive:
        for member in archive.infolist():
            target = (extract_dir / member.filename).resolve()

            if not str(target).startswith(str(extract_dir.resolve())):
                raise ValueError("Unsafe ZIP file")

        archive.extractall(extract_dir)

    return extract_dir


def list_case_files(case_dir):
    case_dir = Path(case_dir)

    return [
        path
        for path in case_dir.rglob("*")
        if path.is_file()
    ]