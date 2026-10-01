import numpy as np
import pydicom
import SimpleITK as sitk

from preprocessing.dicom import load_dicom_series
from preprocessing.dicom_modalities import (
    identify_dicom_modalities,
    validate_dicom_modalities,
)


def _dicom_to_sitk(files):
    datasets = []

    for item in files:
        dataset = pydicom.dcmread(item["path"])
        datasets.append(dataset)

    if not datasets:
        raise ValueError("DICOM series contains no readable files.")

    first = datasets[0]

    orientation = getattr(
        first,
        "ImageOrientationPatient",
        None,
    )

    if orientation is None or len(orientation) != 6:
        raise ValueError(
            "DICOM series is missing ImageOrientationPatient."
        )

    row_direction = np.asarray(
        orientation[:3],
        dtype=np.float64,
    )

    column_direction = np.asarray(
        orientation[3:],
        dtype=np.float64,
    )

    slice_direction = np.cross(
        row_direction,
        column_direction,
    )

    def position(dataset):
        value = getattr(
            dataset,
            "ImagePositionPatient",
            None,
        )

        if value is None or len(value) != 3:
            raise ValueError(
                "DICOM series contains a slice without "
                "ImagePositionPatient."
            )

        return np.asarray(
            value,
            dtype=np.float64,
        )

    datasets.sort(
        key=lambda dataset: float(
            np.dot(
                position(dataset),
                slice_direction,
            )
        )
    )

    arrays = [
        dataset.pixel_array.astype(np.float32)
        for dataset in datasets
    ]

    volume = np.stack(
        arrays,
        axis=0,
    )

    spacing_2d = getattr(
        first,
        "PixelSpacing",
        None,
    )

    if spacing_2d is None or len(spacing_2d) != 2:
        raise ValueError(
            "DICOM series is missing PixelSpacing."
        )

    if len(datasets) > 1:
        positions = np.asarray(
            [position(dataset) for dataset in datasets]
        )

        distances = np.diff(
            np.dot(
                positions,
                slice_direction,
            )
        )

        slice_spacing = float(
            np.median(np.abs(distances))
        )

        if slice_spacing <= 0:
            raise ValueError(
                "Invalid DICOM slice spacing."
            )
    else:
        slice_spacing = float(
            getattr(
                first,
                "SliceThickness",
                1.0,
            )
        )

    image = sitk.GetImageFromArray(
        volume,
        isVector=False,
    )

    image.SetSpacing(
        (
            float(spacing_2d[1]),
            float(spacing_2d[0]),
            slice_spacing,
        )
    )

    origin = position(datasets[0])

    direction = np.column_stack(
        (
            row_direction,
            column_direction,
            slice_direction,
        )
    )

    image.SetOrigin(
        tuple(origin.tolist())
    )

    image.SetDirection(
        tuple(direction.flatten().tolist())
    )

    return image


def _register_to_reference(
    moving,
    fixed,
    modality,
):
    moving_float = sitk.Cast(
        moving,
        sitk.sitkFloat32,
    )

    fixed_float = sitk.Cast(
        fixed,
        sitk.sitkFloat32,
    )

    transform = sitk.Euler3DTransform()

    transform = sitk.CenteredTransformInitializer(
        fixed_float,
        moving_float,
        transform,
        sitk.CenteredTransformInitializerFilter.GEOMETRY,
    )

    registration = sitk.ImageRegistrationMethod()

    registration.SetMetricAsMattesMutualInformation(
        numberOfHistogramBins=50
    )

    registration.SetMetricSamplingStrategy(
        registration.RANDOM
    )

    registration.SetMetricSamplingPercentage(
        0.20
    )

    registration.SetInterpolator(
        sitk.sitkLinear
    )

    registration.SetOptimizerAsGradientDescent(
        learningRate=1.0,
        numberOfIterations=100,
        convergenceMinimumValue=1e-6,
        convergenceWindowSize=10,
    )

    registration.SetOptimizerScalesFromPhysicalShift()

    registration.SetInitialTransform(
        transform,
        inPlace=False,
    )

    try:
        final_transform = registration.Execute(
            fixed_float,
            moving_float,
        )
    except Exception as exc:
        raise ValueError(
            f"Could not register {modality} to FLAIR: {exc}"
        ) from exc

    parameters = np.asarray(
        final_transform.GetParameters(),
        dtype=np.float64,
    )

    if not np.all(
        np.isfinite(parameters)
    ):
        raise ValueError(
            f"Registration produced an invalid transform for {modality}."
        )

    return final_transform


def _resample_to_reference(
    moving,
    reference,
    transform,
):
    return sitk.Resample(
        moving,
        reference,
        transform,
        sitk.sitkLinear,
        0.0,
        sitk.sitkFloat32,
    )


def load_dicom_modalities(series):
    modalities = identify_dicom_modalities(
        series
    )

    validation = validate_dicom_modalities(
        modalities
    )

    if not validation["valid"]:
        raise ValueError(
            "Incomplete DICOM MRI case. "
            "Detected: "
            + ", ".join(validation["detected"])
            + ". Missing: "
            + ", ".join(validation["missing"])
            + ". Required: FLAIR, T1, T1ce, T2."
        )

    images = {}

    for modality in (
        "FLAIR",
        "T1",
        "T1ce",
        "T2",
    ):
        try:
            images[modality] = _dicom_to_sitk(
                series[modalities[modality]]
            )
        except Exception as exc:
            raise ValueError(
                f"Could not load DICOM {modality} series: {exc}"
            ) from exc

    reference = images["FLAIR"]

    registered = {
        "FLAIR": reference,
    }

    for modality in (
        "T1",
        "T1ce",
        "T2",
    ):
        transform = _register_to_reference(
            images[modality],
            reference,
            modality,
        )

        registered[modality] = (
            _resample_to_reference(
                images[modality],
                reference,
                transform,
            )
        )

    volumes = []

    for modality in (
        "FLAIR",
        "T1",
        "T1ce",
        "T2",
    ):
        volume = sitk.GetArrayFromImage(
            registered[modality]
        )

        volumes.append(
            volume.astype(np.float32)
        )

    image = np.stack(
        volumes,
        axis=0,
    )

    image = np.transpose(
        image,
        (0, 2, 3, 1),
    )

    return {
        "image": image,
        "shape": image.shape[1:],
        "voxel_spacing": reference.GetSpacing(),
        "modalities": modalities,
    }