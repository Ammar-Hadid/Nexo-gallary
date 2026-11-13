# Nexo Gallery: foundation decision

Status: phase 1 candidate, 13 November 2026. This document describes a target architecture, not an operational system.

## Decision

Use Ente's self-hosted Photos server and clients as the **production media foundation**, initially unmodified. Build the Nexo visual and interaction shell as a separate, explicitly fixture-backed prototype until an encrypted integration with the self-hosted protocol is demonstrated. A branded Nexo mobile client requires a maintained Ente client fork or an independently implemented compatible client; this has not been delivered. Do not claim the shell is a secure gallery or connect it to personal media.

Ente already supplies client-side encryption, mobile backup, native apps, local face and semantic indexing, encrypted index synchronization, export, and a self-hostable server. Its server issues presigned S3 URLs: both clients and server must reach the **same storage endpoint**. The home object store therefore needs a stable, authenticated TLS route; a VPS catalog alone cannot make an offline home server serve an uncached original. The precise VPS/home split, storage routing, and power schedule require integration testing. Prefer an outbound home tunnel to an isolated VPS ingress if its security and bandwidth are acceptable; no tunnel is deployed yet.

The VPS appears too crowded for an assumed new database, Ente server, and proxy based on prior observations. Current inspection is blocked: on 13 November 2026, `ssh -o BatchMode=yes -o ConnectTimeout=8 nexo-vps ...` from this execution sandbox failed before login with `Operation not permitted` (exit 255). The user later supplied the Shuttle SSH target; its read-only connection also failed before authentication with `Operation not permitted`. These establish local TCP access failures, not either server's health or capacity. Re-run read-only `uptime`, `free -h`, `df -h /`, `docker ps`, and `docker system df` when SSH transport is available. No VPS or Shuttle deployment or capacity claim is authorized by this document.

## Bounded comparison

| Criterion | Ente self-host/fork | Fresh custom clients and service |
| --- | --- | --- |
| Encryption and recovery | Existing end-to-end design and recovery key; must test recovery in our topology | Would need protocol, key lifecycle, migration, and multi-platform audit |
| Background import | Existing iOS/Android apps, subject to OS scheduling and permissions; branded fork must be tested | Native import and persistent queues required on both platforms |
| Desktop and tablet | macOS/Windows/Linux desktop and iOS/Android clients exist; verify tablet UX | Five device classes to implement |
| Search | On-device face and semantic search with encrypted synced indexes; library-wide OCR is unverified and separately scoped | Must build all indexes and cross-device sync |
| Maintenance | Large upstream monorepo and branded fork merge burden | Complete security and platform maintenance burden |
| License | AGPL-3.0 repository; preserve notices, offer corresponding source where applicable, review dependencies | New code can use a chosen license, dependencies still matter |
| Hosting | Museum, Postgres, reachable S3-compatible store; default quickstart is not production topology | Flexible, but requires equivalent dependable infrastructure |
| Export/migration | Ente CLI export and self-host endpoint configuration exist; test round trip and metadata | Must build interoperable export from scratch |

Decision gate: demonstrate self-hosted one-asset import, encrypted object, export and recovery using disposable fixtures before binding the Nexo shell to real data or forking a native client. Also prove a representative album creation and asset-addition round trip through an authorized **trusted client or local worker** that holds the necessary keys, with explicit IDs, idempotency and offline failure behavior. Ente has no supported public third-party API; its CLI offers authenticated automation and raw API calls, but neither is evidence that arbitrary assistant album mutations encrypt correctly. Inspect the exact implementation and wire payloads before committing to that path. If the direct-storage endpoint or mutation path cannot work safely with scheduled home downtime, revisit this decision with measurements. Avoid a parallel home-grown cryptosystem.

