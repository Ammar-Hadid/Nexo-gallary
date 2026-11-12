# Nexo Gallery

Private personal media library under development. The [foundation decision](docs/01-foundation.md) records the selected reuse strategy, privacy boundaries, costs, phased acceptance gates, and blocked hardware work.

No deployed or integrated gallery exists yet. The initial application shell will use labeled synthetic fixtures. Do not import personal media until the secure vertical slice, backup, and recovery gates pass.

## Prototype

Run `python3 -m http.server 4173` from the repository root, then open `http://localhost:4173`. Run `node --test src/model.test.js` for fixture search tests. There are no package dependencies. See [visual system](docs/02-design.md).

If local ports are unavailable, run `npm run preview` and open `dist/preview.html` directly in a browser. This generated file stays out of Git.

All photos, album names, search results, indexing progress and online/offline states are sample data. The fixture photos are loaded from Unsplash and require a network connection. The shell has no authentication, encryption, import, persistent storage, or integration with Ente/Nexo; do not put personal media into it.
