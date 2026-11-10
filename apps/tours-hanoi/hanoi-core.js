/* =============================================================================
   Les tours de Hanoï — noyau de calcul (aucune dépendance, aucun accès au DOM)
   Utilisé par app.js dans le navigateur et par les tests (Node.js).

   Conventions
     · n disques numérotés de 1 (le plus petit) à n (le plus grand) ;
     · p tiges numérotées de 0 (A, départ) à p − 1 (arrivée) ;
     · une configuration est le tableau pos, où pos[d] est la tige du disque d
       (pos[0] n'est pas utilisé). Comme les disques d'une même tige sont
       toujours empilés du plus grand au plus petit, pos décrit tout l'état.

   Résultats utilisés
     · 3 tiges : H(n) = 2^n − 1 coups, et c'est le minimum (Lucas, 1883).
     · p ≥ 4 tiges : la stratégie de Frame et Stewart (1941) utilise
         Φ(n, p) = min_{1 ≤ ℓ < n} { 2 Φ(ℓ, p) + Φ(n − ℓ, p − 1) },
       avec Φ(n, 3) = 2^n − 1 et Φ(1, p) = 1. Elle est optimale pour 4 tiges
       (Bousch, 2014) ; pour 5 tiges ou plus, c'est la conjecture de
       Frame–Stewart (problème ouvert).
   ============================================================================= */
