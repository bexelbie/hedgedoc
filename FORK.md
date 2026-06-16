# Fork Notes (bex-master)

This repository tracks HedgeDoc **v1 only**.
Upstream `master` is treated as the v1 line, and this fork rebases from one v1 release tag to the next (not onto v2 branches/tags).

## Operations Runbook

For deployment and operational procedures, see:

- https://github.com/bexelbie/hedgedoc-container/blob/master/FORK.md

## Tracking Policy

- Base branch policy: `upstream/master` (v1 line)
- Release update policy: rebase `bex-master` onto the latest upstream `1.x` tag
- Current release base: `1.10.7`

Typical update flow:

1. `git fetch upstream --tags`
2. Identify latest `1.x` tag
3. `git checkout bex-master`
4. `git rebase <latest-1.x-tag>`
5. Resolve conflicts, run tests, and force-push the branch

## Fork Patches

Each section documents a logical patch carried above upstream `1.10.7`.
The canonical detail is the commit history (`git log upstream/master..bex-master`).

### 1. CI workflow branch targeting

Update GitHub Actions workflow triggers from `master` to `bex-master` and add
`feature/**` branch support. The artifact-upload condition is also updated to
reference `refs/heads/bex-master`.

**Files changed:**
- `.github/workflows/build-and-test.yml` — branch triggers and artifact condition
- `.github/workflows/lint.yml` — branch triggers

**Commits:** `a9e28ab47`

### 2. WCAG author color palette and color normalization

Two closely related changes to author color handling:

**Color normalization** (`lib/realtime.js`, `public/js/index.js`): Add a
`normalizeColor()` function that converts multiple input formats (`0x`-prefixed
hex, `rgb()` notation, short hex like `#f00`) to standard `#rrggbb`. Invalid
inputs fall back to `#ff00ff`. Results are cached for performance. All color
assignment paths in `realtime.js` now call through this normalizer.

**WCAG palette** (`lib/author-color-palette.js`): Replace the Chance.js random
color generator with a pre-validated palette of 212 colors that meet WCAG 3:1
contrast ratio against both light (`#ffffff`) and dark (`#0d0d0d`) editor
backgrounds. Colors are assigned deterministically via MD5 hash of the user ID,
so the same user always gets the same color. Falsy user IDs (`null`, `undefined`,
empty string) map to an `'anonymous-user'` fallback key before hashing.
The palette is also used by `lib/letter-avatars.js` (which generates default
user avatars).

**Files changed:**
- `lib/realtime.js` — `normalizeColor()` function, all color assignment call sites
- `public/js/index.js` — client-side color normalization calls
- `lib/author-color-palette.js` — new file; palette generation and `getColorForUserId()`
- `lib/letter-avatars.js` — switched from Chance.js to palette-based color selection
- `test/author-color-palette.js` — new file; 18 tests for palette integrity and contrast

**Commits:** `bcdc4ee5b`, `65666396d`

### 3. Guest author identity persistence

Replace Chance.js random name/color generation for anonymous users with
deterministic identities derived from the socket session ID via UUID v5. Guest
names are formatted as `Guest <8-char-uuid-prefix>` and colors are pulled from
the WCAG palette using the derived UUID. This means a guest who reconnects to
the same note keeps the same name and color.

In-memory author entries are created for guests (bypassing the database foreign
key constraint on the `Authors` table). Guest authors found in existing
authorship data are backfilled on note load. The `tempUsers` and `updateHistory`
code paths are guarded to skip database lookups for guest UUIDs.

**Files changed:**
- `lib/realtime.js` — guest UUID namespace constant, UUID v5 derivation, in-memory author map, backfill logic, `tempUsers`/`updateHistory` guards

**Commits:** `8d761310b`

### 4. Authorship styling and color toggle

Two visual changes to how author colors appear in the editor and user list:

**Styling improvements** (`public/js/index.js`): Inline authorship highlighting
switches from a thin bottom-border gradient to a semi-transparent background
highlight (`rgba` at 0.35 alpha). The online user list now applies a
`border-left` color indicator to all users (including guests without profile
photos) and sets an explicit `background-color` on user icons. Users missing
color data fall back to `#999`.

**Toggle button** (header, CSS, JS): A paint-brush icon (`fa-paint-brush`) in
the navbar toggles author color visibility on and off. When hidden, a
`body.hide-author-colors` class suppresses inline backgrounds and gutter
borders via CSS. State is persisted in `localStorage` under the key
`authorColorsVisible` (default: visible). The button updates `aria-pressed`
for accessibility.

**Files changed:**
- `public/js/index.js` — authorship highlight style, user list color indicators, toggle logic
- `public/css/index.css` — `.hide-author-colors` rule set
- `public/js/lib/editor/ui-elements.js` — toggle button element reference
- `public/views/hedgedoc/header.ejs` — toggle button markup in navbar

**Commits:** `45c25ebbd`, `34e32af28`

### 5. Light theme status bar

Add comprehensive light-theme CSS for the CodeMirror status bar. A
`.status-bar.editor-light-theme` class provides background, border, text,
input, dropdown, hover, and focus styling appropriate for light backgrounds.
The class is dynamically applied/removed when the editor theme changes.
Also increases the baseline opacity of theme/spellcheck toggles from 0.2 to
0.5 for better visibility in both themes.

**Files changed:**
- `public/css/index.css` — `.status-bar.editor-light-theme` rule set, toggle opacity
- `public/js/lib/editor/index.js` — dynamic class application on theme change

**Commits:** `59472d7f1`

### 6. CriticMarkup comment support

Three commits that add full CriticMarkup comment (`{>> comment <<}`) handling
across editor, preview, and view modes.

