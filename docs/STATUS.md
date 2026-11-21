# Project status and phase review record

Updated 21 November 2026. This is an evidence ledger, not a claim that the gallery is ready for personal media.

| Work | Evidence and result | Integration |
| --- | --- | --- |
| Phase 1, foundation | Ente self-host/fork selected conditionally. Threat, cost, backup and encrypted-payload gates documented and independently reviewed. Both servers have now been inspected read-only; capacity and existing workloads are known, but the intended split and backup remain untested. | PR #1 merged to `master` at `99f1e0c` |
| Phase 2, initial application shell | Fixture-only Home, All Media, albums, search, favorites and viewer. Light and dark themes use `src/tokens.css`; primary accent is `#EF3E4A`. Prior rendered checks and tests passed, but the user rejected its overall design and oversized viewer. | PR #2, #6 and #8 merged. The old visual result was superseded; it is not the accepted MVP design. |
| Phase 2R, photo-first redesign | Rebuilt the fixture library as a date-organized photo grid with Albums, Favorites, Search, and a full-screen viewer with restrained overlay controls and filmstrip. The first independent review rejected low-contrast text and undersized targets; separate commits `fbc8ee1` and `dc1c135` fixed them. Two independent agents re-rendered 320/390px phones, tablet and desktop in both themes, measured normal-text contrast above 4.5:1 and the reported phone targets at least 44×44px, and ran viewer, favorite, album, search, keyboard/focus and theme journeys. Final visual and correctness/accessibility reviews passed at `dc1c135`; three tests and preview build pass. | PR #10 merged to `master` at `cb48938`. **Fixture-only, with no account, import, encryption or persistent media.** |
| Phase 3, secure slice | Official Ente quickstart runs as an isolated, loopback-only local Compose project. A read-only synthetic fixture/audit helper is in draft PR #7. The latest audit found zero users, collections, files and payload objects. Disposable local test credentials and the verification code were rotated after appearing in work logs; no replacement value is in Git. Actual client signup, encrypted upload/download, album mutation, interruption recovery and fresh-client restore remain unverified. | Local evaluation only, outside the repository and both servers. Gate **open**. |
| Phase 6, native preparation | A pinned Ente mobile overlay with Nexo tokens and platform-specific tab bars is committed in an isolated worktree. The native build toolchain and generated bindings are under test; iOS/Android simulator launch, physical-device behavior and visual review are not yet proven. | Preparation only; no native release or installed app. |
| Phase 7, Nexo integration preparation | Trusted-device command boundary and acceptance checks are in `docs/07-nexo-integration.md`. | Contract only; no endpoint or worker runs. |
| Phase 8, home operations preparation | Shutdown/wake and storage templates were reviewed and tested locally. | **Not installed or enabled** on Shuttle. No actual wake, backup or restore test. |

## Read-only host findings

- VPS (`nexo-vps`): 3.7 GiB RAM, about 2 GiB available, 2 GiB swap with about 843 MiB used, 31 GiB free on a 75 GiB root filesystem, and 17 running containers including unrelated services. Docker 29.5.3. No gallery deployment was made. A production Ente database, proxy and catalog are not approved on this host from these numbers alone; measure memory and ingress behavior first.
- Shuttle (`nexo@192.168.68.150`): 15 GiB RAM, about 8.7 GiB available, 69 GiB free on the current 100 GiB root logical volume of a roughly 894 GiB disk, one existing Minecraft container, Docker 29.2.1, no gallery units or `/srv/nexo-gallery`. A separate roughly 466 GiB NTFS disk is unmounted and must be left untouched. Read-only LVM extent inspection needs elevated access; the root volume has not been enlarged. No gallery installation or power-cycle occurred.

## Gates still blocking real media

- Secure slice: no demonstrated client import, encrypted wire payload, encrypted original or thumbnail, catalog sync, download/decryption, interruption recovery or album mutation. The user accepted Ente's signup terms for a disposable local account; local signup and verification remain unfinished. The local evaluation has no real media.
- Backups: independent offsite storage, a consistent object-plus-database snapshot, protected recovery material and a clean restore are absent. Keep all Apple/Samsung originals.
- Operations: Shuttle storage layout, tunnel, stable object endpoint, disk unlock and scheduled wake are unverified on hardware. VPS fit and availability are unproven. No deployment is running on either server.
- Devices and distribution: native background import, representative HEIC/HEVC/HDR/Live/Motion media, real-device tests, branded iPhone signing and Apple Developer Program decision are pending.
- Cost: electricity, offsite hardware/location, domain/tunnel and existing VPS bill are unknown. The $2–3/month incremental target is unproven.

Next dependency: finish the disposable Ente client round trip and inspect exact persisted and wire payloads before any Nexo connection or real-media migration. A separate backup device and clean restore remain mandatory for migration.
