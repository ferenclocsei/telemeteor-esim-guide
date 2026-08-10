# Telemeteor eSIM guide — developer integration & deployment

This is the hand-off doc for the telemeteor.com developers. The eSIM setup guide
+ compatibility checker + troubleshooter is a **fully static site**: plain
HTML/CSS/JS plus JSON/SVG content. **No backend, no database server, no build
step.** You deploy it by copying the files; it runs from any static web server.

- **Source of truth:** the GitHub repo `ferenclocsei/telemeteor-esim-guide`.
  All development happens there; you deploy *from* it. Do not hand-edit the copy
  on the production server — changes must flow repo → server so nothing is lost.
- **Live preview / staging:** `https://ferenclocsei.github.io/telemeteor-esim-guide/`
  (GitHub Pages, always the latest committed version).

---

## 1. Deploying to telemeteor.com

Serve the **entire repo** (everything except `.git/`, `docs/`, and `tools/`,
which are not needed at runtime but are harmless if copied) from one directory.

Recommended: a sub-path on the main domain, e.g. `https://www.telemeteor.com/esim-guide/`.

**Important — relative paths.** The app loads its content with relative URLs
(`content/…`, `assets/…`, `css/…`, `js/…`). So it must be served from the root
of its own folder. If `index.html` is at `/esim-guide/index.html`, everything
resolves automatically. Do **not** rewrite the asset URLs.

Minimum files needed at runtime:

```
index.html
css/      js/      assets/illustrations/      content/
```

Cache-busting is already handled: every CSS/JS include carries `?v=NN`, bumped on
each release, and JSON/SVG is fetched with `no-cache`. No special cache rules
required; a normal static host is fine.

Sub-domain (`esim.telemeteor.com`) and `<iframe>` embedding both work too — see
§2 for how the language is passed in each case.

---

## 2. Language hand-off (telemeteor.com decides the language)

The guide ships four languages: **hu, en, sr, hr**. When it opens, it should
appear in the **same language the visitor is using on telemeteor.com**. The
guide resolves its language in this priority order:

1. **`?lang=` URL parameter** — the simplest hand-off. Link/redirect to the guide
   with the current language: `…/esim-guide/?lang=hu`.
2. **Injected global (best for server-side templating)** — if telemeteor.com
   renders the page from a template, set the language before the scripts run,
   either way below:
   ```html
   <!-- option A: a global set before js/i18n.js loads -->
   <script>window.TELEMETEOR_ESIM_LANG = "hu";</script>
   <!-- option B: an attribute on the root element -->
   <html data-esim-lang="hu">
   ```
3. **`postMessage` (for the `<iframe>` case, switches live)** — if the guide is
   embedded and the user changes language on telemeteor.com, tell the iframe:
   ```js
   iframe.contentWindow.postMessage(
     { type: "telemeteor-esim:set-lang", lang: "hu" }, "*"
   );
   ```
4. Falls back to the visitor's browser language, then Hungarian.

**Accepted language codes.** Anything that maps onto the four supported
languages is accepted and normalized, so you can pass your own site's codes
directly: `hu`, `hu-HU`, `magyar`, `en`, `en-US`, `sr`, `sr-Latn`, `sr-Cyrl`,
`srp`, `hr`, `hr-HR`, `hrv`, … Unsupported codes fall back gracefully. The
in-guide language switcher stays available regardless.

> Note: `sr`/`hr` strings are currently machine-drafted (`reviewMeta.machineDraft`
> in `content/strings/*.json`) and should get a native review before a hard
> public launch. `hu`/`en` are hand-written.

---

## 3. Keeping it up to date automatically (no manual ping needed)

You do **not** need to be told each time the guide changes. Pick one of these —
set it up once, then every commit to `main` reaches telemeteor.com on its own.

