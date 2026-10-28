// Liste des activités disponibles. L'adresse index.html?preuve=<id> (preuves et exemples
// à trous) ou ordre.html?preuve=<id> (démonstrations à remettre en ordre, type: 'ordre')
// en choisit une ; sans paramètre, la première du type de la page sert. Chaque fichier
// appelle PreuvesATrous.enregistrer({...}).
window.CATALOGUE_PREUVES = [
  { id: 'corollaire-1-34', fichier: 'preuves/corollaire-1-34.js', titre: 'Corollaire 1.34 — |f|, f² et fg (section 1.6)' },
  { id: 'exemple-2-1-puissances', fichier: 'preuves/exemple-2-1-puissances.js', titre: 'Exemple — xⁿ sur [0, 1] (section 2.1)' },
  { id: 'theoreme-2-6-derivation', fichier: 'preuves/theoreme-2-6-derivation.js', titre: 'Théorème 2.6 — limite et dérivée, à remettre en ordre (section 2.3)', type: 'ordre' },
];
