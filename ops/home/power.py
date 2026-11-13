#!/usr/bin/env python3
"""Guarded Nexo Gallery shutdown coordinator. Not installed or enabled by default."""

import argparse
import json
import os
from pathlib import Path
import subprocess
import time
import uuid
from datetime import datetime, timedelta, time as wall_time, timezone
from zoneinfo import ZoneInfo

ZONE = ZoneInfo("Europe/Amsterdam")
ENABLE = Path("/etc/nexo-gallery/power-enabled")
IDLE = Path("/run/nexo-gallery/idle.json")
REQUEST = Path("/run/nexo-gallery/drain-request.json")
OVERRIDE = Path("/run/nexo-gallery/stay-awake-until")
WAKEALARM = Path("/sys/class/rtc/rtc0/wakealarm")


def next_wake(now: datetime) -> datetime:
    """The next upcoming 07:00 in Amsterdam, even across midnight and DST."""
    local = now.astimezone(ZONE)
    today_seven = datetime.combine(local.date(), wall_time(7), ZONE)
    if local < today_seven:
        return today_seven
    return datetime.combine(local.date() + timedelta(days=1), wall_time(7), ZONE)


def within_shutdown_window(now: datetime) -> bool:
    local = now.astimezone(ZONE)
    return local.hour == 23 and local.minute < 10


def override_active(now: datetime, path: Path = OVERRIDE) -> bool:
    if not path.exists():
        return False
    try:
        return int(path.read_text().strip()) > int(now.timestamp())
    except (ValueError, OSError):
        return True  # An invalid override never permits shutdown.


def idle_ready(now: datetime, path: Path = IDLE, lease_id: str | None = None) -> bool:
    """An integration must refresh this after ingress has stopped new transfers."""
    try:
        state = json.loads(path.read_text())
        age = now.timestamp() - float(state["observed_at"])
        count = state["active_transfers"]
        return (0 <= age <= 30 and type(count) is int and count == 0
                and state["jobs_checkpointed"] is True and state["ingress_drained"] is True
                and (lease_id is None or state["lease_id"] == lease_id))
    except (OSError, ValueError, KeyError, TypeError):
        return False


def request_drain(now: datetime, path: Path = REQUEST) -> str:
    try:
        existing = json.loads(path.read_text())
    except FileNotFoundError:
        existing = None
    except (OSError, ValueError) as error:
        raise SystemExit(f"Unreadable drain lease; manual inspection required: {error}") from error
    if existing is not None:
        try:
            lease = existing["lease_id"]
            valid_id = type(lease) is str and len(lease) == 32 and all(char in "0123456789abcdef" for char in lease)
            expired = valid_id and type(existing["expires_at"]) is int and existing["expires_at"] <= int(now.timestamp())
        except (TypeError, KeyError):
            expired = False
        if not expired:
            raise SystemExit("An active or malformed drain lease exists; shutdown aborted")
        path.unlink()  # Expired leases have already required the producer to resume.
    lease_id = uuid.uuid4().hex
    payload = json.dumps({"lease_id": lease_id, "expires_at": int(now.timestamp()) + 720})
    # Exclusive creation fails closed if another operation owns the drain.
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w") as handle:
        handle.write(payload)
        handle.flush()
        os.fsync(handle.fileno())
    return lease_id


def release_drain(lease_id: str, path: Path = REQUEST) -> None:
    try:
        if json.loads(path.read_text()).get("lease_id") == lease_id:
            path.unlink()
    except (OSError, ValueError):
        pass  # Producer must also resume on the lease expiry.


def run_shutdown() -> None:
    if os.geteuid() != 0 or not ENABLE.is_file():
        raise SystemExit("Power workflow disabled: root and /etc/nexo-gallery/power-enabled required")
    now = datetime.now(timezone.utc)
    if not within_shutdown_window(now) or override_active(now):
        print("Outside shutdown window or stay-awake override active; shutdown skipped")
        return
    lease_id = request_drain(now)
    poweroff_requested = False
    try:
        deadline = time.monotonic() + 600  # Never force active jobs off.
        while time.monotonic() < deadline and within_shutdown_window(datetime.now(timezone.utc)):
            now = datetime.now(timezone.utc)
            if override_active(now):
                print("Stay-awake override active; shutdown skipped")
                return
            if idle_ready(now, lease_id=lease_id):
                break
            time.sleep(5)
        else:
            print("No fresh drained/idle checkpoint in the window; shutdown skipped")
            return

        now = datetime.now(timezone.utc)
        if not within_shutdown_window(now):
            raise SystemExit("Shutdown window expired before alarm setup")
        wake = next_wake(now)
        expected = int(wake.timestamp())
        subprocess.run(["rtcwake", "-m", "no", "-t", str(expected)], check=True)
        actual = int(WAKEALARM.read_text().strip())
        if abs(actual - expected) > 5:
            raise SystemExit(f"RTC alarm mismatch: expected {expected}, read {actual}; shutdown aborted")
        now = datetime.now(timezone.utc)
        if not within_shutdown_window(now) or override_active(now) or not idle_ready(now, lease_id=lease_id):
            raise SystemExit("Window/transfer/override changed before poweroff; shutdown aborted")
        print(f"RTC alarm verified for {wake.isoformat()}; requesting clean poweroff", flush=True)
        subprocess.run(["systemctl", "poweroff"], check=True)
        poweroff_requested = True
    finally:
        if not poweroff_requested:
            release_drain(lease_id)


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