**Editor hiding/showing** (`public/js/lib/editor/index.js`): A toolbar toggle
(`#toggleCritic`, `fa-commenting-o` icon) switches between raw markup and
collapsed view. In collapsed mode, comments are replaced by atomic CodeMirror
marker widgets displaying a lozenge glyph (◊) with a tooltip showing the
comment text. Moving the cursor near a marker auto-reveals the raw text;
moving away re-hides it after a 150 ms debounce. Copy/cut operations expand
the selection to include adjacent hidden comment ranges so clipboard content
is complete. State is persisted in a `critic-markup-hidden` cookie. The regex
uses a tempered greedy token (`(?!\{>>)`) to avoid matching across comment
boundaries.

**Preview rendering** (`public/js/lib/markdown-it-critic-comment.js`): A new
markdown-it plugin parses `{>> comment <<}` syntax and renders each comment as
a clickable pill icon (`<i class="fa fa-comment">`). Clicking a pill toggles a
popover below it showing the full comment text; clicking outside dismisses it.
Night-mode styling is included. The spellcheck, editor-theme, and critic
toggles are moved from the status bar into the toolbar. A "Hide/Show comments"
entry is added to the TOC menu (both dropdown and sidebar). Comments are
stripped from the published (`/s/`) view.

**Margin side-bubbles** (`public/js/extra.js`, `public/css/extra.css`): On wide
screens (≥ 993 px) in view mode, comments render as Google Docs-style margin
annotations in the right column instead of inline pills. Bubbles are positioned
relative to their inline anchors with vertical stacking (4 px gap) and a
collapsed "+N more" pill when more than 5 stack consecutively. A debounced
resize handler recalculates layout. Narrow screens and Both mode fall back to
inline pills with popovers. Margin bubbles are stripped from the published
view. The `entities` npm package is added as a dependency for HTML entity
decoding in bubble text.

**Files changed:**
- `public/js/lib/editor/index.js` — editor marker/reveal/clipboard logic
- `public/js/lib/editor/toolbar.html` — `#toggleCritic` button, menu restructure
- `public/js/lib/editor/statusbar.html` — toggles removed (moved to toolbar)
- `public/js/lib/markdown-it-critic-comment.js` — new file; markdown-it plugin
- `public/js/index.js` — plugin registration, toggle wiring, state sync
- `public/js/extra.js` — margin bubble positioning and layout logic
- `public/js/pretty.js` — comment stripping in published view
- `public/css/extra.css` — margin bubble, pill, popover, and night-mode styles
- `public/css/index.css` — pill/popover base styles (some moved to extra.css)
- `public/css/ui/toolbar.css` — toolbar critic toggle and relocated control styles
- `package.json` — `entities` dependency added
- `yarn.lock` — lockfile update
- `docs/content/references/criticmarkup-comments.md` — new file; user-facing reference
- `docs/mkdocs.yml` — nav entry for CriticMarkup docs

**Commits:** `b87a1541b`, `90015d573`, `a0279aa77`

### 7. Download and copy-to-clipboard menu options

Add export actions to the header dropdown menu:

**Download "Markdown no Comments"**: Downloads a `.md` file with all
CriticMarkup comments (`{>> ... <<}`) stripped using the regex
`/\{>>[\s\S]*?<<\}/g` (non-greedy, multiline-safe).

**Copy to Clipboard** (four variants): Markdown, Markdown no Comments, HTML
(rendered preview), and Raw HTML. Each option closes the dropdown and shows a
brief green toast notification at the top of the page that auto-dismisses
after 1.5 seconds.

**Files changed:**
- `public/js/index.js` — download handler, clipboard copy handlers, toast logic
- `public/js/extra.js` — export helper wiring
- `public/js/lib/editor/ui-elements.js` — new element references for menu items
- `public/views/hedgedoc/header.ejs` — menu markup for download and copy options

**Commits:** `ba5e6c179`

### 8. Marp Preview button

Add a "Marp Preview" item to the editor's extra dropdown menu, next to the
existing "Slide Mode" entry.

On click, the handler checks whether the note's YAML frontmatter (first 500
characters) contains `marp: true`. If found, it opens the marp-server
companion service at `/watch/{noteId}` in a new tab, triggering live-synced
Marp rendering. If not found, it shows a red toast notification prompting
the user to add `marp: true` to their frontmatter.

The marp-server base URL is read from `window.marpServerURL` (for
server-side injection) with a fallback of `http://localhost:8080`.

**Files changed:**
- `public/views/hedgedoc/header.ejs` — "Marp Preview" `<li>` in the extra menu
- `public/js/lib/editor/ui-elements.js` — `marpPreview` jQuery selector
- `public/js/index.js` — click handler with frontmatter check and URL construction

**Commits:** `fbe06bf5c`

### 9. Marp Download button

Add a "Marp Download" item to the editor's extra dropdown menu, directly
after the "Marp Preview" entry.

On click, the handler checks whether the note's YAML frontmatter (first 500
characters) contains `marp: true`. If found, it opens the marp-server
companion service bundle endpoint at `/{noteId}/bundle.tar.gz` in a new tab,
downloading the rendered Marp bundle (`bundle.tar.gz`). If not found, it
shows a red toast notification prompting the user to add `marp: true` to
their frontmatter.

The marp-server base URL is read from the `meta[name="marp-server-url"]` tag
(the same source the Marp Preview button uses), with fallbacks of
`window.marpServerURL` and then `http://localhost:8080`. If the note does
not exist or is not watched, marp-server returns a 404 — no client-side
existence check is performed.

**Files changed:**
- `public/views/hedgedoc/header.ejs` — "Marp Download" `<li>` in the extra menu
- `public/js/lib/editor/ui-elements.js` — `marpDownload` jQuery selector
- `public/js/index.js` — click handler with frontmatter check and bundle URL construction

**Commits:** `465272641`
