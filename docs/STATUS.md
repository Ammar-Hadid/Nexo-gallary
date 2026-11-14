# Project status and phase review record

Updated 14 November 2026. This is an evidence ledger, not a claim that the gallery is ready for personal media.

| Work | Evidence and result | Integration |
| --- | --- | --- |
| Phase 1, foundation | Ente self-host/fork selected conditionally. Threat, cost, backup and encrypted-payload gates documented and independently reviewed. Both servers have now been inspected read-only; capacity and existing workloads are known, but the intended split and backup remain untested. | PR #1 merged to `master` at `99f1e0c` |
| Phase 2, application shell | Fixture-only Home, All Media, albums, search, favorites and viewer. Light and dark themes use `src/tokens.css`; primary accent is `#EF3E4A`. Independent reviews found focus, contrast and tablet layout issues; fixes were committed and re-reviewed. Rendered browser checks covered 320, 390, 741, 768, 820 and 1440 px, keyboard navigation, search, viewer and theme switching. Three tests pass. | PR #2 merged to `master` at `e1bb91c`. **No personal media, authentication or encrypted storage in this shell.** |
| Phase 3, secure slice | Official Ente quickstart was run as a disposable, loopback-only local Compose project. Museum and Postgres are healthy; web, object storage and proxy containers run. The account and asset tables are empty. Client signup and synthetic-media upload remain untested; source inspection is not a substitute for exact wire and storage evidence. | Local evaluation only, outside the repository and both servers. Gate **open**. |
| Phase 7, Nexo integration preparation | Trusted-device command boundary and acceptance checks are in `docs/07-nexo-integration.md`. | Contract only; no endpoint or worker runs. |
| Phase 8, home operations preparation | Shutdown/wake and storage templates were reviewed and tested locally. | **Not installed or enabled** on Shuttle. No actual wake, backup or restore test. |

## Read-only host findings

- VPS (`nexo-vps`): 3.7 GiB RAM, about 2 GiB available, 2 GiB swap with about 843 MiB used, 31 GiB free on a 75 GiB root filesystem, and 17 running containers including unrelated services. Docker 29.5.3. No gallery deployment was made. A production Ente database, proxy and catalog are not approved on this host from these numbers alone; measure memory and ingress behavior first.
- Shuttle (`nexo@192.168.68.150`): 15 GiB RAM, about 8.7 GiB available, 69 GiB free on the current 100 GiB root logical volume of a roughly 894 GiB disk, one existing Minecraft container, Docker 29.2.1, no gallery units or `/srv/nexo-gallery`. A separate roughly 466 GiB NTFS disk is unmounted and must be left untouched. Read-only LVM extent inspection needs elevated access; the root volume has not been enlarged. No gallery installation or power-cycle occurred.

## Gates still blocking real media

- Secure slice: no demonstrated client import, encrypted wire payload, encrypted original or thumbnail, catalog sync, download/decryption, interruption recovery or album mutation. The local test account requires the user's own acceptance of Ente's signup terms. The local evaluation has no real media.
- Backups: independent offsite storage, a consistent object-plus-database snapshot, protected recovery material and a clean restore are absent. Keep all Apple/Samsung originals.
- Operations: Shuttle storage layout, tunnel, stable object endpoint, disk unlock and scheduled wake are unverified on hardware. VPS fit and availability are unproven. No deployment is running on either server.
- Devices and distribution: native background import, representative HEIC/HEVC/HDR/Live/Motion media, real-device tests, branded iPhone signing and Apple Developer Program decision are pending.
- Cost: electricity, offsite hardware/location, domain/tunnel and existing VPS bill are unknown. The $2–3/month incremental target is unproven.

Next dependency: finish the disposable Ente client round trip and inspect exact persisted and wire payloads before any Nexo connection or real-media migration. A separate backup device and clean restore remain mandatory for migration.
