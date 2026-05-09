# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A vanilla JavaScript Kanban board (no build tools, no frameworks, no dependencies). Open `index.html` directly in a browser to run — there is no dev server or install step.

## Architecture

Three files, no module system:

- **`index.html`** — Static HTML with three columns (`todo`, `inprogress`, `done`) identified by `data-column` attributes. Initial cards are hardcoded. The add-card modal is always in the DOM, shown/hidden via the `.open` CSS class.
- **`app.js`** — Single `'use strict'` script. State is three module-level variables (`draggingCard`, `targetColumn`, `addTargetColumn`). All event listeners are attached at startup (bottom of file: `attachCardEvents` + `updateAllCounts`). Dynamically created cards go through `createCard()` which calls `escapeHtml()` and `attachCardEvents()` — both must be called for any new card.
- **`style.css`** — Column accent colors use `[data-column="todo"] .card`, etc. The `.open` toggle on `.modal-overlay` switches `display: none` ↔ `display: flex`.

## Key Patterns

- **Drag & Drop**: `dragstart`/`dragend` on cards; `dragover`/`dragleave`/`drop` on `.card-list` elements. Drop position is determined by `getCardAfterPoint()` (midpoint heuristic). A `.drop-indicator` div is inserted/removed on every `dragover` to show insertion position.
- **Card counts**: `updateAllCounts()` re-queries all `.card` elements inside each `.card-list` after any structural change (drop, add). Call it whenever cards are added, moved, or removed.
- **XSS prevention**: `escapeHtml()` must be used for any user-supplied text injected into `innerHTML`.
- **Modal submit**: Ctrl+Enter (or Cmd+Enter) triggers `submitCard()`, same as clicking the add button.
- **UI language**: Card text and button labels are in Korean; column titles (To-Do / In Progress / Done) are in English.
