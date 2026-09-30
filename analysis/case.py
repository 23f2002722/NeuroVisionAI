from dataclasses import dataclass


@dataclass
class CasePaths:
    reconstruction_input: str | None = None
    segmentation_input: str | None = None
    reconstruction_reference: str | None = None