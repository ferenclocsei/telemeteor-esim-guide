# Kezdés — eSIM telepítési és beállítási kalauz

> Ez az **új munkamenet belépési pontja**. Olvasd be ezt a fájlt, majd a
> `munkamenet.md` **legfelső** (legújabb) bejegyzését. Ne elemezd újra a projektet
> a nulláról — a tényleges projektfájlok a mérvadók.

## Mi ez
Statikus, többnyelvű (**hu / en / sr / hr**), több-készülékes **eSIM telepítési
kalauz + kompatibilitás-ellenőrző + hibaelhárító** a Telemeteor számára.
Vanilla HTML/CSS/JS, **nincs build és nincs backend** — minden tartalom adat
(`content/**`), így új nyelv/készülék/modell adatszerkesztés, nem kódolás.

## Hol van
- **Helyi mappa:** `/Users/locsei/Downloads/Claude projektek/eSIM telepítési és beállítási kalauz`
- **GitHub (forrás = igazságforrás):** https://github.com/ferenclocsei/telemeteor-esim-guide
- **Élő (GitHub Pages, staging):** https://ferenclocsei.github.io/telemeteor-esim-guide/
- **Éles terv:** `telemeteor.com/esim-guide/` — a fejlesztők kötik be a repóból (`docs/INTEGRATION.md`), még nincs élesítve.

## Felépítés (röviden)
- `index.html` + `css/` + `js/` + `assets/` + `content/`
- `content/structure/{ios,android-samsung,android-pixel,android-xiaomi,android-generic,troubleshoot}.json` — a lépések sora, illusztráció, tap-pontok
- `content/strings/{hu,en,sr,hr}.json` — minden szöveg (`ui.*`, `screen.*`, `steps.*`)
- `content/models/catalog.json` — kompatibilitási lista (`esim`: yes/region/no, `noteKey`, egyes modelleknél `code`/`aliases`)
- `js/*.js` — picker-ek, i18n, phone-renderer, compat, troubleshoot, stb.
- `assets/fonts/montserrat-*.woff2` — önhosztolt brand-font (nincs külső CDN)

## Futtatás / ellenőrzés helyben
- Szerver: `python3 -m http.server 8123` a repo gyökerében → http://localhost:8123/
- **flow-audit:** http://localhost:8123/tools/flow-audit.html?lang=hu  (minden lépés × os/delivery × nyelv; **elvárt: 0 probléma**). `?os=` és `?lang=` paraméterezhető.
- További: `tools/app-audit.html`, `svg-audit.html`, `ts-audit.html`, `icon-gallery.html`
- Forrás-frissesség: `python3 tools/check-sources.py` (negyedévente / nagy OS- vagy készülékmegjelenés után), átnézés **után** `--accept`.

## Deploy
- **Commit + push a `main`-re → a GitHub Pages automatikusan buildel.** Kényszerített build: `gh api -X POST repos/ferenclocsei/telemeteor-esim-guide/pages/builds` (`gh` a `~/.local/bin`-ben van).
- A munkamenet tokenje **nincs `workflow` scope-ban** → GitHub Actions YAML-t nem lehet pusholni (csak dokumentálva: `docs/INTEGRATION.md`).

## Kemény szabályok (ne regresszálj)
1. **NINCS valós ügyféladat a repóban** (ICCID / SM-DP+ kód / EID / név / telefonszám) — kizárólag fiktív/maszkolt példaadat.
2. Minden **CSS/JS** változtatás után bumpold az `?v=NN`-t az `index.html`-ben (a böngésző agresszíven cache-el). A `content/**` JSON `no-cache`, annak nem kell `?v`.
3. Tartsd a **4 nyelv string-paritását** (azonos kulcsok mindenhol).
4. A **repo az igazságforrás** — onnan deployolj, ne szerkeszd a szerver-másolatot.
5. **Ne állíts** kész / mentve / feltöltve / ellenőrizve dolgot, amíg ténylegesen nem igazoltad.

## Aktuális állapot + előzmények
- **Legfrissebb állapot és a munkamenetek naplója:** `munkamenet.md` (ebben a mappában) — ide kerülnek a konkrét, változó részletek.
- **Részletes dev-snapshot (angol):** `docs/STATUS.md`.
- Egyéb: `docs/INTEGRATION.md`, `docs/DEV-QUICKSTART.md`, `docs/content-authoring-guide.md`, `docs/research-todo.md`.

## A következő munkamenet indítása
Add meg: **a projekt mappáját** (és ha van, a **ZIP-archívumot**), majd a chat
olvassa be ezt a `kezdes.md`-t és a `munkamenet.md` legfelső bejegyzését. Innen
azonnal folytatható, újraelemzés nélkül.
