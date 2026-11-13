#!/usr/bin/env python3
"""Require measured object-store readiness before the boot unit succeeds."""

import time
from urllib.request import urlopen
from urllib.error import URLError

URL = "http://127.0.0.1:3200/minio/health/ready"


def probe(opener=urlopen) -> bool:
    try:
        with opener(URL, timeout=2) as response:
            return response.status == 200
    except (URLError, TimeoutError, OSError):
        return False


def wait_ready(attempts=15, sleeper=time.sleep, checker=probe) -> None:
    for attempt in range(attempts):
        if checker():
            return
        if attempt + 1 < attempts:
            sleeper(2)
    raise SystemExit("Object store did not become ready; boot unit failed")


if __name__ == "__main__":
    wait_ready()
