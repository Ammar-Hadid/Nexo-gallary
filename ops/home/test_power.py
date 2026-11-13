import json
import tempfile
import unittest
from unittest.mock import patch
from datetime import datetime, timezone
from pathlib import Path

from power import next_wake, idle_ready, override_active, within_shutdown_window, request_drain, release_drain, run_shutdown


class PowerTests(unittest.TestCase):
    def test_spring_dst_transition(self):
        wake = next_wake(datetime(2027, 3, 27, 22, 0, tzinfo=timezone.utc))
        self.assertEqual(wake.isoformat(), "2027-03-28T07:00:00+02:00")
        self.assertEqual(wake.astimezone(timezone.utc).isoformat(), "2027-03-28T05:00:00+00:00")

    def test_autumn_dst_transition(self):
        wake = next_wake(datetime(2027, 10, 30, 21, 0, tzinfo=timezone.utc))
        self.assertEqual(wake.isoformat(), "2027-10-31T07:00:00+01:00")
        self.assertEqual(wake.astimezone(timezone.utc).isoformat(), "2027-10-31T06:00:00+00:00")

    def test_after_midnight_next_wake_is_same_morning_but_shutdown_is_forbidden(self):
        late = datetime(2027, 1, 1, 23, 1, tzinfo=timezone.utc)  # 00:01 local Jan 2
        self.assertEqual(next_wake(late).isoformat(), "2027-01-02T07:00:00+01:00")
        self.assertFalse(within_shutdown_window(late))
        self.assertTrue(within_shutdown_window(datetime(2027, 1, 1, 22, 5, tzinfo=timezone.utc)))
        self.assertFalse(within_shutdown_window(datetime(2027, 1, 1, 22, 10, tzinfo=timezone.utc)))

    def test_idle_requires_fresh_drained_checkpoint(self):
        now = datetime(2027, 1, 1, 22, 0, tzinfo=timezone.utc)
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "idle.json"
            state = {"observed_at": now.timestamp(), "active_transfers": 0, "jobs_checkpointed": True, "ingress_drained": True}
            path.write_text(json.dumps(state))
            self.assertTrue(idle_ready(now, path))
            state["ingress_drained"] = False
            path.write_text(json.dumps(state))
            self.assertFalse(idle_ready(now, path))
            state["ingress_drained"] = True
            state["observed_at"] -= 31
            path.write_text(json.dumps(state))
            self.assertFalse(idle_ready(now, path))
            state["observed_at"] = now.timestamp()
            state["active_transfers"] = False
            path.write_text(json.dumps(state))
            self.assertFalse(idle_ready(now, path))

    def test_drain_lease_releases_on_abort_and_requires_matching_checkpoint(self):
        now = datetime(2027, 1, 1, 22, 0, tzinfo=timezone.utc)
        with tempfile.TemporaryDirectory() as folder:
            request = Path(folder) / "drain-request.json"
            idle = Path(folder) / "idle.json"
            lease = request_drain(now, request)
            self.assertEqual(json.loads(request.read_text())["lease_id"], lease)
            idle.write_text(json.dumps({"observed_at": now.timestamp(), "active_transfers": 0, "jobs_checkpointed": True, "ingress_drained": True, "lease_id": "wrong"}))
            self.assertFalse(idle_ready(now, idle, lease))
            release_drain(lease, request)
            self.assertFalse(request.exists())

    def test_expired_crash_lease_is_reclaimed_next_night(self):
        first = datetime(2027, 1, 1, 22, 0, tzinfo=timezone.utc)
        next_night = datetime(2027, 1, 2, 22, 0, tzinfo=timezone.utc)
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "drain-request.json"
            first_lease = request_drain(first, path)
            with self.assertRaises(SystemExit):
                request_drain(first, path)
            second_lease = request_drain(next_night, path)
            self.assertNotEqual(first_lease, second_lease)
            self.assertEqual(json.loads(path.read_text())["lease_id"], second_lease)

    def test_malformed_expired_lease_requires_manual_inspection(self):
        now = datetime(2027, 1, 1, 22, 0, tzinfo=timezone.utc)
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "drain-request.json"
            path.write_text(json.dumps({"expires_at": 0}))
            with self.assertRaises(SystemExit):
                request_drain(now, path)
            self.assertEqual(json.loads(path.read_text()), {"expires_at": 0})

    def test_invalid_override_fails_closed(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "stay-awake-until"
            path.write_text("invalid")
            self.assertTrue(override_active(datetime.now(timezone.utc), path))

    def test_late_run_never_arms_or_powers_off(self):
        with patch('power.os.geteuid', return_value=0), patch('power.ENABLE') as enabled, patch('power.within_shutdown_window', return_value=False), patch('power.request_drain') as drain, patch('power.subprocess.run') as command:
            enabled.is_file.return_value = True
            run_shutdown()
            drain.assert_not_called()
            command.assert_not_called()

    def test_override_after_drain_releases_lease(self):
        with patch('power.os.geteuid', return_value=0), patch('power.ENABLE') as enabled, patch('power.within_shutdown_window', return_value=True), patch('power.override_active', side_effect=[False, True]), patch('power.request_drain', return_value='lease'), patch('power.release_drain') as release, patch('power.subprocess.run') as command:
            enabled.is_file.return_value = True
            run_shutdown()
            release.assert_called_once_with('lease')
            command.assert_not_called()


if __name__ == "__main__":
    unittest.main()
