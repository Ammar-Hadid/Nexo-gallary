# Nexo Gallery visual system

Phase 2 prototype. All media and infrastructure states in the shell are fixtures. No personal media or server connection is present.

## Direction

Three directions considered: a dark cinematic gallery, a warm editorial archive, and a dense utility browser. The editorial archive was chosen: warm neutral canvas, near-black type, a restrained terracotta action color, generous image space, and compact controls. It makes the images the most colorful part of the interface while retaining the clarity of a daily gallery.

## Principles

1. Search is always one step away; All Media is always visible.
2. Show a small meaningful starting view, then let browsing expand naturally.
3. State the availability of every action and original precisely. A simulated state must say it is simulated.
4. Use motion to preserve context. Respect reduced motion.
5. Favor readable labels over icon-only ambiguity, especially for destructive actions.

## Tokens

| Role | Value | Use |
| --- | --- | --- |
| Canvas | `#f6f5f1` | Main background |
| Surface | `#fffefa` | Search and menus |
| Ink | `#222722` | Text and navigation |
| Muted | `#667069` | Secondary text |
| Line | `#dedfd8` | Dividers and focus boundaries |
| Accent | `#a44f3d` | Primary action and selected state |
| Soft accent | `#f1e5df` | Selection background |
| Display | Georgia, Times New Roman, serif | Editorial headings |
| UI | system sans | Controls and metadata |
| Radius | 12 / 20 / 30 px | Controls / photos / featured panels |
| Spacing | 4, 8, 12, 16, 24, 32, 48, 72 px | Consistent rhythm |

The fixture photographs load from Unsplash for visual review only. A production encrypted gallery must render user media from authenticated, client-decrypted local blobs; it must not transmit private media URLs to an external image host.
