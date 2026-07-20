#!/usr/bin/env python3
"""Tartalom-frissesség őr (source watchdog) a Telemeteor eSIM-kalauzhoz.

Mit csinál:
  1. Beolvassa az összes content/structure/*.json fájl `sources` listáját és
     `lastVerifiedDate` mezőjét.
  2. Letölti ezeket a hivatalos gyártói oldalakat, PLUSZ egy beépített
     figyelőlistát (új készülék-modellek és új OS-verziók megjelenését jelző
     hivatalos oldalak).
  3. Minden oldal szövegtartalmából ujjlenyomatot (hash) képez, és összeveti a
     tools/source-state.json-ben tárolt korábbi állapottal.
  4. Jelenti, mely oldalak változtak a legutóbbi ellenőrzés óta — vagyis hol
     kell átnézni és szükség esetén frissíteni a kalauz lépéseit.

Használat:
  python3 tools/check-sources.py           # ellenőrzés + jelentés
  python3 tools/check-sources.py --accept  # a mostani állapot elmentése
                                           # referenciaként (átnézés UTÁN futtasd)

Kilépési kód: 0 = minden változatlan; 1 = van változás / új forrás; 2 = hálózati hiba.

Ajánlott ritmus: negyedévente, illetve minden nagy OS-megjelenés (új iOS,
új One UI, új Android) és új készülékgeneráció bejelentése után.
"""

import hashlib
import html
import json
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STRUCTURE_DIR = ROOT / "content" / "structure"
STATE_FILE = Path(__file__).resolve().parent / "source-state.json"

# Hivatalos oldalak, amelyek ÚJ KÉSZÜLÉK vagy ÚJ OS-VERZIÓ megjelenésekor
# változnak — ezek jelzik, hogy a modellkatalógus (catalog.json) vagy az
# OS-verzió-szűrés bővítésre szorulhat.
WATCHLIST = {
    "apple-identify-iphone": "https://support.apple.com/en-us/108044",
    "apple-security-releases": "https://support.apple.com/en-us/100100",
    "android-esim-overview": "https://source.android.com/docs/core/connect/esim-overview",
}

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) TelemeteorGuideBot/1.0"


def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    # Csak a tényleges szövegtartalom érdekel, a markup-zaj nem:
    raw = re.sub(r"<script[^>]*>.*?</script>", " ", raw, flags=re.S | re.I)
    raw = re.sub(r"<style[^>]*>.*?</style>", " ", raw, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", raw)
    text = html.unescape(text)
    # Kérésenként változó zaj kiszűrése, hogy ne legyen tévesen "változott"
    # jelzés: hosszú számsorok (session-azonosítók) és token-szerű szavak.
    text = re.sub(r"\b\d{12,}\b", "", text)
    text = re.sub(r"\b[A-Za-z0-9_-]{28,}\b", "", text)
    return re.sub(r"\s+", " ", text).strip()


def extract_published_date(html_text: str):
    # Apple support cikkek "Published Date: Month DD, YYYY" formában jelölik.
    m = re.search(r"Published Date[:\s]+([A-Z][a-z]+ \d{1,2}, \d{4})", html_text)
    return m.group(1) if m else None


def collect_targets() -> dict:
    targets = {}
    for f in sorted(STRUCTURE_DIR.glob("*.json")):
        data = json.loads(f.read_text())
        variant = data.get("osVariant", f.stem)
        for url in data.get("sources", []):
            targets.setdefault(url, {"variants": [], "lastVerified": None})
            targets[url]["variants"].append(variant)
            lv = data.get("lastVerifiedDate")
            if lv and (targets[url]["lastVerified"] is None or lv < targets[url]["lastVerified"]):
                targets[url]["lastVerified"] = lv
    for name, url in WATCHLIST.items():
        targets.setdefault(url, {"variants": [], "lastVerified": None})
        targets[url]["variants"].append(f"[watchlist: {name}]")
    return targets


def main() -> int:
    accept = "--accept" in sys.argv
    state = json.loads(STATE_FILE.read_text()) if STATE_FILE.exists() else {}
    targets = collect_targets()

    changed, new, errors = [], [], []
    new_state = {}

    for url, meta in targets.items():
        label = ", ".join(meta["variants"])
        try:
            text = fetch_text(url)
        except Exception as e:  # hálózati hiba, 404, stb.
            errors.append((url, label, str(e)))
            if url in state:
                new_state[url] = state[url]
            continue

        digest = hashlib.sha256(text.encode()).hexdigest()
        pub = extract_published_date(text)
        new_state[url] = {"hash": digest, "publishedDate": pub, "checked": date.today().isoformat()}

        prev = state.get(url)
        if prev is None:
            new.append((url, label, pub))
        elif prev.get("hash") != digest:
            changed.append((url, label, prev.get("publishedDate"), pub, meta["lastVerified"]))

    print(f"\nEllenőrzött források: {len(targets)}")
    print(f"  Változatlan: {len(targets) - len(changed) - len(new) - len(errors)}")

    if new:
        print(f"\nÚJ (még nincs referencia-állapota): {len(new)}")
        for url, label, pub in new:
            print(f"  + {url}\n      érinti: {label}" + (f" | publikálva: {pub}" if pub else ""))

    if changed:
        print(f"\nVÁLTOZOTT a legutóbbi ellenőrzés óta: {len(changed)}")
        for url, label, old_pub, new_pub, lv in changed:
            print(f"  ! {url}")
            print(f"      érinti: {label} | tartalom utoljára ellenőrizve: {lv or '?'}")
            if old_pub != new_pub:
                print(f"      publikálási dátum: {old_pub or '?'} → {new_pub or '?'}")
        print(
            "\n  Teendő: nézd át a fenti oldal(ak) tartalmát. Ha a lépések/gombfeliratok"
            "\n  változtak: frissítsd a content/strings/*.json kulcsokat és a structure"
            "\n  fájl lastVerifiedDate mezőjét. Amíg ez tart, a structure fájl status"
            "\n  mezőjét állítsd 'needs-review'-ra — a felület ezt jelzi a látogatóknak."
            "\n  Az átnézés VÉGÉN futtasd újra '--accept'-tel."
        )

    if errors:
        print(f"\nHIBA (nem elérhető): {len(errors)}")
        for url, label, err in errors:
            print(f"  ? {url}\n      érinti: {label} | {err}")

    if accept:
        STATE_FILE.write_text(json.dumps(new_state, indent=2, ensure_ascii=False) + "\n")
        print(f"\nReferencia-állapot elmentve: {STATE_FILE.relative_to(ROOT)}")

    if errors and not (changed or new):
        return 2
    return 1 if (changed or new) else 0


if __name__ == "__main__":
    sys.exit(main())
