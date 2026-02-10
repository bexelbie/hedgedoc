# CriticMarkup Comments

This fork of HedgeDoc adds support for **CriticMarkup comments** — a lightweight
way to leave inline annotations on collaborative documents.

## Syntax

To add a comment, wrap your text in `{>>` and `<<}`:

```markdown
The quick brown fox {>> Is it really brown? <<} jumped over the lazy dog.
```

You can place a comment anywhere in your Markdown. The text between the markers
is the comment body and does not appear as normal document content.

## How comments appear

### Edit mode (editor pane)

In the editor, CriticMarkup comments are syntax-highlighted so they are easy to
spot. You can **collapse or expand** all comments in the editor using the
toolbar toggle button, which is helpful when comments are long or numerous.

### View mode — wide screens (≥ 993 px)

On wide screens, comments appear as **margin annotations** in a right-hand
column beside the document content, similar to the comment experience in Google
Docs or Word:

- A small **comment icon** remains inline in the text to show where the comment
  is anchored.
- The full comment text is displayed in a **side bubble** in the margin,
  visually connected to its anchor.
- When several comments are close together they **stack vertically**. After five
  consecutive stacked bubbles a **"+N more comments"** pill appears; click it to
  expand the remaining comments.
- Side bubbles **reposition automatically** when you resize the window.

### View mode — narrow screens or Both mode

When the viewport is narrower than 993 px, or when you are using **Both mode**
(the split editor + preview layout), there is not enough room for a margin
column. In this case comments fall back to the **inline pill** style:

- Each comment is rendered as a small **pill icon** in the text.
- Click the pill to open a **popover** showing the full comment text.

### Published / pretty-print view

Comments are **stripped entirely** from the published view and the pretty-print
output, so readers see a clean document without annotations.

## Hiding and showing comments

A **"Hide/Show comments"** toggle is available in the **Table of Contents menu**
(the <i class="fa fa-bars"></i> sidebar). This toggle controls **all** comment
UI — inline pills, popovers, and margin side bubbles — so you can quickly
switch between a clean reading view and an annotated review view without
affecting the underlying Markdown.

## Night mode

All comment UI elements — pills, popovers, and margin bubbles — are fully
styled for **night mode** and adapt automatically when you switch themes.

## Quick reference

| Context | Comment appearance |
|---|---|
| **Edit mode** | Syntax-highlighted in the editor; collapsible via toolbar button |
| **View mode, wide screen** (≥ 993 px) | Margin side bubbles with inline anchor icons |
| **View mode, narrow screen** (< 993 px) | Inline pill + click-to-open popover |
| **Both mode** (split view) | Inline pill + click-to-open popover |
| **Published / pretty-print view** | Comments are hidden (stripped) |

## Tips

- Keep comment text concise — margin bubbles are most readable when they are
  short.
- Use the "Hide/Show comments" toggle to get a distraction-free reading
  experience while reviewing a document.
- Remember that comments are **never visible** in the published version of a
  note, so you can freely annotate without worrying about public readers.
