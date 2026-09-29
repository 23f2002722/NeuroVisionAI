from models.reconstruction.inference import reconstruct_mri


def run_reconstruction(input_path, checkpoint_path, output_path):
    reconstruct_mri(
        input_path,
        output_path,
        checkpoint_path,
    )

    return {
        "model": "conditional_ddpm",
        "input": input_path,
        "output": output_path,
    }