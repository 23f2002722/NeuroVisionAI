import argparse
from pipeline import run_pipeline


parser = argparse.ArgumentParser()
parser.add_argument("--input", required=True)
parser.add_argument("--output", required=True)
parser.add_argument("--model", choices=["unimatch", "ipixmatch"], default="unimatch")

args = parser.parse_args()

result = run_pipeline(
    input_path=args.input,
    output_dir=args.output,
    model_name=args.model,
)

print("Pipeline completed successfully.")
print("Model:", result["model"])
print("Report:", result["report"])