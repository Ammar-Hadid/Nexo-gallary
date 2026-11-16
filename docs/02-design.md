# Nexo Gallery visual system

Phase 2 prototype. All media in the shell are fixtures. No personal media or server connection is present.

## Direction

The shell opens directly to a dense, date-organized photo library. A narrow navigation rail on desktop becomes a four-item tab bar on phones. Photo tiles are square with tight gutters; the viewer gives the image the full viewport and places small controls, metadata, and a thumbnail strip over it. Manrope, neutral gray surfaces, and the red primary color provide a quiet frame around the media. Light and dark themes use neutral backgrounds without a green cast.

## Principles

1. Open on the photos themselves. Albums, Favorites, and Search are always one step away.
2. Let the viewer fill the screen; tapping the image hides its controls. Swipe or use arrow keys to move through photos, and use the thumbnail strip to jump.
3. Describe the fixture boundary precisely. Favorites are temporary, and original files are not connected.
4. Keep tap targets and focus visible; support keyboard navigation and reduced motion.
5. Keep controls small and secondary to the media.

## Tokens and themes

[`src/tokens.css`](../src/tokens.css) is the source of truth for the light and dark palettes, typeface, panel radius, photo spacing, and page gutter. The primary token is `--color-primary: #EF3E4A`. Derived `--color-primary-text` and `--color-primary-action` darken or lighten the accent where small text needs stronger contrast. Changing the primary token updates the brand mark, active navigation, selection lines, focus outline, and primary actions. Component styles use these variables rather than fixed palette values. Manrope is bundled locally under `assets/fonts` with its Open Font License, so the UI does not need a font request to an external service.

The theme toggle appears in the header. Its label announces the destination theme to assistive technology. The shell starts from the device preference, then remembers an explicit choice in local storage.

The fixture photographs load from Unsplash for visual review only. A production encrypted gallery must render user media from authenticated, client-decrypted local blobs; it must not transmit private media URLs to an external image host.
