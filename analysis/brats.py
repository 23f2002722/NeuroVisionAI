import numpy as np
import nibabel as nib
from skimage.transform import resize


def load_brats_masks(path):
    data = nib.load(str(path)).get_fdata()

    return {
        "WT": np.logical_or(data == 2, data == 4),
        "TC": data == 2,
        "ET": data == 4,
    }


def resize_mask(mask, target_size=(240, 240)):
    resized = []

    for index in range(mask.shape[2]):
        slice_mask = resize(
            mask[:, :, index].astype(np.uint8),
            target_size,
            order=0,
            preserve_range=True,
            anti_aliasing=False,
        )

        resized.append(slice_mask.astype(bool))

    return np.stack(resized, axis=0)