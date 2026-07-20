# Tartalom-szerkesztési útmutató

Ez a kalauz kód nélkül, adatfájlok szerkesztésével bővíthető. Az alábbi receptek nem igényelnek JS/HTML/CSS-ismeretet — csak a `content/` mappában lévő JSON fájlok szerkesztését.

## Új nyelv hozzáadása

1. Másold le a `content/strings/en.json` fájlt `content/strings/{új_nyelvkód}.json` néven (pl. `de.json` németnek).
2. Fordítsd le az összes `ui.*` és `steps.*` értéket. A kulcsokat (a `:` bal oldalán) **ne** változtasd.
3. Állítsd `reviewMeta.machineDraft` értékét `true`-ra, ha a fordítás gépi/vázlat minőségű, és `false`-ra, ha natív lektor átnézte.
4. Vedd fel az új nyelvkódot a `js/i18n.js` fájl `SUPPORTED` listájába, és az `index.html` nyelvválasztó `<select>` elemébe egy új `<option>`-t.
5. Ha egy adott lépéshez még nincs fordítás, azt egyszerűen hagyd ki a `steps` objektumból — a rendszer automatikusan angolra esik vissza, és jelzi a felületen, hogy a tartalom fordítás alatt van.

## Új OS-család hozzáadása (pl. Windows, Huawei)

1. Hozz létre egy `content/structure/{os-id}.json` fájlt az `content/structure/android-samsung.json` mintájára (ez egy "stub" váz).
2. Vedd fel az OS-t a `content/models/os-variants.json` listájába: `{ "id": "{os-id}", "labelKey": "os.{os-id}.name", "icon": "...", "status": "stub" }`.
3. Add hozzá az `os.{os-id}.name` kulcsot minden `content/strings/{lang}.json` `ui` szekciójához (a megjelenítendő névvel).
4. Ha vannak konkrét modellek, vedd fel őket a `content/models/catalog.json`-ba `"osVariant": "{os-id}"` értékkel.
5. Amikor a valódi lépéssor elkészül, töltsd fel a `structure/{os-id}.json` `steps` tömbjét (lásd az `ios.json`-t mintaként az `appliesTo` mezőről), és állítsd a `status`-t `"ready"`-re, a `lastVerifiedDate`-et a mai dátumra.

Ehhez a folyamathoz **nem kell** semmilyen `.js` vagy `.html` fájlt módosítani — az OS-picker gombok, a modellkereső és a renderelő motor automatikusan felismeri az új bejegyzést.

## Meglévő OS tartalom felülvizsgálata UI-változás után

**A változás észlelése automatizált**: futtasd a `python3 tools/check-sources.py` szkriptet — ez az összes structure fájl `sources` listájában szereplő hivatalos oldalt, plusz az új-készülék/új-OS figyelőlista-oldalakat ellenőrzi, és megmondja, melyik változott a legutóbbi átnézés óta (részletek: `research-todo.md`). Ha változást jelez:

1. Nyisd meg az érintett `content/structure/{os-id}.json` fájlt.
2. Állítsd a `status` mezőt `"needs-review"`-ra — ez figyelmeztető jelzést tesz a választóba, amíg valaki nem ellenőrzi és nem frissíti a lépéseket.
3. Ellenőrizd/frissítsd a lépésszövegeket (és szükség esetén az illusztrációkat), majd frissítsd az `osVersionRange` és `lastVerifiedDate` mezőket, és állítsd vissza a `status`-t `"ready"`-re. A `lastVerifiedDate` a felületen is megjelenik a kalauz alatt.
4. Zárásként futtasd: `python3 tools/check-sources.py --accept`.

## Kézbesítési mód szerinti elágazás egy lépésnél

Minden lépés `appliesTo` mezője határozza meg, mely kézbesítési módoknál (`link`, `qr`, `manual`) jelenik meg. Használj `["all"]`-t, ha a lépés mindhárom módnál közös (pl. megerősítés, elnevezés, kész képernyő).

## iOS-verzió szerinti elágazás egy lépésnél

A felhasználó a `#ios-version-picker` szekcióban explicit megadja, hogy `modern` (iOS 17.4+) vagy `legacy` (17.3 vagy régebbi) rendszert használ — ez a `js/ios-version-picker.js` állapota. Egy lépés opcionális `iosVersion` mezővel jelölheti, hogy csak az egyik tier-hez tartozik (pl. `["modern"]` vagy `["legacy"]`); ha a mező hiányzik, a lépés mindkét tiernél megjelenik. Ez lehetővé teszi, hogy pl. a QR-telepítés két, ténylegesen eltérő valós Apple-folyamatot kövessen (email-QR nyomvatartás vs. Kamera-app beolvasás) a felhasználó válasza alapján, kód módosítása nélkül — csak a `content/structure/ios.json`-t kell bővíteni.

Ha a `modern`-only "Apple Quick Link" opciót választja a felhasználó `legacy` állapotban, a `js/delivery-picker.js` `setLinkAvailable(false)` automatikusan letiltja azt és átvált QR-re — ezt a mechanizmust kell követni, ha egy másik kézbesítési mód is iOS-verzió-függővé válik a jövőben.

## Nyitott, ehhez a körhöz nem tartozó feladatok

Lásd: [research-todo.md](research-todo.md).

## eSIM-kompatibilitási adatbázis (content/models/catalog.json)

A kereső mögötti adatbázis minden modellhez tárol egy `esim` státuszt és opcionális `noteKey`-t:
- `esim: "yes"` — támogatott (zöld verdikt)
- `esim: "region"` — általában támogatott, de régió/variáns-függő (sárga verdikt)
- `esim: "no"` — nem támogatott (piros verdikt, nincs „telepítés" gomb)
- `noteKey` — egy `compat.note.*` string kulcs a figyelmeztető sorhoz (pl. `china`, `us-samsung`, `pixel-old`, `huawei`, `region-android`, `oppo-lite`).
- `osVariant` — melyik útmutatóra visz tovább (`ios` / `android-samsung` / `android-pixel` / `android-generic`).
- `aliases` (opcionális) — extra keresőszavak.

**Új modell felvétele** = egy sor a `models` tömbben, kódmódosítás nélkül. A verdikt-szövegek a `content/strings/*.json` `compat.*` kulcsaiban vannak.

**Források és frissesség:** a fájl `sources` és `lastVerifiedDate` mezője a hivatalos gyártói forrásokra (és néhány karbantartott nyilvános kompatibilitási listára) mutat. A `tools/check-sources.py` ezeket is figyeli (lásd fent). Ha egy forrás változik, nézd át az érintett modelleket, frissítsd a `lastVerifiedDate`-et, és futtasd a szkriptet `--accept`-tel.
