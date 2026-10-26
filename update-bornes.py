#!/usr/bin/env python3
"""Carte des bornes de recharge du Québec : met à jour apps/bornes/bornes-qc.json.

Télécharge les bornes publiques en service au Québec depuis l'API des stations de
l'AFDC (U.S. Department of Energy, laboratoire NLR, anciennement NREL). Les données
canadiennes y viennent de Ressources naturelles Canada : c'est la même base que le
localisateur de bornes de RNCan. Le fichier est ensuite réduit à ce dont la carte a
besoin (environ 1 Mo au lieu de 16 Mo).

    python3 update-bornes.py                       # clé DEMO_KEY : environ 10 requêtes par heure
    NLR_API_KEY=votre-clé python3 update-bornes.py # clé gratuite : https://developer.nlr.gov/signup/
    python3 update-bornes.py --fichier qc.json     # part d'une réponse déjà téléchargée

Ensuite : python3 build.py (copie apps/bornes/ dans public/apps/bornes/), puis commit et push.
"""
from __future__ import annotations

import datetime
import gzip
import json
import os
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent
OUT = ROOT / "apps" / "bornes" / "bornes-qc.json"
API = "https://developer.nlr.gov/api/alt-fuel-stations/v1.json"
QUERY = "fuel_type=ELEC&country=CA&state=QC&access=public&status=E&limit=all"

# Nom du réseau dans l'API → (nom affiché, groupe utilisé par les filtres de la carte)
RESEAUX = {
    "Circuit électrique": ("Circuit électrique", "Circuit électrique"),
    "FLO": ("FLO", "FLO"),
    "Tesla": ("Tesla Supercharger", "Tesla"),
    "Tesla Destination": ("Tesla Destination", "Tesla"),
    "ChargePoint Network": ("ChargePoint", "ChargePoint"),
    "COUCHE_TARD": ("Couche-Tard", "Couche-Tard"),
    "Electrify Canada": ("Electrify Canada", "Electrify Canada"),
    "FILGO": ("Filgo", "Filgo"),
    "CHARGELAB": ("ChargeLab", "ChargeLab"),
    "SWTCH": ("SWTCH", "SWTCH"),
    "MARCHE_EXPRESS": ("Marché Express", "Marché Express"),
    "FORD_CHARGE": ("Ford Charge", "Ford Charge"),
    "EVSTART": ("EVStart", "EVStart"),
    "EVGATEWAY": ("EVgateway", "EVgateway"),
    "OpConnect": ("OpConnect", "OpConnect"),
    "EV Connect": ("EV Connect", "EV Connect"),
    "AUTEL": ("Autel", "Autel"),
    "ZEFNET": ("Zefnet", "Zefnet"),
    "LOOP": ("Loop", "Loop"),
    "VIALYNK": ("Vialynk", "Vialynk"),
    "Non-Networked": ("Sans réseau", "Sans réseau"),
}

# Code de connecteur dans l'API → nom affiché
PRISES = {
    "J1772COMBO": "CCS",
    "CHADEMO": "CHAdeMO",
    "TESLA": "NACS (Tesla)",
    "J1772": "J1772",
    "J3271": "MCS",
    "NEMA515": "Prise 120 V",
    "NEMA520": "Prise 120 V",
    "NEMA1450": "Prise 240 V",
}


def telecharger() -> dict:
    cle = os.environ.get("NLR_API_KEY", "DEMO_KEY")
    req = urllib.request.Request(f"{API}?api_key={cle}&{QUERY}",
                                 headers={"Accept-Encoding": "gzip", "User-Agent": "mathopo.ca (carte des bornes)"})
    with urllib.request.urlopen(req, timeout=300) as r:
        brut = r.read()
        if r.headers.get("Content-Encoding") == "gzip":
            brut = gzip.decompress(brut)
    return json.loads(brut)


def propre(t: str | None) -> str:
    """Répare les accents mal encodés de certaines fiches (« MarchÃ© » → « Marché »)."""
    t = (t or "").strip()
    if "Ã" in t or "â€" in t:
        for codage in ("cp1252", "latin-1"):
            try:
                return t.encode(codage).decode("utf-8")
            except UnicodeError:
                pass
    return t


def prises(station: dict) -> list:
    """Regroupe les connecteurs par (type, puissance, rapide) : [[type, kW, nombre, rapide], …]."""
    total: dict[tuple, int] = {}
    for unite in station.get("ev_charging_units") or []:
        rapide = 1 if unite.get("charging_level") == "dc_fast" else 0
        for code, c in (unite.get("connectors") or {}).items():
            n = c.get("port_count") or 0
            if not n:
                continue
            kw = c.get("power_kw") or 0
            kw = round(kw) if kw >= 20 else round(kw, 1)
            cle = (PRISES.get(code, code), kw, rapide)
            total[cle] = total.get(cle, 0) + n
    lignes = [[t, kw, n, r] for (t, kw, r), n in total.items()]
    return sorted(lignes, key=lambda p: (-p[3], -p[1], p[0]))


def reduire(donnees: dict, date_maj: str) -> dict:
    reseaux: list[list[str]] = []   # [nom affiché, groupe]
    textes: list[str] = []          # horaires et tarifs, chacun une seule fois
    def indice(liste, valeur):
        if valeur not in liste:
            liste.append(valeur)
        return liste.index(valeur)
    def texte(valeur):
        valeur = propre(valeur)
        return indice(textes, valeur) if valeur else -1

    sites = []
    for s in donnees.get("fuel_stations", []):
        lat, lon = s.get("latitude"), s.get("longitude")
        p = prises(s)
        if lat is None or lon is None or not p:
            continue
        brut = s.get("ev_network") or "Non-Networked"
        nom_reseau, groupe = RESEAUX.get(brut, (brut.replace("_", " ").title(), brut.replace("_", " ").title()))
        sites.append([
            propre(s.get("station_name")),
            propre(s.get("street_address")),
            propre(s.get("city")),
            round(lat, 5), round(lon, 5),
            indice(reseaux, [nom_reseau, groupe]),
            p,
            texte(s.get("access_days_time_fr")),
            texte(s.get("ev_pricing_fr")),
            s.get("date_last_confirmed") or "",
        ])
    return {
        "maj": date_maj,
        "source": "AFDC (U.S. DOE, NLR) et Ressources naturelles Canada",
        "colonnes": ["nom", "adresse", "ville", "lat", "lon", "reseau", "prises", "horaire", "tarif", "confirme"],
        "reseaux": reseaux,
        "textes": textes,
        "sites": sites,
    }


def main() -> None:
    if len(sys.argv) == 3 and sys.argv[1] == "--fichier":
        source = Path(sys.argv[2])
        donnees = json.loads(source.read_text(encoding="utf-8"))
        date_maj = datetime.date.fromtimestamp(source.stat().st_mtime).isoformat()
    elif len(sys.argv) == 1:
        donnees = telecharger()
        date_maj = datetime.date.today().isoformat()
    else:
        sys.exit(__doc__)
    sortie = reduire(donnees, date_maj)
    if len(sortie["sites"]) < 1000:
        sys.exit(f"Seulement {len(sortie['sites'])} sites reçus : fichier non remplacé.")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(sortie, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(sortie['sites'])} sites, {len(sortie['reseaux'])} réseaux → {OUT.relative_to(ROOT)} "
          f"({OUT.stat().st_size // 1024} Ko, données du {date_maj})")


if __name__ == "__main__":
    main()
