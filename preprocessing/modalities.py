from pathlib import Path


MODALITY_ALIASES = {
    "FLAIR": ("flair",),
    "T1ce": ("t1ce", "t1c", "t1-gd", "t1gd", "post"),
    "T1": ("t1",),
    "T2": ("t2",),
}


def identify_modality(path):
    name = Path(path).name.lower()

    if "-seg" in name or "_seg" in name:
        return None

    if "-t2f" in name or "_t2f" in name:
        return "FLAIR"

    if "-t1c" in name or "_t1c" in name:
        return "T1ce"

    if "-t1n" in name or "_t1n" in name:
        return "T1"

    if "-t2w" in name or "_t2w" in name:
        return "T2"

    if "flair" in name:
        return "FLAIR"

    if "t1ce" in name or "t1c" in name:
        return "T1ce"

    if "t1" in name:
        return "T1"

    if "t2" in name:
        return "T2"

    return None

def identify_nifti_modalities(paths):
    modalities = {}

    for path in paths:
        modality = identify_modality(path)

        if modality is None:
            continue

        if modality in modalities:
            raise ValueError(f"Multiple NIfTI files identified as {modality}")

        modalities[modality] = str(path)

    required = {"FLAIR", "T1", "T1ce", "T2"}
    missing = required - set(modalities)

    if missing:
        raise ValueError(
            f"Could not identify required MRI modalities: {', '.join(sorted(missing))}"
        )

    return {
        "FLAIR": modalities["FLAIR"],
        "T1": modalities["T1"],
        "T1ce": modalities["T1ce"],
        "T2": modalities["T2"],
    }