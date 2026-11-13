import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from verify_storage import verify
from check_storage_ready import wait_ready


class StorageTests(unittest.TestCase):
    def test_mount_uuid_and_engine_gate(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)
            calls = []
            def runner(args, **_):
                calls.append(args)
                return SimpleNamespace(returncode=0, stdout="fixture-uuid\n" if args[0] == "findmnt" else "28.0.0\n")
            verify(path, "fixture-uuid", runner)
            self.assertEqual([call[0] for call in calls], ["findmnt", "docker"])

    def test_missing_or_wrong_mount_fails_before_docker(self):
        with tempfile.TemporaryDirectory() as folder:
            def runner(args, **_):
                self.assertEqual(args[0], "findmnt")
                return SimpleNamespace(returncode=1, stdout="")
            with self.assertRaises(SystemExit):
                verify(Path(folder), "expected", runner)

    def test_old_engine_fails(self):
        with tempfile.TemporaryDirectory() as folder:
            def runner(args, **_):
                return SimpleNamespace(returncode=0, stdout="fixture-uuid\n" if args[0] == "findmnt" else "27.5.1\n")
            with self.assertRaises(SystemExit):
                verify(Path(folder), "fixture-uuid", runner)

    def test_readiness_success_and_failure(self):
        wait_ready(attempts=2, sleeper=lambda _: None, checker=lambda: True)
        with self.assertRaises(SystemExit):
            wait_ready(attempts=2, sleeper=lambda _: None, checker=lambda: False)


if __name__ == "__main__":
    unittest.main()
