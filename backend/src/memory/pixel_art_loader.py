import yaml
from typing import List


def load_pixel_art_cover_from_yaml(path: str) -> List[List[str]]:
    with open(path, "r") as f:
        data = yaml.safe_load(f)

    if isinstance(data, list) and all(isinstance(row, list) for row in data):
        return data
    else:
        raise ValueError(f"Invalid pixel art cover format in {path}")
