#!/usr/bin/env python3
"""Fail closed unless the intended unlocked filesystem and Docker are ready."""

import os
from pathlib import Path
import subprocess


def verify(path: Path, expected_uuid: str, runner=subprocess.run) -> None:
    if not path.is_absolute() or path.is_symlink() or not path.is_dir():
        raise SystemExit("Object data path is not an existing absolute directory")
    if not expected_uuid or expected_uuid.startswith("REPLACE_"):
        raise SystemExit("Expected unlocked filesystem UUID is not configured")
    mount = runner(["findmnt", "--mountpoint", str(path), "-n", "-o", "UUID"], capture_output=True, text=True, check=False)
    if mount.returncode != 0 or mount.stdout.strip() != expected_uuid:
        raise SystemExit("Object data mount missing or filesystem UUID differs; startup aborted")
    engine = runner(["docker", "version", "--format", "{{.Server.Version}}"], capture_output=True, text=True, check=False)
    try:
        major = int(engine.stdout.strip().split(".")[0])
    except ValueError:
        major = 0
    if engine.returncode != 0 or major < 28:
        raise SystemExit("Docker Engine 28+ required for safe localhost port publishing")


if __name__ == "__main__":
    verify(Path(os.environ.get("NEXO_OBJECT_DATA_DIR", "/srv/nexo-gallery/objects")), os.environ.get("NEXO_OBJECT_FS_UUID", ""))
