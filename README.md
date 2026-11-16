# Nexo Gallery

Private personal media library under development. The [foundation decision](docs/01-foundation.md) records the selected reuse strategy, privacy boundaries, costs, phased acceptance gates, and blocked hardware work.

No deployed or integrated gallery exists yet. The initial application shell uses labeled sample fixtures. Do not import personal media until the secure vertical slice, backup, and recovery gates pass.

## Prototype

Run `python3 -m http.server 4173` from the repository root, then open `http://localhost:4173`. Run `npm test` for fixture search and shell structure checks. There are no package dependencies. See [visual system](docs/02-design.md).

If local ports are unavailable, run `npm run preview` and open `dist/preview.html` directly in a browser. This generated file stays out of Git.

The photo timeline, albums, search results, and video poster are sample data. Favorites last for the current page session; only the theme choice is saved. Fixture photos are loaded from Unsplash and require a network connection. The shell has no authentication, encryption, media import, persistent gallery storage, or integration with Ente/Nexo; do not put personal media into it.

## Home operations preparation

Home operations preparation is in [the power guide](ops/home/OPERATIONS.md) and [storage/recovery guide](ops/home/STORAGE_AND_RECOVERY.md). These are uninstalled templates and cannot be used for personal media yet. See the [phase status](docs/STATUS.md) for exact blockers.
