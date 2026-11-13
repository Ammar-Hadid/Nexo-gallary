import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from power import next_wake, idle_ready, override_active


class PowerTests(unittest.TestCase):
    def test_spring_dst_transition(self):
        wake = next_wake(datetime(2027, 3, 27, 22, 0, tzinfo=timezone.utc))
        self.assertEqual(wake.isoformat(), "2027-03-28T07:00:00+02:00")
        self.assertEqual(wake.astimezone(timezone.utc).isoformat(), "2027-03-28T05:00:00+00:00")

    def test_autumn_dst_transition(self):
        wake = next_wake(datetime(2027, 10, 30, 21, 0, tzinfo=timezone.utc))
        self.assertEqual(wake.isoformat(), "2027-10-31T07:00:00+01:00")
        self.assertEqual(wake.astimezone(timezone.utc).isoformat(), "2027-10-31T06:00:00+00:00")

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

    def test_invalid_override_fails_closed(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "stay-awake-until"
            path.write_text("invalid")
            self.assertTrue(override_active(datetime.now(timezone.utc), path))


if __name__ == "__main__":
    unittest.main()
