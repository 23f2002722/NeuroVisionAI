from pathlib import Path


NIFTI_EXTENSIONS = {".nii", ".nii.gz"}


def get_file_type(path):
    path = Path(path)
    name = path.name.lower()

    if name.endswith(".nii.gz") or path.suffix.lower() == ".nii":
        return "nifti"

    if path.suffix.lower() in {".dcm", ".dicom"}:
        return "dicom"

    return "unsupported"


def detect_case_files(case_dir):
    case_dir = Path(case_dir)

    result = {
        "nifti": [],
        "dicom": [],
        "unsupported": [],
    }

    for path in case_dir.rglob("*"):
        if not path.is_file():
            continue

        file_type = get_file_type(path)

        if file_type == "nifti":
            result["nifti"].append(str(path))
        elif file_type == "dicom":
            result["dicom"].append(str(path))
        else:
            result["unsupported"].append(str(path))

    return result