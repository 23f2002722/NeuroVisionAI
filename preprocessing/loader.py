from pathlib import Path

from preprocessing.case import extract_case
from preprocessing.detect import detect_case_files
from preprocessing.modalities import identify_nifti_modalities
from preprocessing.dicom import scan_dicom_series
from preprocessing.dicom_modalities import (
    identify_dicom_modalities,
    validate_dicom_modalities,
)

def find_ground_truth(nifti_paths):
    for path in nifti_paths:
        if Path(path).name.endswith("-seg.nii"):
            return str(path)

    return None 

def prepare_case(upload_path):
    upload_path = Path(upload_path)

    if upload_path.suffix.lower() == ".zip":
        case_dir = extract_case(upload_path)
    else:
        case_dir = upload_path

    detected = detect_case_files(case_dir)

    nifti_paths = detected["nifti"]
    dicom_paths = detected["dicom"]

    if nifti_paths:
        modalities = identify_nifti_modalities(nifti_paths)
        ground_truth = find_ground_truth(nifti_paths)

        return {
            "input_type": "nifti",
            "case_dir": str(case_dir),
            "modalities": modalities,
            "ground_truth": ground_truth,
        }

    if dicom_paths:
        series = scan_dicom_series(case_dir)
        modalities = identify_dicom_modalities(series)
        validation = validate_dicom_modalities(modalities)

        if not validation["valid"]:
            raise ValueError(
                "Incomplete DICOM MRI case. Missing modalities: "
                + ", ".join(validation["missing"])
            )

        return {
            "input_type": "dicom",
            "case_dir": str(case_dir),
            "series": series,
            "modalities": modalities,
        }

    raise ValueError(
        "No supported MRI files found. "
        "Expected NIfTI (.nii/.nii.gz) or DICOM (.dcm)."
    )

def load_prepared_case(case):
    if case["input_type"] == "nifti":
        from preprocessing.volume import load_nifti_modalities

        return load_nifti_modalities(case["modalities"])

    if case["input_type"] == "dicom":
        from preprocessing.dicom_volume import load_dicom_modalities

        return load_dicom_modalities(case["series"])

    raise ValueError(
        f"Unsupported input type: {case['input_type']}"
    )