### Option A — GitHub Action deploys to your server (recommended)
Add the workflow below as `.github/workflows/deploy-telemeteor.yml` in the repo
(this requires the `workflow` permission, which your Git account has). Add your
server details as repo **Secrets** (`Settings → Secrets and variables → Actions`):
`SSH_HOST`, `SSH_USER`, `SSH_KEY` (a deploy private key), `TARGET_DIR`
(e.g. `/var/www/telemeteor/esim-guide`).

```yaml
name: Deploy eSIM guide to telemeteor.com
on:
  push:
    branches: [main]
  workflow_dispatch:
concurrency:
  group: deploy-telemeteor
  cancel-in-progress: true
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: rsync to server
        uses: burnett01/rsync-deployments@7.0.1
        with:
          switches: -avzr --delete --exclude '.git' --exclude 'docs' --exclude 'tools' --exclude '.github'
          path: ./
          remote_path: ${{ secrets.TARGET_DIR }}
          remote_host: ${{ secrets.SSH_HOST }}
          remote_user: ${{ secrets.SSH_USER }}
          remote_key:  ${{ secrets.SSH_KEY }}
```
Result: commit → CI syncs the files to `TARGET_DIR` → live within ~1 minute.
(Swap the rsync action for an FTP one such as `SamKirkland/FTP-Deploy-Action` if
your host is FTP-only — same idea.)

### Option B — server pulls on a schedule
If the guide's files are a git checkout on the server, add a cron job:
```
*/10 * * * * cd /var/www/telemeteor/esim-guide && git pull --ff-only origin main >> /var/log/esim-guide-deploy.log 2>&1
```
Every 10 minutes the server fast-forwards to the latest commit. Nobody has to be
notified.

### Option C — webhook
Point a GitHub push webhook (`Settings → Webhooks`) at a small endpoint on your
server that runs `git pull` in the guide's directory. Instant, event-driven.

Any of the three means: **the assistant commits an improvement → it appears on
telemeteor.com automatically.** No message to the dev team required.

---

## 4. How the content & compatibility database update

Everything the guide shows is data, editable without touching code:

- `content/strings/{hu,en,sr,hr}.json` — all UI + step text (namespaced
  `ui.*`, `screen.*`, `steps.*`).
- `content/structure/{ios,android-samsung,android-pixel,android-xiaomi,android-generic,troubleshoot}.json`
  — which steps exist, in what order, with which illustration and tap points.
- `content/models/catalog.json` — the eSIM compatibility list (`esim`:
  `yes`/`region`/`no`, plus per-model `noteKeys`, and `code`/`aliases` for
  variants that share a name, e.g. Redmi Note 13 Pro 4G vs 5G).

**Freshness process** (also in `content-authoring-guide.md`):
1. `python3 tools/check-sources.py` fingerprints the official source pages +
   a new-device watchlist and reports what changed. Run quarterly and after big
   OS/device launches.
2. Verify each flagged item against the official source (for phones, the
   `*#06#`/EID behaviour) and edit `catalog.json`.
3. Bump `catalog.json`'s `lastVerifiedDate`. That date drives the faint
   "Compatibility database updated: …" line at the bottom of the page.

Adding a new **language**, **device family**, or **model** is a data change only
(new JSON entries + one picker line); the rendering code is never touched. See
`content-authoring-guide.md` for the step-by-step recipes.

---

## 5. Privacy / content rules (please keep)

- **No real customer data** ever ships in the repo. All example ICCIDs, SM-DP+
  codes, EIDs and names are fictional/masked. Keep it that way.
- The support flow opens a pre-filled **English** email to
  `support@telemeteor.com`; there is no data collection or backend call.

---

## 6. TL;DR for the dev team

1. Copy the repo into `…/esim-guide/` on the server (serve from that folder root).
2. Open it with the current site language: `?lang=<code>`, or inject
   `window.TELEMETEOR_ESIM_LANG` / `<html data-esim-lang>`.
3. Wire up one auto-deploy option from §3 so updates flow automatically.
4. Leave the repo as the single source of truth; deploy from it, don't edit the
   server copy by hand.
