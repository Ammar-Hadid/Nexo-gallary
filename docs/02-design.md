# Nexo Gallery visual system

Phase 2 prototype. All media and infrastructure states in the shell are fixtures. No personal media or server connection is present.

## Direction

Three directions considered: a dark cinematic gallery, a warm editorial archive, and a dense utility browser. The editorial archive was chosen: neutral surfaces, near-black type in light mode, a deep charcoal canvas in dark mode, a clear red primary color, generous image space, and compact controls. It keeps the media central while retaining the clarity of a daily gallery.

## Principles

1. Search is always one step away; All Media is always visible.
2. Show a small meaningful starting view, then let browsing expand naturally.
3. State the availability of every action and original precisely. A simulated state must say it is simulated.
4. Use motion to preserve context. Respect reduced motion.
5. Favor readable labels over icon-only ambiguity, especially for destructive actions.

## Tokens and themes

[`src/tokens.css`](../src/tokens.css) is the source of truth for the light and dark palettes, typefaces, main radii, and page gutter. The primary token is `--color-primary: #EF3E4A`. Small red text uses a darker blend in light mode and a lighter blend in dark mode to meet contrast requirements; both are derived from the primary token. Changing that one token updates the related text and selection colors. Component styles use these variables rather than fixed palette values.

The theme toggle appears in the header. Its pressed state announces dark mode to assistive technology. The shell starts from the device preference, then remembers an explicit choice in local storage. The prototype's sample media and simulated server state remain unchanged between themes.

The fixture photographs load from Unsplash for visual review only. A production encrypted gallery must render user media from authenticated, client-decrypted local blobs; it must not transmit private media URLs to an external image host.