(function (racine, fabrique) {
  'use strict';
  const noyau = fabrique();
  if (typeof module === 'object' && module.exports) module.exports = noyau;
  else racine.HanoiNoyau = noyau;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const NMAX = 15;   // nombre maximal de disques
  const PMIN = 3;    // nombre minimal de tiges
  const PMAX = 10;   // nombre maximal de tiges

  // ---------------------------------------------------------------------------
  //  Nombre minimal de coups (Frame–Stewart) et partage optimal ℓ
  // ---------------------------------------------------------------------------
  const memoPhi = new Map();
  const memoPartage = new Map();

  /** Φ(n, p) : nombre de coups de la stratégie de Frame–Stewart (2^n − 1 si p = 3). */
  function phi(n, p) {
    if (n <= 0) return 0;
    if (n === 1) return 1;
    if (p < 3) return Infinity;
    if (p === 3) return Math.pow(2, n) - 1;
    const cle = n * 128 + p;
    if (memoPhi.has(cle)) return memoPhi.get(cle);
    let meilleur = Infinity;
    let meilleurL = 1;
    for (let l = 1; l < n; l++) {
      const v = 2 * phi(l, p) + phi(n - l, p - 1);
      if (v <= meilleur) { meilleur = v; meilleurL = l; }   // ≤ : on garde le plus grand ℓ optimal
    }
    memoPhi.set(cle, meilleur);
    memoPartage.set(cle, meilleurL);
    return meilleur;
  }

  /** ℓ optimal : nombre de petits disques mis de côté (avec toutes les tiges) au premier temps. */
  function partage(n, p) {
    if (n < 2) return 0;
    if (p <= 3) return n - 1;
    phi(n, p);
    return memoPartage.get(n * 128 + p);
  }

  /** Le minimum Φ(n, p) est-il démontré ? (3 tiges, 4 tiges, ou n < p : borne 2n − 1). */
  function minimumDemontre(n, p) {
    return p <= 4 || n < p;
  }

  // ---------------------------------------------------------------------------
  //  Configurations
  // ---------------------------------------------------------------------------
  /** Configuration de départ : tous les disques sur la tige 0. */
  function etatInitial(n) {
    return new Int8Array(n + 1);
  }

  /** Piles (de bas en haut) à partir de pos. */
  function piles(pos, n, p) {
    const t = [];
    for (let i = 0; i < p; i++) t.push([]);
    for (let d = n; d >= 1; d--) t[pos[d]].push(d);
    return t;
  }

  /** Disque du dessus de chaque tige (0 si la tige est vide). */
  function dessus(pos, n, p) {
    const h = new Int8Array(p);
    for (let d = 1; d <= n; d++) if (h[pos[d]] === 0) h[pos[d]] = d;
    return h;
  }

  /** Le coup de → vers est-il permis ? Renvoie le disque déplacé, ou 0. */
  function coupPermis(pos, n, p, de, vers) {
    if (de === vers || de < 0 || vers < 0 || de >= p || vers >= p) return 0;
    const h = dessus(pos, n, p);
    const d = h[de];
    if (d === 0) return 0;
    if (h[vers] !== 0 && h[vers] < d) return 0;
    return d;
  }

  function estResolu(pos, n, cible) {
    for (let d = 1; d <= n; d++) if (pos[d] !== cible) return false;
    return true;
  }

  /** Clé texte d'une configuration (un caractère par disque). */
  function cle(pos, n) {
    let s = '';
    for (let d = 1; d <= n; d++) s += String.fromCharCode(48 + pos[d]);
    return s;
  }

  // ---------------------------------------------------------------------------
  //  Solution canonique (3 tiges : récursivité ; p ≥ 4 : Frame–Stewart)
  //  Chaque coup est rattaché à un nœud de l'arbre des appels récursifs, ce qui
  //  permet d'afficher la « pile d'appels » pendant l'animation.
  //  Nœud : { lo, hi, de, vers, via, q, l, parent, rang, debut, fin }
  //    disques lo..hi (lo le plus petit), de → vers, avec q tiges ;
  //    rang : position parmi les enfants du parent (0, 1 ou 2) ;
  //    debut, fin : intervalle [debut, fin[ des coups produits par ce nœud.
  // ---------------------------------------------------------------------------
  function solutionCanonique(n, p) {
    const coups = [];      // { d, de, vers }
    const noeuds = [];
    const feuilles = [];   // feuilles[i] : nœud du coup i
    const toutes = [];
    for (let i = 0; i < p; i++) toutes.push(i);

    function nouveau(lo, hi, de, vers, q, parent, rang, l, via) {
      noeuds.push({ lo, hi, de, vers, via, q, l, parent, rang, debut: coups.length, fin: coups.length });
      return noeuds.length - 1;
    }
    function coup(d, de, vers, q, parent, rang) {
      const id = nouveau(d, d, de, vers, q, parent, rang, 0, -1);
      coups.push({ d, de, vers });
      feuilles.push(id);
      noeuds[id].fin = coups.length;
    }
    function resoudre(lo, hi, de, vers, tiges, parent, rang) {
      const k = hi - lo + 1;
      if (k <= 0) return;
      const q = tiges.length;
      if (k === 1) { coup(lo, de, vers, q, parent, rang); return; }
      let via = -1;
      for (const t of tiges) if (t !== de && t !== vers) { via = t; break; }
      if (q === 3) {
        const id = nouveau(lo, hi, de, vers, q, parent, rang, k - 1, via);
        resoudre(lo, hi - 1, de, via, tiges, id, 0);
        coup(hi, de, vers, q, id, 1);
        resoudre(lo, hi - 1, via, vers, tiges, id, 2);
        noeuds[id].fin = coups.length;
        return;
      }
      const l = partage(k, q);
      const id = nouveau(lo, hi, de, vers, q, parent, rang, l, via);
      resoudre(lo, lo + l - 1, de, via, tiges, id, 0);
      resoudre(lo + l, hi, de, vers, tiges.filter((t) => t !== via), id, 1);
      resoudre(lo, lo + l - 1, via, vers, tiges, id, 2);
      noeuds[id].fin = coups.length;
    }
    if (n >= 1) resoudre(1, n, 0, p - 1, toutes, -1, 0);
    return { n, p, coups, noeuds, feuilles };
  }

  /** Pile d'appels (de la racine au coup) pour le coup numéro i de la solution. */
  function pileAppels(sol, i) {
    const pile = [];
    if (i < 0 || i >= sol.feuilles.length) return pile;
    let id = sol.feuilles[i];
    while (id >= 0) { pile.push(id); id = sol.noeuds[id].parent; }
    return pile.reverse();
  }

  /** Index des configurations de la solution canonique : clé → nombre de coups joués. */
  function indexerChemin(n, p, coups, depart) {
    const pos = depart ? Int8Array.from(depart) : etatInitial(n);
    const index = new Map();
    index.set(cle(pos, n), 0);
    for (let i = 0; i < coups.length; i++) {
      pos[coups[i].d] = coups[i].vers;
      const c = cle(pos, n);
      if (!index.has(c)) index.set(c, i + 1);
    }
    return index;
  }

  // ---------------------------------------------------------------------------
  //  3 tiges : coup optimal depuis n'importe quelle configuration
  //  On regarde les disques du plus grand au plus petit. Si le disque d n'est
  //  pas sur sa tige visée T, il devra y aller, et il faut d'abord réunir les
  //  disques 1..d−1 sur la troisième tige. Le dernier disque ainsi désigné est
  //  le prochain à bouger, et il reste Σ 2^(d−1) coups (somme sur ces disques).
  // ---------------------------------------------------------------------------
  function prochainCoup3(pos, n, cible) {
    let T = cible;
    let coupSuivant = null;
    let reste = 0;
    for (let d = n; d >= 1; d--) {
      if (pos[d] !== T) {
        coupSuivant = { d, de: pos[d], vers: T };
        reste += Math.pow(2, d - 1);
        T = 3 - pos[d] - T;
      }
    }
    return { coup: coupSuivant, reste };
  }

  /** 3 tiges : liste des coups d'une solution optimale depuis pos. */
  function cheminOptimal3(pos, n, cible) {
    const q = Int8Array.from(pos);
    const coups = [];
    for (;;) {
      const r = prochainCoup3(q, n, cible);
      if (!r.coup) break;
      coups.push(r.coup);
      q[r.coup.d] = r.coup.vers;
    }
    return coups;
  }

  // ---------------------------------------------------------------------------
  //  p ≥ 4 tiges : recherche exhaustive (parcours en largeur) depuis l'arrivée
  //  Une configuration est codée par l'entier Σ pos[d] · p^(d−1) < p^n.
  //  dist[e] = nombre minimal de coups pour aller de e à l'arrivée (255 si non visité).
  // ---------------------------------------------------------------------------
  const LIMITE_RECHERCHE = 1100000;   // p^n maximal (4^10 = 1 048 576)

  function nbConfigurations(n, p) { return Math.pow(p, n); }
  function rechercheFaisable(n, p) { return nbConfigurations(n, p) <= LIMITE_RECHERCHE; }

  function puissances(n, p) {
    const w = new Int32Array(n + 2);
    w[1] = 1;
    for (let d = 2; d <= n + 1; d++) w[d] = w[d - 1] * p;
    return w;
  }

  function coder(pos, n, p) {
    let e = 0;
    for (let d = n; d >= 1; d--) e = e * p + pos[d];
    return e;
  }

  /**
   * Parcours en largeur découpé en tranches (générateur) : chaque next() traite
   * environ `tranche` configurations et renvoie la fraction déjà explorée.
   * À la fin, la valeur renvoyée est { dist, explorees }.
   */
  function* rechercheEnLargeur(n, p, cible, tranche) {
    const total = nbConfigurations(n, p);
    const w = puissances(n, p);
    const dist = new Uint8Array(total).fill(255);
    const file = new Int32Array(total);
    let tete = 0, queue = 0;
    let depart = 0;
    for (let d = n; d >= 1; d--) depart = depart * p + cible;
    dist[depart] = 0;
    file[queue++] = depart;
    const pos = new Int8Array(n + 1);
    const h = new Int8Array(p);
    let compteur = 0;
    while (tete < queue) {
      const e = file[tete++];
      let s = e;
      for (let d = 1; d <= n; d++) { const r = s % p; pos[d] = r; s = (s - r) / p; }
      h.fill(0);
      for (let d = 1; d <= n; d++) if (h[pos[d]] === 0) h[pos[d]] = d;
      const suivant = dist[e] + 1;
      for (let a = 0; a < p; a++) {
        const da = h[a];
        if (da === 0) continue;
        for (let b = 0; b < p; b++) {
          if (b === a) continue;
          const db = h[b];
          if (db !== 0 && db < da) continue;
          const f = e + (b - a) * w[da];
          if (dist[f] === 255) { dist[f] = suivant; file[queue++] = f; }
        }
      }
      if (++compteur >= tranche) { compteur = 0; yield tete / total; }
    }
    return { dist, explorees: queue };
  }

  /** Version d'un seul tenant (tests, petits cas). */
  function distances(n, p, cible) {
    const g = rechercheEnLargeur(n, p, cible, Infinity);
    let r = g.next();
    while (!r.done) r = g.next();
    return r.value;
  }

  /** Coup optimal d'après la table des distances (null si déjà résolu). */
  function prochainCoupTable(pos, n, p, dist) {
    const e = coder(pos, n, p);
    const de = dist[e];
    if (de === 0 || de === 255) return { coup: null, reste: de === 255 ? Infinity : 0 };
    const w = puissances(n, p);
    const h = dessus(pos, n, p);
    for (let a = 0; a < p; a++) {
      const da = h[a];
      if (da === 0) continue;
      for (let b = 0; b < p; b++) {
        if (b === a || (h[b] !== 0 && h[b] < da)) continue;
        if (dist[e + (b - a) * w[da]] === de - 1) return { coup: { d: da, de: a, vers: b }, reste: de };
      }
    }
    return { coup: null, reste: de };
  }

  function cheminOptimalTable(pos, n, p, dist) {
    const q = Int8Array.from(pos);
    const coups = [];
    for (;;) {
      const r = prochainCoupTable(q, n, p, dist);
      if (!r.coup) break;
      coups.push(r.coup);
      q[r.coup.d] = r.coup.vers;
    }
    return coups;
  }

  return {
    NMAX, PMIN, PMAX, LIMITE_RECHERCHE,
    phi, partage, minimumDemontre,
    etatInitial, piles, dessus, coupPermis, estResolu, cle,
    solutionCanonique, pileAppels, indexerChemin,
    prochainCoup3, cheminOptimal3,
    nbConfigurations, rechercheFaisable, coder, rechercheEnLargeur, distances,
    prochainCoupTable, cheminOptimalTable,
  };
});
