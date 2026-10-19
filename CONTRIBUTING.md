# Contributing to PodcastAI

Thanks for considering a contribution. Issues, discussions and PRs are all
welcome.

## Getting set up

Backend: Python 3.10 or newer, `pip install -r Backend/requirements.txt`, then `python Backend/app.py`. Frontend: `cd frontend && npm install && npm start`.

## Running the checks

`pip install "pymupdf>=1.24" "pypdf>=3.0" pandas pytest` then `pytest -q` from the repo root. CI runs the backend tests and ruff on every PR.

## Ground rules

- Open an issue or discussion before large changes, so effort isn't wasted.
- Keep PRs focused: one change per PR.
- New behavior needs a test where the repo has a test suite.
- CI must pass before merge.

## Licensing

By contributing you agree your contributions are licensed under the repo's
MIT license.
