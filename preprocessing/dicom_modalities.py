REQUIRED_MODALITIES = {"FLAIR", "T1", "T1ce", "T2"}


def identify_dicom_modality(series_info):
    text = " ".join(
        [
            series_info.get("series_description", ""),
            series_info.get("protocol_name", ""),
        ]
    ).lower()

    if "flair" in text:
        return "FLAIR"

    if "t2" in text:
        return "T2"

    if "t1" in text:
        contrast_keywords = (
            "post",
            "contrast",
            "t1ce",
            "t1c",
            "gad",
            "gadolinium",
        )

        if any(keyword in text for keyword in contrast_keywords):
            return "T1ce"

        return "T1"

    return None


def identify_dicom_modalities(series):
    modalities = {}

    for series_uid, files in series.items():
        modality = identify_dicom_modality(files[0])

        if modality is None:
            continue

        if modality in modalities:
            raise ValueError(f"Multiple DICOM series identified as {modality}")

        modalities[modality] = series_uid

    return modalities


def validate_dicom_modalities(modalities):
    missing = get_missing_modalities(modalities)

    if missing:
        return {
            "valid": False,
            "detected": sorted(modalities),
            "missing": missing,
        }

    return {
        "valid": True,
        "detected": sorted(modalities),
        "missing": [],
    }


def get_missing_modalities(modalities):
    return sorted(REQUIRED_MODALITIES - set(modalities))