# Project status — where we are

_Last updated: 2026-08-07 · current release: `?v=64`_

A quick "pick up here" note so any new session (or teammate) is instantly in the
picture. Full detail lives in the other `docs/` files and the git history.

## What this is
An animated, multi-language, multi-device **eSIM setup guide + compatibility
checker + troubleshooter** for Telemeteor. Vanilla HTML/CSS/JS, **fully static,
no backend, no build step** — all content is data (`content/**`), so new
languages/devices/models are data edits, not code.

- **Repo (source of truth):** https://github.com/ferenclocsei/telemeteor-esim-guide
- **Live staging (GitHub Pages):** https://ferenclocsei.github.io/telemeteor-esim-guide/
- **Production plan:** telemeteor.com/esim-guide/ — devs copy the repo & deploy
  (see `DEV-QUICKSTART.md` / `INTEGRATION.md`). Not wired up yet.

## Languages
`hu`, `en`, `sr`, `hr` — string parity enforced (same keys in all four).
`hu`/`en` hand-written; `sr`/`hr` machine-drafted (`reviewMeta.machineDraft`) →
**still need a native review** before a hard public launch.
Host site hands off the language via `?lang=`, `window.TELEMETEOR_ESIM_LANG`,
`<html data-esim-lang>`, or postMessage (`telemeteor-esim:set-lang`).

## Device flows (content/structure/)
`ios`, `android-samsung`, `android-pixel`, **`android-xiaomi`** (own variant —
Xiaomi/Redmi/POCO, the most trouble), `android-generic`, plus `troubleshoot`.
Every guide flow: **before-you-start = the *#06#/EID capability check** →
**remove-old-esim** (delete an old eSIM first) → install steps → done.

## Compatibility DB (content/models/catalog.json)
224 models, `lastVerifiedDate` shown in the faint page footer (currently
2026-08-07). Verdicts `yes`/`region`/`no` + per-model `noteKeys`; ambiguous
same-name variants carry a `code` + `aliases` (e.g. Redmi Note 13 Pro **5G**
`2312DRA50G` = supported vs **4G** `23117RA68G` = not). Search is
typo/spacing-tolerant and matches model codes; no match → a "probably not
supported, verify with *#06#" card.

## Troubleshooter (content/structure/troubleshoot.json)
intro → **installed?** → No → **esim-check (*#06#/EID)** → no EID → "phone
doesn't support eSIM"; EID yes → **delete-old** → still failing → support.
"Installed, no internet" path: region → airplane → esim-on → data-line →
roaming → apn → network → restart → support.

## Recent work (newest first)
- 1-page dev quick-start; English integration/deploy docs; host-site language
  hand-off (+ normalize codes, postMessage).
- Troubleshooter gated behind an eSIM-capability check before support.
- Xiaomi split into its own variant; model-code disambiguation (Redmi Note 13);
  typo-tolerant search + "probably unsupported" fallback; faint DB-updated footer.
- Custom hand-drawn line-icon set (js/icons.js) — no emoji as UI chrome anywhere.
- Animated phone screens (spinner/toggles/scan/checkmark/confetti), all
  `prefers-reduced-motion` aware.

## How to verify (regression harness, tools/)
Open with a local static server (`python3 -m http.server 8123` at repo root):
- `tools/flow-audit.html?lang=hu[&os=android-xiaomi]` — every step × os/delivery
  × language: missing strings, rings off-screen, ring-vs-label. Expect 0.
- `tools/app-audit.html?lang=hu` — walks the real app in an iframe at 375×812:
  nav below fold, stacked screens, empty titles. Expect nav ≤ ~778/812.
- `tools/icon-gallery.html`, `tools/svg-audit.html`, `tools/ts-audit.html` —
  visual grids. `tools/check-sources.py` — content-freshness watchdog.

## Hard rules (don't regress)
- **No real customer data** in the repo — ICCID/SM-DP+/EID/names are fictional.
- Bump `?v=NN` on every CSS/JS change (browsers cache aggressively).
- Keep string parity across the 4 languages.
- Repo is the source of truth — deploy *from* it; don't hand-edit a server copy.
- Deploying via GitHub Actions needs the `workflow` token scope (the assistant's
  token lacks it) — the ready workflow YAML is in `INTEGRATION.md`/`DEV-QUICKSTART.md`
  for a human to add.

## Open / next
- Wire telemeteor.com production deploy (devs; pick sub-path vs sub-domain, CI vs
  cron — `INTEGRATION.md` §3).
- Native `sr`/`hr` review.
- Possible future: Windows/Huawei device families; more model codes as concrete
  cases surface (add `code`+`aliases`+source).
- Optional: transfer repo to a Telemeteor GitHub org / add devs as collaborators.

## Other docs
`DEV-QUICKSTART.md` (1-page deploy), `INTEGRATION.md` (full integration/deploy),
`content-authoring-guide.md` (add a language/device/model; DB freshness process),
`research-todo.md` (open re-verification items + Xiaomi findings & sources).
