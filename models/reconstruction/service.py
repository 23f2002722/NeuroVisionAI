from models.reconstruction.runner import run_reconstruction


CHECKPOINT_PATH = (
    "models/reconstruction/conditional_mri_checkpoint.pth"
)


def run_reconstruction_service(
    input_path,
    output_path,
    checkpoint_path=CHECKPOINT_PATH,
):
    run_reconstruction(
        input_path=input_path,
        checkpoint_path=checkpoint_path,
        output_path=output_path,
    )

    return {
        "model": "conditional_ddpm",
        "input": input_path,
        "output": output_path,
    }