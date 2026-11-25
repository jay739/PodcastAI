# Backlog

Work on this repo that is understood well enough to start. Ordered by impact if
left undone, not by effort. Each item names the files it touches and ends with a
"Done when" line. Items that need outside discussion go to GitHub Issues
instead. Drop an item once it is done.

## B-1: The web backend lives only on a wip snapshot branch

- **Status:** open
- **Size:** M
- **Touches:** `Backend/web_app.py`, `Backend/config.py`, `Backend/services/`,
  `Backend/requirements-macos.txt`, and whatever `main` currently holds under
  `backend/` (lowercase, a different and older layout).
- **Why:** the service behind `jay739.dev/ai-tools` runs from branch
  `wip/mac-podcast-web-2026-05` (commit `e2a6d45`) and exists nowhere on `main`.
  When the only checkout of it was removed from the Mac during a duplicate
  cleanup, the branch was the single surviving copy, and recovering the service
  meant cloning a `wip/` snapshot. A production service whose code is reachable
  only from a snapshot branch is one stale-branch deletion away from being gone.
  `main` also still carries the older `backend/` tree, so the two layouts have to
  be reconciled rather than one simply copied over the other.
- **Watch out:** `main`'s `Backend/requirements.txt` cannot build on current
  macOS or Python 3.12, and omits ten modules the code imports. Promote
  `requirements-macos.txt` alongside the code, or the next fresh install repeats
  the failure. `Backend/voice_models` is a symlink into a separate local
  checkout, so it must not be promoted as-is.
- **Done when:** the web backend's code is on `main`, a fresh clone of `main`
  plus the pinned requirements file starts the service and answers
  `GET /web/v1/health`, and the launchd agent points at a `main` checkout rather
  than a `wip/` one.
