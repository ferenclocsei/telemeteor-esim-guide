# eSIM guide — 1-page dev quick-start

Static site. No backend, no build. Copy files, serve, done.
Full details: [`INTEGRATION.md`](./INTEGRATION.md). Source of truth = this GitHub repo.

## 1. Deploy (copy the repo)
Serve the repo from one folder. Recommended URL:

```
https://www.telemeteor.com/esim-guide/
```

- `index.html` sits at the folder root (`/esim-guide/index.html`).
- Keep the folder layout — the app uses **relative paths** (`content/…`,
  `assets/…`, `css/…`, `js/…`). Don't rewrite them.
- Only these are needed at runtime: `index.html css/ js/ assets/illustrations/ content/`
  (skip `.git/ docs/ tools/` — harmless if copied).
- No cache rules needed — versioned `?v=NN` on assets, `no-cache` on JSON.

## 2. Open it in the visitor's language
Four languages: `hu en sr hr`. Pass the site's current language — any of:

```html
<!-- easiest: link with the param -->
https://www.telemeteor.com/esim-guide/?lang=hu

<!-- server-side templating: set before scripts load -->
<script>window.TELEMETEOR_ESIM_LANG = "hu";</script>
<!-- or -->
<html data-esim-lang="hu">
```
Codes are normalized: `hu-HU`, `sr-Latn`, `hrv`, `en-US`, … all work. iframe? See
`INTEGRATION.md` §2 (postMessage live-switch).

## 3. Auto-update (set up once — never get pinged again)
Add this as `.github/workflows/deploy-telemeteor.yml` (needs `workflow` scope,
which your account has). Add repo Secrets: `SSH_HOST`, `SSH_USER`, `SSH_KEY`,
`TARGET_DIR`.

```yaml
name: Deploy eSIM guide to telemeteor.com
on: { push: { branches: [main] }, workflow_dispatch: {} }
concurrency: { group: deploy-telemeteor, cancel-in-progress: true }
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: burnett01/rsync-deployments@7.0.1
        with:
          switches: -avzr --delete --exclude '.git' --exclude 'docs' --exclude 'tools' --exclude '.github'
          path: ./
          remote_path: ${{ secrets.TARGET_DIR }}
          remote_host: ${{ secrets.SSH_HOST }}
          remote_user: ${{ secrets.SSH_USER }}
          remote_key:  ${{ secrets.SSH_KEY }}
```
Result: every commit → live on telemeteor.com in ~1 min. (FTP host? swap in
`SamKirkland/FTP-Deploy-Action`. No CI? cron `git pull` — see `INTEGRATION.md` §3.)

## Rules
- **Repo is the source of truth.** Deploy from it; never hand-edit the server copy.
- **No real customer data** in the repo — example ICCIDs/EIDs/codes stay fictional.
