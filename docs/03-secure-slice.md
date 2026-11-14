# Secure Ente vertical slice: evidence record

Status: in progress, 14 November 2026. Use synthetic media only. This record distinguishes source inspection from observed behavior.

## Disposable local environment

The official Ente quickstart generated an isolated Compose project outside this repository at `/tmp/nexo-ente-evaluation/my-ente`. Its Museum, web and object-store ports bind to `127.0.0.1`; Postgres has no host port. The Compose project is `nexo_ente_eval`. Existing local containers and both remote hosts were left alone. The generated configuration and reusable disposable test code have restricted local permissions and are not committed.

Observed: Museum `/ping` and the web app return HTTP 200; Museum and Postgres report healthy; all five containers run. Before signup, the local `users`, `collections` and `files` tables each contain zero rows. These checks establish service startup only.

The local Ente web signup requires agreement to Ente's terms. The user must accept these personally. The restricted local hardcoded test code is reusable until its configuration is removed; remove it after signup. A disposable account and synthetic upload have not yet been completed.

## Protocol evidence available from source

At upstream source commit `c2e571c599222ef6f8349dcc638bf23e0d885e21`, `web/packages/gallery/services/upload/upload-service.ts` calls `encryptFile` before `uploadToBucket`. That function encrypts the file stream, thumbnail and metadata with a generated file key, then encrypts that key with the collection key. The upload path sends encrypted bytes to a presigned object-store URL. `web/packages/new/photos/services/collection.ts` encrypts a collection name and key before `postCollections`; adding files encrypts their keys under the destination collection key before posting `/collections/add-files`.

This source reading does **not** prove the running image matches that commit, that the browser follows this exact path, or that persisted server and object-store values contain no plaintext. The database schema still accepts a legacy plaintext collection-name field. Inspect actual requests and stored rows before calling the slice secure.

## Required live proof

1. Create only a disposable account and upload the synthetic marker image. Capture request *field names, sizes and redacted value shapes* for file creation and collection mutation; never record authorization headers, session tokens, signed object-store URLs or their query strings, OTPs, passwords, recovery keys or ciphertext that may embed account data. Record only the endpoint class and opaque object ID for presigned requests. Verify encrypted bytes precede object-store PUT, and that the marker and PNG header are absent from stored original and thumbnail objects.
2. Inspect the exact database rows for encrypted metadata, encrypted file keys, decryption headers, object IDs and collection fields. Check that plaintext filenames, test marker, album titles and sensitive metadata are absent from database fields and ordinary service logs. Record the running image digests alongside the result.
3. Sign in from a fresh browser context, sync the catalog, download and decrypt the synthetic asset, and compare its bytes with the original SHA-256. Test account recovery on a newly authorized client while protecting the recovery key.
4. Interrupt an upload at the object-store boundary, restart the client and verify the remote result has one stable asset ID and no orphaned or duplicate object. If the Ente web client cannot provide that guarantee, record its actual behavior and keep the phase gate open.
5. Create an encrypted album, add the explicit synthetic asset, refresh and verify the same album and asset IDs. Inspect the create/add request and persisted collection rows. Deliberately lose an acknowledgement and establish safe reconciliation or a visible halt before claiming Nexo command support.
6. Export the asset with the supported Ente client and verify its media bytes and metadata. If OCR, face, semantic or other search-index payloads are generated, inspect their persisted and transmitted forms for plaintext. Repeat the content/key boundary inspection on the intended VPS path before any remote deployment is called secure.

No personal media, Shuttle storage, VPS ingress, real backup or migration is part of this disposable test. The local proof is one sub-gate. Phase 3 closes only after the live proof, the VPS path check, an independent review of the evidence and a clean retest of any fixes.
