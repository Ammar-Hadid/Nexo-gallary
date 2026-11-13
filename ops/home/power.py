#!/usr/bin/env python3
"""Guarded Nexo Gallery shutdown coordinator. Not installed or enabled by default."""

import argparse
import json
import os
from pathlib import Path
import subprocess
import time
from datetime import datetime, timedelta, time as wall_time, timezone
from zoneinfo import ZoneInfo

ZONE = ZoneInfo("Europe/Amsterdam")
ENABLE = Path("/etc/nexo-gallery/power-enabled")
IDLE = Path("/run/nexo-gallery/idle.json")
OVERRIDE = Path("/run/nexo-gallery/stay-awake-until")
WAKEALARM = Path("/sys/class/rtc/rtc0/wakealarm")


def next_wake(now: datetime) -> datetime:
    """07:00 local on the calendar day following the shutdown day."""
    local = now.astimezone(ZONE)
    next_day = local.date() + timedelta(days=1)
    return datetime.combine(next_day, wall_time(7), ZONE)


def override_active(now: datetime, path: Path = OVERRIDE) -> bool:
    if not path.exists():
        return False
    try:
        return int(path.read_text().strip()) > int(now.timestamp())
    except (ValueError, OSError):
        return True  # An invalid override never permits shutdown.


def idle_ready(now: datetime, path: Path = IDLE) -> bool:
    """An integration must refresh this after ingress has stopped new transfers."""
    try:
        state = json.loads(path.read_text())
        age = now.timestamp() - float(state["observed_at"])
        return 0 <= age <= 30 and state["active_transfers"] == 0 and state["jobs_checkpointed"] is True and state["ingress_drained"] is True
    except (OSError, ValueError, KeyError, TypeError):
        return False


def run_shutdown() -> None:
    if os.geteuid() != 0 or not ENABLE.is_file():
        raise SystemExit("Power workflow disabled: root and /etc/nexo-gallery/power-enabled required")
    deadline = time.monotonic() + 600  # Wait at most ten minutes; never force active jobs off.
    while time.monotonic() < deadline:
        now = datetime.now(timezone.utc)
        if override_active(now):
            print("Stay-awake override active; shutdown skipped")
            return
        if idle_ready(now):
            break
        time.sleep(5)
    else:
        print("No fresh drained/idle checkpoint within ten minutes; shutdown skipped")
        return

    wake = next_wake(datetime.now(timezone.utc))
    expected = int(wake.timestamp())
    subprocess.run(["rtcwake", "-m", "no", "-t", str(expected)], check=True)
    actual = int(WAKEALARM.read_text().strip())
    if abs(actual - expected) > 5:
        raise SystemExit(f"RTC alarm mismatch: expected {expected}, read {actual}; shutdown aborted")
    if override_active(datetime.now(timezone.utc)) or not idle_ready(datetime.now(timezone.utc)):
        raise SystemExit("Transfer/override state changed before poweroff; shutdown aborted")
    print(f"RTC alarm verified for {wake.isoformat()}; requesting clean poweroff", flush=True)
    subprocess.run(["systemctl", "poweroff"], check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["plan", "run"])
    args = parser.parse_args()
    if args.action == "plan":
        wake = next_wake(datetime.now(timezone.utc))
        print(json.dumps({"next_wake_local": wake.isoformat(), "next_wake_utc": wake.astimezone(timezone.utc).isoformat(), "epoch": int(wake.timestamp()), "enabled": ENABLE.is_file()}))
    else:
        run_shutdown()


if __name__ == "__main__":
    main()