Sources: [Ente repository and license](https://github.com/ente-io/ente), [self-host quickstart](https://help.ente.io/self-hosting/), [object storage upload path](https://help.ente.io/self-hosting/administration/object-storage), [on-device search](https://help.ente.io/photos/features/search-and-discovery/machine-learning), [no public API](https://help.ente.io/photos/faq/advanced-features/), [CLI automation](https://help.ente.io/cli/automation/), [Apple background upload](https://developer.apple.com/documentation/photokit/uploading-asset-resources-in-the-background), [Android background transfer](https://developer.android.com/develop/background-work/background-tasks/data-transfer-options).

## Trust and threat model

- Trusted client: imports and encrypts media and sensitive catalog fields before upload; decrypts and indexes locally. Use platform key storage. A compromised trusted device or malicious update can read plaintext and keys.
- VPS: sees account identifiers, timing, object sizes, IP addresses, and traffic volume, and may deny service. It must not receive media, thumbnail, OCR, face, semantic index plaintext or user-content keys.
- Home server: stores encrypted objects and derived content. Physical theft or disk compromise must not reveal user content. Automatic boot with a disk passphrase requires a reviewed unlock strategy; do not silently store an unlock secret alongside the disk.
- Lost recovery secret plus loss of all signed-in devices can make the library permanently unreadable. Test account recovery and keep a separately protected copy of the recovery material. A backup of ciphertext alone is not a recovery plan.
- Server authentication and metadata behavior of the exact Ente version need audit before deployment. Encrypted catalog fields must be confirmed against protocol traces. No private asset goes to external AI services.
- Existing Apple/Samsung/cloud backup copies are separate and remain unchanged.

## Cost and capacity ledger

| Item | Estimate / status | Decision |
| --- | --- | --- |
| Existing VPS | Existing bill unknown; incremental cost assumed $0, capacity unverified | Inspect before deployment |
| Primary Shuttle SSD | 960 GB nominal, approximately 894 GiB; 500 GB source library plus previews, metadata and growth may fit initially | Measure real media and free space |
| Independent full backup | Separate physical failure domain with room for encrypted objects, catalog/configuration and versions; disk/device and offsite placement costs unknown | Required before migration; not covered by $2–3/month |
| Electricity | 16 h/day runtime; at 15–40 W and €0.25–0.40/kWh, roughly €1.80–€7.68/month | Measure wall power and tariff |
| Domain/DNS/tunnel | Existing ownership and tunnel cost unknown | Confirm before public endpoint |
| Apple distribution | $99/year or local price for Developer Program; free Personal Team profiles expire after 7 days | Branded iPhone release decision pending |
| New cloud storage | $0 selected | No 500 GB paid cloud substitution |

This does **not** establish that total recurring cost meets the $2–3 target. Apple membership alone averages about $8.25/month if purchased. [Apple membership](https://developer.apple.com/programs/whats-included/), [free provisioning](https://developer.apple.com/help/account/basics/about-your-developer-account).

## Recovery and operations gates

1. Preserve source phone libraries until counts, hashes where possible, metadata samples, and restores are checked.
2. Back up encrypted objects and a consistent Postgres/catalog snapshot, album and correction metadata, and configuration in a separate physical failure domain (offsite). Protect recovery material separately from ciphertext and verify that backups form one restorable version. A second disk next to the Shuttle alone does not cover theft or fire. The VPS's prior 35 GiB free cannot hold a full 500 GB copy. No source deletion until an offsite restore and client decryption pass. Budget, location, transfer time and media for this backup remain unresolved.
3. Test restore into a fresh environment and decrypt on a newly authorized trusted device. Verify interrupted uploads and duplicate-safe retries.
4. Schedule shutdown at 23:00 and power-on at 07:00 Europe/Amsterdam with a bounded transfer grace period, job checkpoint, stay-awake override, and verified next wake alarm. Test both summer-to-winter and winter-to-summer boundaries, including the alarm's UTC/local interpretation. Systemd can shut down; only firmware RTC or a separate always-on wake path can power on. Test RTC, disk unlocking, network and service startup on actual hardware later. No power-cycle test now.
5. Publish real health only from measured probes; missing heartbeat means unknown/offline, never a fabricated green state.

## Phases and gates

| Phase | Acceptance gate | Current state |
| --- | --- | --- |
| 1 Foundation | Research decision, threat/cost ledger, real VPS inspection or exact reproducible transport blocker, independent review | In progress; local TCP connection denied before login |
| 2 Shell | Responsive home, all media, albums, search, viewer and offline/partial states with marked fixtures; rendered phone/tablet/desktop review | Pending |
| 3 Secure slice | Disposable asset encrypted before upload, stored, synced, decrypted, recovered after interruption; representative album create/add through trusted client or local worker; inspect persisted originals, thumbnails/previews, album names, sensitive metadata and any present OCR/search-index payloads plus VPS traffic for plaintext content or keys | Pending hardware-independent local test |
| 4 Library | Reversible album/favorite/archive changes, duplicates and explicit trash semantics at scale | Pending |
| 5 Search | Trusted-device semantic, people, metadata and explicit OCR indexing; offline and incomplete index tests; inspect generated OCR, face and semantic payloads on server for encryption | Pending |
| 6 Devices | Native background imports, share sheet, desktop, tablet, iPhone signing/distribution preparation; real OS checks | Pending devices/signing |
| 7 Nexo API | Authenticated scoped commands through trusted worker, idempotent operations and offline outcome | Pending |
| 8 Operations | Isolated VPS deployment if capacity permits, Shuttle install package, tunnel, backups and power tooling; simulated states | VPS and Shuttle deployment blocked |
| 9 Release | Actual Shuttle, offsite restore, representative HEIC/HEVC/HDR/Live/Motion media, power and migration verification; inventory every source asset, flag size/format failures and retain excluded items explicitly | Shuttle target provided, SSH transport blocked; offsite backup device unresolved |

Dependent phases advance only after their gates pass. The shell may be built independently while secure topology is unresolved, but remains a prototype. Each phase is committed before fresh-context review; fixes get separate commits and another review.
