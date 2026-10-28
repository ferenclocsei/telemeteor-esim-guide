# Munkamenet-napló — eSIM kalauz

> Fordított időrend: a **legújabb bejegyzés legfelül**. A stabil kiindulópont a
> `kezdes.md`; ide a munkamenetek konkrét, változó részletei (javítások, módosított
> fájlok, ellenőrzések, nyitott feladatok) kerülnek. A `[LEZÁRVA]` feladatok készen
> vannak; a nyitottak a „Nyitott feladatok" alatt.

---

## 2026-10-28

### Elvégzett feladatok / hibajavítások
- **[LEZÁRVA] Szöveghiba – első lépés címe (minden OS):** a „before-you-start"
  cím félrevezető volt — az oldal az eSIM-**KÉPESSÉGET** ellenőrzi (`*#06#`/EID),
  nem azt, hogy már van-e eSIM-ed. Javítva mind az **5 OS-variánsnál, 4 nyelven**:
  „…van eSIM a telefonodban?" → **„Először: eSIM-képes a telefonod?"**
  (en: „First: does your phone support eSIM?", sr/hr: „…podržava li…"; a Xiaomi
  megtartja a ROM-utalást: „…eSIM-képes a telefonod, és melyik ROM?").
- **[LEZÁRVA] iOS 27.2 utánajárás** (kiadva 2026-10-26): **nincs eSIM-telepítési
  változás** (Siri AI-nyelvek, Messages, FaceTime, Apple Pencil a Duo-hoz). A
  telepítési folyamat változatlan; az iOS 27-es **iPhone Handoff**-megjegyzés
  (az `add-cellular-plan-manual` lépésnél) érvényes marad. `ios.json`
  `lastVerifiedDate` → 2026-10-28 (verziótartomány „iOS 12.1–27" lefedi a 27.2-t).
- **[LEZÁRVA] Kompatibilitási lista bővítve:** +**Honor Magic8 Pro / Magic8 Pro
  Air / Magic8 Lite** (region, region-android) → **250 modell**. A többi friss
  csúcs már bent volt (OnePlus 15, Oppo Find X9/Pro, Galaxy S26 FE, Nothing
  Phone 3). `catalog.json` `lastVerifiedDate` → 2026-10-28; `check-sources.py
  --accept` újrabázisolva.
- **[LEZÁRVA] Projekt áthelyezve** ide: `…/Downloads/Claude projektek/eSIM
  telepítési és beállítási kalauz` (teljes git-munkamásolat; innen pusholva). A
  régi `…/Downloads/Feri Claude code` elavult, törölhető.
- **[LEZÁRVA] Munkamenet-dokumentáció létrehozva:** `kezdes.md` + `munkamenet.md`.

### Módosított / létrehozott fájlok
- `content/models/catalog.json` — +3 Honor Magic8, dátum
- `content/structure/ios.json` — dátum (iOS 27.2 ellenőrizve)
- `content/strings/{hu,en,sr,hr}.json` — before-you-start címek (5 OS-kulcs/nyelv)
- `tools/source-state.json` — újrabázisolt forrás-ujjlenyomatok
- `docs/STATUS.md` — frissítve
- **új:** `kezdes.md`, `munkamenet.md`

### Ellenőrzések és eredmény
- **flow-audit** hu + sr (minden OS): **0 probléma** ✔
- **JSON-paritás** 4 nyelven: OK; nincs duplikátum; **250 modell** ✔
- **Élő (GitHub Pages):** katalógus 2026-10-28 / 250 modell / Honor Magic8 kint;
  az új cím („Először: eSIM-képes a telefonod?") kint ✔
- **git:** tiszta working tree, 0 push-olatlan commit; local HEAD = origin/main ✔

### Feltöltés / deploy
- Push `origin/main` **OK**; GitHub Pages build elindítva és **élőben
  visszaigazolva**. Fő tartalmi commit: `69c3772` (+ ez a doc-commit).

### Sikertelen / nem ellenőrizhető
- **Nem vettem fel** (bizonytalan forrás): Oppo **Find X9 Ultra**, Vivo **X300**
  — nem erősíthető meg hivatalos/megbízható forrásból; később felvehető.
- **iOS 27.2 pontos menüfeliratok**: fizikai eszközön nem tudtam tesztelni; a
  szövegek hivatalos Apple-support (118669, szept. 17-i frissítés) + megbízható
  tudósítások alapján.

### Nyitott feladatok / ismert problémák
- **sr/hr fordítás** gépi vázlat (`reviewMeta.machineDraft`) → anyanyelvi
  lektorálás kell a nyilvános indulás előtt.
- **telemeteor.com éles bekötése** (devek; `docs/INTEGRATION.md` §3).
- **Opcionális készülékek:** Oppo Find X9 Ultra / Vivo X300 felvétele, ha
  megerősíthető; további mid-range modellek konkrét esetnél.
- **Android „adatváltás KI" lépés:** az iOS-ben megvan (`disable-data-switching`);
  Androidra (ahol van hasonló kapcsoló) még nincs — opcionális kiterjesztés.
- Megjegyzés: a 2026-09 közepi **animáció-kísérletet elvetettük** (git `ba2d6d0`);
  ne hozd vissza kéretlenül.

### Következő munkamenet – javasolt első lépés
1. Olvasd be a `kezdes.md`-t + ezt a bejegyzést.
2. Tartalmi frissítéshez: `python3 tools/check-sources.py` → nézd át a jelzett
   forrásokat → szerkeszd a `content/**`-ot → **flow-audit (0 elvárt)** → commit →
   push → Pages build → **élő ellenőrzés** (kemény frissítéssel). Konkrét új
   készüléknél: `catalog.json` (+ `code`/`aliases` ha azonos nevű variáns),
   4-nyelv paritás.

---

## Korábbi munkamenetek
A 2026-10-28 előtti munkafázisok részletei a **git-történetben** (`git log`) és a
`docs/STATUS.md` „Recent work" szakaszában találhatók (reskin / Montserrat,
Xiaomi-ág, modell-adatbázis, hibaelhárító, iPhone Duo, data-switching lépés stb.).
Ezeket itt nem ismétlem meg.
