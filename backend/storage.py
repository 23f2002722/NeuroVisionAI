from __future__ import annotations

import re
import shutil
import uuid
from dataclasses import dataclass
from pathlib import Path

CASE_ID_RE = re.compile(r"^[0-9a-f]{32}$")
REGIONS = ("WT", "TC", "ET")


def new_case_id() -> str:
    # 128 random bits: with no auth in the MVP, the id is the access control.
    return uuid.uuid4().hex


def is_valid_case_id(value: str) -> bool:
    return bool(CASE_ID_RE.match(value or ""))


@dataclass(frozen=True)
class CasePaths:
    root: Path

    @property
    def upload(self) -> Path:
        return self.root / "upload"

    @property
    def input(self) -> Path:
        return self.root / "input"

    @property
    def output(self) -> Path:
        return self.root / "output"

    @property
    def log(self) -> Path:
        return self.root / "job.log"

    @property
    def result_file(self) -> Path:
        return self.root / "result.json"

    @property
    def error_file(self) -> Path:
        return self.root / "error.json"

    @property
    def analysis(self) -> Path:
        return self.output / "analysis.json"

    @property
    def report(self) -> Path:
        return self.output / "report.md"

    @property
    def overlays_zip(self) -> Path:
        return self.output / "segmentation_overlays.zip"

    @property
    def preview_meta(self) -> Path:
        return self.output / "previews" / "previews.json"

    def preview(self, region: str) -> Path:
        return self.output / "previews" / f"{region}.png"


def case_paths(cases_dir: Path, case_id: str) -> CasePaths:
    if not is_valid_case_id(case_id):
        raise ValueError("invalid case id")
    return CasePaths(Path(cases_dir) / case_id)


def remove_tree(path: Path) -> None:
    shutil.rmtree(path, ignore_errors=True)
