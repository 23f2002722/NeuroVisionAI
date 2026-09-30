import json
from pathlib import Path

files = list(Path("notebooks").glob("*UniMatch*.ipynb"))
files += list(Path("notebooks").glob("*iPixMatch*.ipynb"))

keywords = (
    "h5py",
    "create_dataset",
    "nib.load",
    "get_fdata",
)

for path in files:
    notebook = json.loads(path.read_text(encoding="utf-8"))

    for index, cell in enumerate(notebook["cells"]):
        if cell.get("cell_type") != "code":
            continue

        source = "".join(cell.get("source", []))

        if any(keyword.lower() in source.lower() for keyword in keywords):
            print(f"\n### {path.name} — CELL {index}")
            print(source)
            