# Nyitott feladatok és forrásjegyzék

Ez a lista tartja számon a tartalom eredetét és a még nyitott munkát.

## iOS — ellenőrzött, éles Apple-forrásokból (2026-07-16)

Az iOS lépéssor (`content/structure/ios.json`, `content/strings/hu.json` és `en.json` `steps.ios.*` kulcsai) a következő hivatalos Apple support cikkek alapján lett felépítve és pontosítva — ezek a `structure/ios.json` fájl `sources` mezőjében is szerepelnek:

- [Set up eSIM on iPhone](https://support.apple.com/en-us/118669) — a fő telepítési folyamat (gyorslink, QR, manuális, "Add Cellular Plan" stb. pontos gombfeliratai). Publikálva: 2026-03-10.
- [Using Dual SIM with an eSIM](https://support.apple.com/en-us/HT209044) — kompatibilis modellek (iPhone XS/XS Max/XR vagy újabb), vonal-elnevezés ("Cellular Plan Label"), alapértelmezett vonal. Publikálva: 2026-04-14.
- [If you can't set up an eSIM on your iPhone](https://support.apple.com/en-us/102478) — hibaelhárítás. Publikálva: 2026-04-23.
- [Using eSIM with your iPhone in China mainland](https://support.apple.com/en-us/123879) — kínai szárazföldi korlátozás (csak iPhone 17e és iPhone Air). Publikálva: 2026-03-02.
- [How to unlock your iPhone for use with a different carrier](https://support.apple.com/en-us/109316) — "Operátorzár" / "Carrier Lock" ellenőrzés, "No SIM restrictions" szöveg.

**Fontos, a kérésben feltételezettet pontosító megállapítás:** az eSIM-kompatibilitás nem generációnkénti (nincs külön "iPhone 11-es" vagy "iPhone 12-es" feltétel), hanem **régió/vásárlási hely szerinti**. Minden iPhone XS/XS Max/XR (2018) vagy újabb támogatja globálisan — kivéve a Kínában (szárazföld) vásárolt példányokat, ahol jelenleg kizárólag az iPhone 17e és iPhone Air támogatja az eSIM-et. Hongkongban/Makaóban egyes modellek fizikai dual-SIM-et használnak eSIM helyett (a pontos modell-lista nincs Apple által nyilvánosan, kimerítő táblázatban közölve — ha ez üzletileg fontos célpiac, érdemes közvetlenül Apple-lel vagy helyi disztribútorral egyeztetni).

## Hogyan tartsuk ezt naprakészen a jövőben — AUTOMATIZÁLT ŐRZŐ

**Ez már nem kézi folyamat.** A `tools/check-sources.py` szkript automatikusan figyeli az összes hivatalos forrásoldalt, amire a tartalom épül, PLUSZ a "figyelőlista"-oldalakat, amelyek új készülékmodell vagy új OS-verzió megjelenésekor változnak (pl. az Apple "Identify your iPhone model" és "Apple security releases" oldala).

Használat:

```
python3 tools/check-sources.py           # ellenőrzés: mi változott a legutóbbi átnézés óta?
python3 tools/check-sources.py --accept  # átnézés UTÁN: mostani állapot elmentése referenciaként
```

A szkript minden oldal szövegtartalmából ujjlenyomatot képez (`tools/source-state.json`), és jelzi:
- **VÁLTOZOTT**: a gyártó módosította az oldalt → át kell nézni, változtak-e a lépések/gombfeliratok. Amíg az átnézés tart, a structure fájl `status` mezője `needs-review`-ra állítandó (a felület ezt jelzi a látogatóknak).
- **Figyelőlista-változás**: valószínűleg új készülék vagy OS-verzió jelent meg → ellenőrizd, kell-e bővíteni a `content/models/catalog.json`-t vagy az OS-verzió-szűrést.

A felület minden kalauz alatt megjeleníti a `lastVerifiedDate`-et ("A lépések hivatalos gyártói források alapján ellenőrizve: …"), így a látogató is látja, mennyire friss a tartalom — és ez belső emlékeztető is: ha a dátum régi, futtasd a szkriptet.

**Ajánlott ritmus**: negyedévente, illetve minden nagy OS-megjelenés (új iOS, új One UI, új Android) és új készülékgeneráció bejelentése után. A szkript kilépési kódja CI-ban is használható (0 = minden friss, 1 = átnézés kell).

Fontos korlát, őszintén: statikus weboldalként az oldal önmagában nem tud "minden alkalommal lekérdezni" új készülékeket — ilyen hivatalos, gépileg lekérdezhető gyártói lista nem létezik. A fenti őrző-szkript + a felületen látható ellenőrzési dátum a szakmailag korrekt megoldás: azonnal jelzi, ha a gyártói dokumentáció megváltozott, és a frissítés maga adatfájl-szerkesztés, kódmódosítás nélkül.

## Valós ügyféladat kezelése (fontos, biztonsági megjegyzés)

A tartalom kidolgozásához egy valós, megvásárolt Telemeteor eSIM-ről szóló e-mail szolgált mintaként (kézbesítési módok elnevezése: "Apple Quick Link" / "Android Quick Link", az "Access Point Name" mező megléte, a roaming-bekapcsolás pontos szövege). **A valódi ügyfélnév, ICCID és SM-DP+ aktiválási kód nem került be sehova a projektbe** — ezeket kitalált, más formátumú, de hasonló szerkezetű példaadatok helyettesítik mindenhol (illusztrációk, dokumentáció). Ha a jövőben új valós mintaemailt használsz referenciának, ugyanígy járj el: a szerkezetet/elnevezéseket vedd át, a konkrét aktiválási adatokat és személyes adatokat soha ne másold be egy az egyben.

## Samsung Galaxy — ellenőrzött forrásokból (2026-07-17)

A `content/structure/android-samsung.json` lépéssora (13 lépés, `status: "ready"`) az alábbi hivatalos forrásokon alapul — ezek a fájl `sources` mezőjében is szerepelnek:

- samsung.com/uk és samsung.com/hu hivatalos Samsung eSIM-támogatási oldalai — a Beállítások → Kapcsolatok → SIM-kártya-kezelő navigáció, "eSIM hozzáadása" képernyő gombfeliratai.
- source.android.com — az Android-szintű eSIM/roaming viselkedés (Samsung One UI ezt az Android-alapréteget használja a mobiladat-roaming kapcsolóhoz).

**Nem 1:1 ellenőrzött, ésszerű feltételezés:** az "eSIM hozzáadása" megerősítő képernyő pontos szövege és a "SIM-kártya-kezelő" menüpont elnevezésének kis eltérései One UI verziónként (ez a `warningKey` mezővel jelölhető, ha a jövőben pontosításra szorul).

## Google Pixel — ellenőrzött forrásokból (2026-07-17)

A `content/structure/android-pixel.json` lépéssora (13 lépés, `status: "ready"`) a support.google.com/pixelphone hivatalos oldalai alapján épült — ezek a fájl `sources` mezőjében szerepelnek. A Pixel a "stock Android" beállítás-elrendezést használja, ezért ez a legszorosabban illeszkedik a Google saját eSIM-dokumentációjához.

## Egyéb Android (generikus) — tudatosan általánosított tartalom (2026-07-17)

A `content/structure/android-generic.json` lépéssora (10 lépés, `status: "ready"`) forrása: [Android eSIM overview (source.android.com)](https://source.android.com/docs/core/connect/esim-overview) — ez írja le az OS-szintű eSIM-mechanizmust (Android 10+, GMS-eszközök) és az "Android Universal Link" (`esimsetup.android.com`) valós, Google által dokumentált egyenértékesét az Apple Quick Linknek.

**Fontos, tudatos korlátozás:** mivel ez a kategória minden nem Samsung/Pixel gyártót lefed (Xiaomi, OnePlus, Motorola, Oppo, stb.), a lépésszövegek szándékosan **általánosak** ("Beállítások → keresd az eSIM/SIM-kezelő menüpontot"), nem állítanak pontos gombfeliratot egyetlen konkrét gyártói felületre sem — ezt a `steps.generic.before-you-start` szövege explicit ki is mondja a felhasználónak. Ha egy konkrét gyártó (pl. Xiaomi HyperOS) saját lépéssort kap a jövőben, azt önálló `structure/{id}.json` fájlként érdemes felvenni, nem ennek a generikus kategóriának a bővítéseként.

## Készülékbővítés (következő kör)

- [ ] Windows eSIM-támogatás felvétele.
- [ ] Huawei eSIM-támogatás felvétele.
- [ ] A `content/models/catalog.json` további bővítése (pl. Xiaomi/OnePlus konkrét modellek felvétele, ha ezek a generikus kategóriából kiválnak).

## Fordítás-lektorálás

- [ ] `content/strings/sr.json` és `hr.json` — jelenleg csak a felületi (`ui.*`) szövegek vannak lefordítva; a lépés- és képernyő-szövegek (`steps.*`, `screen.*`) hiányoznak és angolra esnek vissza. Ezeket natív lektorral együtt érdemes lefordítani, nem gépi fordítással, mivel technikai/instrukciós szöveg.
- [ ] `hu.json`/`en.json` natív lektor általi átnézése, utána `reviewMeta.machineDraft` → `false` és a `reviewedBy`/`reviewedDate` mezők kitöltése.

## Egyéb

- [ ] Illusztráció-stílus: a képernyők most már valósághű iOS-kinézetűek (státusz sáv, natív navigáció, csoportosított lista), de nem literális screenshot — ha teljesen 1:1 pontos megjelenés kell, valódi képernyőfotók beillesztése a legmegbízhatóbb út.
- [ ] Szolgáltató-specifikus eltérések (`warningKey`) tartalmának pontosítása, ha indokolt.
