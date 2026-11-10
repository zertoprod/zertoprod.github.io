"""Met a jour data/beats.json a partir du flux RSS public de la chaine YouTube.
Lance automatiquement toutes les heures par GitHub (voir .github/workflows/maj.yml).
Aucune cle API necessaire. Python standard uniquement.
"""
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

CHANNEL_ID = "UCEYue0bFfPI_ng6-5WKaHIw"
FLUX = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
DATE_DEBUT = "2026-05-24"   # les videos plus anciennes ne vont pas sur le site
FICHIER = Path(__file__).resolve().parent.parent / "data" / "beats.json"

NS = {"a": "http://www.w3.org/2005/Atom",
      "yt": "http://www.youtube.com/xml/schemas/2015",
      "media": "http://search.yahoo.com/mrss/"}


def analyser_titre(titre):
    """Tire du titre YouTube : artistes, nom du beat, ambiance, free."""
    t = titre.strip()
    free = bool(re.search(r"[\[(]\s*free\s*[\])]", t, re.I))
    t = re.sub(r"[\[(]\s*free\s*[\])]", "", t, flags=re.I).strip()
    t = re.sub(r"\(\s*prod\.?[^)]*\)", "", t, flags=re.I).strip()

    morceaux = [m.strip() for m in t.split("|")]
    tete, reste = morceaux[0], [m for m in morceaux[1:] if m]

    artistes, nom = [], ""
    m = re.search(r"type\s*beat", tete, re.I)
    if m:
        avant = tete[:m.start()].strip(" -–:")
        apres = tete[m.end():].strip(" -–:")
        if re.search(r"[\"“«]", avant):  # ex : "Love Ge" Type Beat Lil Tecca
            avant, apres = re.split(r"\s+-\s+", apres)[0], avant
        # " x " minuscule en priorite (garde "Lil Nas X" intact)
        sep = r"\s+(?:x|&|feat\.?|ft\.?)\s+" if " x " in avant else r"\s+(?:x|X|&|feat\.?|ft\.?)\s+"
        artistes = [a.strip() for a in re.split(sep, avant) if a.strip()]
        nom = apres
    else:
        nom = tete
    q = re.search(r"[\"“«]\s*([^\"”»]+?)\s*[\"”»]", nom) or re.search(r"[\"“«]\s*([^\"”»]+?)\s*[\"”»]", t)
    if q:
        nom = q.group(1)
    nom = nom.strip(" -–:\"")

    ambiance = ""
    for r in reste:
        if re.search(r"instru", r, re.I):
            a = re.sub(r"instru(mentale?)?", "", r, flags=re.I)
            a = re.sub(r"\(.*?\)|\b(rap|20\d\d)\b", "", a, flags=re.I)
            a = re.sub(r"\s+", " ", a).strip(" -/–")
            if a:
                if a.isupper():
                    a = a.lower()
                ambiance = a[0].upper() + a[1:]
    return {"nom": nom or titre, "artistes": artistes, "ambiance": ambiance, "free": free}


def lire_flux():
    req = urllib.request.Request(FLUX, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        racine = ET.fromstring(r.read())
    videos = []
    for e in racine.findall("a:entry", NS):
        videos.append({
            "id": e.find("yt:videoId", NS).text,
            "titre": e.find("a:title", NS).text or "",
            "date": (e.find("a:published", NS).text or "")[:10],
        })
    return videos


def main():
    beats = json.loads(FICHIER.read_text(encoding="utf-8")) if FICHIER.exists() else []
    par_id = {b["id"]: b for b in beats}
    nouveaux = 0
    for v in lire_flux():
        if v["id"] in par_id:
            par_id[v["id"]]["titre"] = v["titre"]  # le titre a pu changer
        else:
            par_id[v["id"]] = v
            nouveaux += v["date"] >= DATE_DEBUT
    liste = []
    for b in par_id.values():
        if b["date"] < DATE_DEBUT:
            continue
        base = {"id": b["id"], "titre": b["titre"], "date": b["date"]}
        base.update(analyser_titre(b["titre"]))
        liste.append(base)
    liste.sort(key=lambda b: b["date"], reverse=True)
    texte = json.dumps(liste, ensure_ascii=False, indent=1) + "\n"
    if not FICHIER.exists() or FICHIER.read_text(encoding="utf-8") != texte:
        FICHIER.write_text(texte, encoding="utf-8", newline="\n")
    print(f"{len(liste)} beats, {nouveaux} nouveau(x)")


if __name__ == "__main__":
    sys.exit(main())
