# Project status and phase review record

Updated 13 November 2026. This is an evidence ledger, not a claim that the gallery is ready for personal media.

| Work | Evidence and result | Integration |
| --- | --- | --- |
| Phase 1, foundation | Ente self-host/fork selected conditionally. Threat, cost, backup and encrypted-payload gates documented. Independent correctness and security review found six issues; fix commits `1109ef1` and `2ddf053` addressed them. Fresh review found no phase-1 actionable defect. `ssh nexo-vps` failed locally before authentication with `Operation not permitted`; actual VPS state remains unknown. | GitHub PR #1 merged to `master` at `99f1e0c` |
| Phase 2, application shell | Fixture-only home, All Media, albums, search, favorites and viewer implemented on `phase/02-shell`. Two model tests and JS syntax checks pass. Independent reviewers found mobile navigation, modal focus, filtered navigation, false empty states, and misleading album covers; separate fix commits `9a26cae`, `b187705`, `a157400` were re-reviewed with no remaining static findings in their scope. | Draft PR #2, **not merged**. Actual rendered phone/tablet/desktop review remains blocked: local HTTP bind returned `PermissionError: Operation not permitted`; browser policy rejected `file://` and explicitly forbade a workaround. Do not claim responsive visual acceptance. |
| Phase 8, home operations preparation | Guarded shutdown timer, RTC alarm plan/readback, bounded drain lease, stay-awake override and DST tests. Independent reviewers found a 31-hour late-wake risk, an abort drain leak, a boolean transfer-count bug, missing runtime directory, stale lease recovery, malformed lease reclaim, and a concurrent reclaim race. Separate fix commits address them. Eleven local tests pass; fresh re-review found no actionable issue in the preparation scope. | Prep reviewed; **not installed or enabled**. Actual hardware, ingress producer, S5 wake and backup remain unverified. |
| Phase 8, storage preparation | Isolated home object-store Compose template, guarded systemd boot unit, mount/Engine/readiness checks and backup/restore/update runbook. Review found mount misbinding, older Engine exposure, missing readiness, inconsistent backup boundary, and stale container reuse; separate fixes were re-reviewed. Fifteen Python tests, Compose syntax and loopback checks pass with dummy values. | Prep reviewed; **not installed**. Image digest, credentials, bucket, tunnel, VPS catalog, immutable object snapshot, hardware and restore remain unverified. |

## Gates still blocking real media

- Secure vertical slice: Ente Museum, database and S3 store were not run because Docker socket access is denied here. No encrypted import/download/recovery or Nexo album mutation has been demonstrated.
- VPS: current capacity, ingress and isolated deployment cannot be inspected until SSH transport works.
- Home: wait for the user-provided Shuttle alias. No attempt has been made to find or access it.
- Backups: independent offsite storage, consistent database and object snapshots, separate recovery material and a tested clean restore are absent. Keep all Apple/Samsung originals.
- Distribution: branded iPhone app signing and the Apple Developer Program decision are pending; the fixture shell is not a substitute.
- Costs: electricity, offsite hardware/location, domain/tunnel and existing VPS bill are unknown. The $2–3/month incremental target is unproven.

Next dependency: enable a permitted browser-rendering path to inspect the phase-2 shell at phone/tablet/desktop sizes; separately enable local container testing or provide suitable isolated runtime access for the Ente secure slice. Neither requires the Shuttle alias, and neither is claimed done.
