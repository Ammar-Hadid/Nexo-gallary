# Nexo integration contract, preparation

Status: design contract only, 13 November 2026. No endpoint, worker, relay, or Ente mutation described here is running. This is scoped to Gallery commands, not a new assistant service.

## Boundary

Nexo may request an action, but an authorized **trusted device or local worker** must perform content encryption, album mutations requiring keys, and plaintext search. The VPS can coordinate opaque requests and statuses only after its authentication and storage behavior have been verified. It cannot receive a media file, album title, search phrase, OCR text, face data, semantic vector, plaintext result, or a user-content key. A remote assistant therefore cannot inspect private search results on the VPS. A trusted client may display results to its signed-in user; any future encrypted result relay needs a separate protocol and privacy review.

Use one adapter at the trusted-client boundary rather than a Gallery microservice. A local Nexo process may call it through OS-protected IPC or a loopback interface with short-lived, audience-bound credentials. A remote Nexo process needs authenticated, end-to-end encrypted delivery to an online trusted worker; that delivery is **not designed or implemented** here. Do not expose a loopback listener to the LAN or accept an ordinary bearer token as proof that a remote caller may receive plaintext.

Ente self-hosted has no supported third-party API contract. Before implementing album writes or import through its clients, demonstrate a disposable create/add round trip and inspect encrypted wire and persisted payloads. Do not rely on raw CLI calls as proof of correct encryption. If the tested Ente version cannot support a maintained adapter, revisit the foundation decision before shipping this interface.

## Requested operations

| Operation | Input to trusted adapter | Output | Offline behavior |
| --- | --- | --- | --- |
| `gallery.import` | Local file handle or OS share item, optional target album ID, caller-generated idempotency key | Operation ID; eventual asset ID(s) and per-item errors | Accept a queue item only after a durable, encrypted local snapshot is staged; never claim uploaded before server acknowledgement |
| `gallery.search` | Query and optional date, location, person, type, album filters; limit and cursor | Matching asset IDs, local preview handles, index coverage and continuation | Search downloaded index only; report coverage as partial, including on a newly added device |
| `gallery.album.create` | Title and idempotency key | Album ID and operation status | Queue only where encrypted mutation can be persisted locally and reconciled safely; otherwise `worker_unavailable` |
| `gallery.album.add_assets` | Album ID, explicit asset IDs, idempotency key | Per-asset outcome and operation status | Queue only with a verified local mutation journal; otherwise `worker_unavailable` |

Identifiers are opaque and scoped to this library. Names and search phrases stay on the trusted device. A remote request cannot include plaintext sensitive input unless the request transport is end-to-end encrypted for that worker and the caller is authorized to send it. No operation accepts arbitrary filesystem paths from a remote caller. Import reads only a user-selected file/share handle or a narrowly granted import location.

The adapter authenticates the Nexo caller and authorizes scopes independently: `gallery.import`, `gallery.search`, `gallery.album.write`. Search results and local file handles are released only to a caller authorized on that trusted device. Deny unknown assets, cross-library IDs, expired credentials, and scope mismatches. Reconfirm device authorization after recovery or account sign-out. Store credentials and content keys in platform security facilities, never in request logs or command-line arguments.

Before accepting an offline import, copy the selected source into a durable, encrypted device-local queue, record its content identity and length, and verify the staged copy is readable. Bind the idempotency record to that snapshot, not only to an ephemeral file path or share handle. Fail visibly on insufficient space, revoked access or staging failure without returning `queued`. Retain the staged encrypted bytes through retry and server acknowledgement; verify integrity before upload and remove the queue copy only after acknowledgement and local journal commit. A later edit to the original source is a new import request. Never delete the stock-camera original.

## Operation and retry semantics

An accepted mutation returns a durable opaque operation ID and one of `queued`, `running`, `completed`, or `failed`. `completed` means the target system has acknowledged the intended result, not merely that a request was accepted. If no trusted worker or encrypted delivery path is reachable, reject **before acceptance** with `worker_unavailable` or `requires_trusted_device` and no operation ID; no queue or polling claim is made. Include a retryable flag and a stable, non-sensitive error code, never a plaintext asset title or query in telemetry. Polling a status requires the same caller authorization as creating the operation.

An idempotency key is unique within caller, library and operation type and bound to a canonical request digest, including the original issuance time and staged import's content identity. Replaying the same key and request returns the original operation and asset IDs; replaying it with different arguments fails. Keep mappings for all unresolved operations through reconciliation, and for at least 90 days after completion. Reject a new mutation request more than 90 days after its original issuance time; an already accepted pending operation continues through its durable journal and status ID. This prevents an old replay from becoming a new album after mapping cleanup. Test the retention window against Ente's queue before release. Asset content hashes alone are insufficient to identify edited variants or motion-photo components. Multi-item imports expose per-item state and can resume after interruption without deleting phone originals.

If no trusted worker is reachable, reject with `worker_unavailable` promptly. If a worker is online but lacks required index content, return partial search coverage. If a remote caller has no encrypted delivery path, reject with `requires_trusted_device`. Never silently run plaintext search on the VPS, fabricate results, or mark a queued item independently backed up.

## Acceptance before implementation is called working

1. Verify caller authentication, scope denial, request expiry, replay behavior and same-key/different-payload rejection on a trusted device.
2. Import one synthetic asset, interrupt and resume, and prove one encrypted server object and one stable asset ID. With home storage offline, restart the client, revoke the share handle and change the source after queue acceptance; the encrypted snapshot must still upload exactly once. Test failed staging and cleanup. Inspect thumbnails, album fields, metadata and relevant indexes for plaintext leakage.
3. Create an album and add explicit asset IDs through the exact self-hosted client protocol; restart the worker and verify state and idempotency. Test delayed replay after a long offline queue, replay after completion and rejection of an expired request without duplicate albums.
4. Search on a device with a complete local index, a partial new-device index and no worker. Check the coverage and unavailable responses. Test both pre-acceptance remote failures: no worker and no encrypted delivery path; neither returns a pollable operation ID.
5. Verify sign-out/recovery revokes local authorization and no content or keys appear in VPS logs or persisted coordination data.

Phase 7 cannot pass until the secure vertical slice and these tests pass. The user must be able to see whether an action is queued, uploaded, indexed, or independently backed up as separate facts.
