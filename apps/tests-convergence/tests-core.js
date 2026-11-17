/* =============================================================================
   Tests de convergence — noyau de calcul (aucune interface ici)
   MPU1054 · UQTR · P.-O. Parisé · 2026

   Séries à termes positifs. Les termes sont évalués « en logarithme » : chaque
   valeur est un couple (signe, log |x|). On suit ainsi n!/n^n, 2^n/n!,
   (log n)^(-n) ou n! e^(-n) jusqu'à n = 10^8 sans dépassement de capacité, ce
   qui permet d'estimer les limites des suites des tests :
     comparaison par limite  x_n / y_n,
     racine                  x_n^(1/n),
     quotient                x_(n+1) / x_n.
   L'analyse du terme général (analyser, texGeneral, termeExact) vient de
   serie-core.js, le noyau de l'application « Réarranger une série ».

   Utilisable dans le navigateur (window.TestsNoyau) et dans Node (module.exports).
   ============================================================================= */
(function (racine, fabrique) {
  const enNode = typeof module === 'object' && module.exports;
  const SN = enNode ? require('./serie-core.js') : racine.SerieNoyau;
  const noyau = fabrique(SN);
  if (enNode) module.exports = noyau;
  else racine.TestsNoyau = noyau;
})(typeof self !== 'undefined' ? self : this, function (SN) {
  'use strict';

  // ===========================================================================
  //  1. Nombres en logarithme : { s: signe (-1, 0, 1), l: log |x| }
  // ===========================================================================
  const ZL = Object.freeze({ s: 0, l: -Infinity });
  const UNL = Object.freeze({ s: 1, l: 0 });

  function deNombre(v) {
    if (Number.isNaN(v)) return null;
    if (v === 0) return ZL;
    return { s: v > 0 ? 1 : -1, l: Math.log(Math.abs(v)) };
  }
  const versNombre = (a) => (a.s === 0 ? 0 : a.s * Math.exp(a.l));

  function lAdd(a, b) {
    if (a.s === 0) return b;
    if (b.s === 0) return a;
    let g = a, p = b;
    if (p.l > g.l) { g = b; p = a; }
    if (g.l === Infinity) return p.l === Infinity && p.s !== g.s ? null : g;
    const d = Math.exp(p.l - g.l);            // 0 ≤ d ≤ 1
    if (p.s === g.s) return { s: g.s, l: g.l + Math.log1p(d) };
    if (d >= 1) return ZL;                     // les deux termes s'annulent
    return { s: g.s, l: g.l + Math.log1p(-d) };
  }
  const lNeg = (a) => (a.s === 0 ? a : { s: -a.s, l: a.l });
  function lMul(a, b) {
    if (a.s === 0 || b.s === 0) {
      if (a.l === Infinity || b.l === Infinity) return null;   // 0 · ∞
      return ZL;
    }
    return { s: a.s * b.s, l: a.l + b.l };
  }
  function lDiv(a, b) {
    if (b.s === 0) return null;
    if (a.s === 0) return ZL;
    return { s: a.s * b.s, l: a.l - b.l };
  }

  // log(m!) : table exacte jusqu'à 170, série de Stirling au-delà
  const LFACT = [0];
  for (let i = 1; i <= 170; i++) LFACT[i] = LFACT[i - 1] + Math.log(i);
  function logFactorielle(m) {
    if (m <= 170) return LFACT[m];
    const z = m + 1, z2 = z * z;
    return (z - 0.5) * Math.log(z) - z + 0.5 * Math.log(2 * Math.PI)
      + 1 / (12 * z) - 1 / (360 * z * z2) + 1 / (1260 * z * z2 * z2) - 1 / (1680 * z * z2 * z2 * z2);
  }

  // Évaluation ordinaire (exposants, arguments de n! : on veut des entiers exacts)
  function evalSimple(a, n) {
    switch (a.t) {
      case 'par': return evalSimple(a.a, n);
      case 'num': return SN.qVersNombre(a.q);
      case 'n': return n;
      case 'const': return a.nom === 'pi' ? Math.PI : Math.E;
      case 'neg': return -evalSimple(a.a, n);
      case 'add': return evalSimple(a.a, n) + evalSimple(a.b, n);
      case 'sub': return evalSimple(a.a, n) - evalSimple(a.b, n);
      case 'mul': return evalSimple(a.a, n) * evalSimple(a.b, n);
      case 'div': return evalSimple(a.a, n) / evalSimple(a.b, n);
      default: {
        const v = evalLog(a, n);
        return v ? versNombre(v) : NaN;
      }
    }
  }

  // Petits arguments : sin u ≈ u, etc. (quand u est trop petit pour un double)
  const PRES_DE_U = { sin: 1, tan: 1, arctan: 1, arcsin: 1, sinh: 1, tanh: 1 };
  const PRES_DE_1 = { cos: 1, cosh: 1 };

  // Valeur d'un sous-arbre en logarithme ; null si non défini (log de 0, 1/0, …)
  function evalLog(a, n) {
    switch (a.t) {
      case 'par': return evalLog(a.a, n);
      case 'num': return deNombre(SN.qVersNombre(a.q));
      case 'n': return n === 0 ? ZL : { s: n > 0 ? 1 : -1, l: Math.log(Math.abs(n)) };
      case 'const': return { s: 1, l: a.nom === 'pi' ? Math.log(Math.PI) : 1 };
      case 'neg': { const A = evalLog(a.a, n); return A && lNeg(A); }
      case 'add': case 'sub': {
        const A = evalLog(a.a, n); if (!A) return null;
        const B = evalLog(a.b, n); if (!B) return null;
        return lAdd(A, a.t === 'add' ? B : lNeg(B));
      }
      case 'mul': {
        const A = evalLog(a.a, n); if (!A) return null;
        const B = evalLog(a.b, n); if (!B) return null;
        return lMul(A, B);
      }
      case 'div': {
        const A = evalLog(a.a, n); if (!A) return null;
        const B = evalLog(a.b, n); if (!B) return null;
        return lDiv(A, B);
      }
      case 'pow': return puissanceLog(evalLog(a.a, n), a.b, n);
      case 'fact': {
        let m = evalSimple(a.a, n);
        if (!Number.isFinite(m)) return null;
        const mr = Math.round(m);
        if (Math.abs(m - mr) > 1e-9 * Math.max(1, Math.abs(m)) || mr < 0) return null;
        return { s: 1, l: logFactorielle(mr) };
      }
      case 'fn': return fonctionLog(a.nom, a.a, n);
      default: return null;
    }
  }

  function puissanceLog(A, noeudExp, n) {
    if (!A) return null;
    let b = evalSimple(noeudExp, n);
    if (Number.isNaN(b)) return null;
    if (A.s === 0) return b > 0 ? ZL : b === 0 ? UNL : null;
    if (!Number.isFinite(b)) {
      if (A.l === 0) return A.s > 0 ? UNL : null;
      return { s: 1, l: (b > 0) === (A.l > 0) ? Infinity : -Infinity };
    }
    if (A.s > 0) return b === 0 ? UNL : { s: 1, l: b * A.l };
    // base négative : exposant entier, ou inverse d'un entier impair (racine impaire)
    const br = Math.round(b);
    if (Math.abs(b - br) < 1e-9 && Math.abs(br) < 2 ** 53) return { s: Math.abs(br) % 2 === 1 ? -1 : 1, l: br * A.l };
    const r = 1 / b, rr = Math.round(r);
    if (Math.abs(r - rr) < 1e-9 && Math.abs(rr) % 2 === 1) return { s: -1, l: b * A.l };
    return null;
  }

  function fonctionLog(nom, arg, n) {
    const A = evalLog(arg, n);
    if (!A) return null;
    switch (nom) {
      case 'abs': return A.s === 0 ? ZL : { s: 1, l: A.l };
      case 'sqrt': return A.s < 0 ? null : A.s === 0 ? ZL : { s: 1, l: A.l / 2 };
      case 'exp': {
        const v = versNombre(A);
        return Number.isNaN(v) ? null : { s: 1, l: v };
      }
      case 'ln': case 'log': {
        if (A.s <= 0) return null;
        return deNombre(A.l);
      }
      default: {
        if (A.s !== 0 && A.l < -40) {           // |u| < 4e-18 : sin u ≈ u, cos u ≈ 1, …
          if (PRES_DE_U[nom]) return A;
          if (PRES_DE_1[nom]) return UNL;
          if (nom === 'arccos') return { s: 1, l: Math.log(Math.PI / 2) };
        }
        const v = versNombre(A);
        let r;
        switch (nom) {
          case 'sin': r = Math.sin(v); break;
          case 'cos': r = Math.cos(v); break;
          case 'tan': r = Math.tan(v); if (Math.abs(r) > 1e15) return null; break;
          case 'arctan': r = Math.atan(v); break;
          case 'arcsin': if (Math.abs(v) > 1) return null; r = Math.asin(v); break;
          case 'arccos': if (Math.abs(v) > 1) return null; r = Math.acos(v); break;
          case 'sinh':
            if (Math.abs(v) > 700) return { s: Math.sign(v), l: Math.abs(v) - Math.LN2 };
            r = Math.sinh(v); break;
          case 'cosh':
            if (Math.abs(v) > 700) return { s: 1, l: Math.abs(v) - Math.LN2 };
            r = Math.cosh(v); break;
          case 'tanh': r = Math.tanh(v); break;
          default: return null;
        }
        // cos(nπ/2) vaut 0, pas 6·10^-17 : on garde le zéro exact quand il l'est
        if (r !== 0 && Math.abs(r) < 1e-12 && Math.abs(v) > 1e-6) {
          try {
            const e = SN.termeExact(arg, n);
            if (e && e.q && e.q.n === 0n) return ZL;
          } catch (_) { /* rien */ }
        }
        return deNombre(r);
      }
    }
  }

  // ===========================================================================
  //  2. Une série : terme général analysé, premier indice, tableaux de valeurs
  // ===========================================================================
  const M_TABLE = 65536;            // termes tabulés (graphes, rangs, sommes)

  function creerSerie(src) {
    const arbre = SN.analyser(src);
    // premier indice où le terme est défini (log n demande n ≥ 2, …)
    let n0 = null;
    for (let n = 0; n <= 30; n++) {
      const v = evalLog(arbre, n);
      if (v && Number.isFinite(v.l) || (v && v.s === 0)) {
        // il faut aussi que les quelques termes suivants soient définis
        let ok = true;
        for (let j = n + 1; j <= n + 8; j++) { const w = evalLog(arbre, j); if (!w || w.l === Infinity) { ok = false; break; } }
        if (ok) { n0 = Math.max(n, 1); break; }
      }
    }
    if (n0 === null) throw new SN.ErreurSerie('indefini', { n: 1 });
    return {
      src, arbre, n0,
      log: (n) => evalLog(arbre, n),
      exact: (n) => SN.termeExact(arbre, n),
    };
  }

  // Tabulation de |x_n| pour n0 ≤ n ≤ M : logarithmes, valeurs, sommes cumulées
  function tabuler(serie, n0, M) {
    M = M || M_TABLE;
    const L = new Float64Array(M + 2).fill(NaN);
    const V = new Float64Array(M + 2);
    const P = new Float64Array(M + 2);
    let nNeg = 0, nNul = 0, premierIndefini = null;
    let s = 0, c = 0;                         // somme de Neumaier
    for (let n = n0; n <= M + 1; n++) {
      const v = evalLog(serie.arbre, n);
      if (!v || v.l === Infinity) { if (premierIndefini === null) premierIndefini = n; L[n] = NaN; V[n] = NaN; P[n] = s + c; continue; }
      if (v.s < 0) nNeg++;
      if (v.s === 0) nNul++;
      L[n] = v.l;                             // log |x_n|
      const x = v.s === 0 ? 0 : Math.exp(v.l);
      V[n] = x;
      if (n <= M) {
        const t = s + x;
        c += Math.abs(s) >= Math.abs(x) ? (s - t) + x : (x - t) + s;
        s = t;
        P[n] = s + c;
      }
    }
    return { n0, M, L, V, P, nNeg, nNul, premierIndefini };
  }

  // ===========================================================================
  //  3. Limite d'une suite a(n), estimée numériquement
  //   On regarde a sur des fenêtres de 16 indices consécutifs commençant à
  //   n_k = n0 + 2^k : le milieu de la fenêtre donne la tendance, son étendue
  //   l'oscillation. Puis on ajuste des modèles a ≈ L + c·g(n).
  // ===========================================================================
  const FENETRE = 16;
  const G = {
    inv: (n) => 1 / n,
    inv2: (n) => 1 / (n * n),
    rac: (n) => 1 / Math.sqrt(n),
    lgn: (n) => Math.log(n) / n,
    lg2n: (n) => Math.log(n) ** 2 / n,
    ilg: (n) => 1 / Math.log(n),
    ilg2: (n) => 1 / Math.log(n) ** 2,
    ilg3: (n) => 1 / Math.log(n) ** 3,
  };
  // a ≈ L + Σ c_i g_i(n) : un ou deux termes correctifs
  const MODELES = [
    ['inv'], ['inv2'], ['rac'], ['lgn'], ['lg2n'], ['ilg'], ['ilg2'],
    ['inv', 'inv2'], ['lgn', 'inv'], ['ilg', 'ilg2'], ['rac', 'inv'], ['lg2n', 'lgn'], ['ilg', 'ilg2', 'ilg3'],
  ].map((noms) => ({ nom: noms.join('+'), g: noms.map((x) => G[x]) }));

  // moindres carrés (équations normales, élimination de Gauss avec pivot)
  function ajuster(points, gs) {
    const k = gs.length + 1, m = points.length;
    if (m <= k) return null;
    // mise à l'échelle des colonnes pour le conditionnement
    const lignes = points.map((p) => [1].concat(gs.map((g) => g(p.n))));
    const echelles = [];
    for (let j = 0; j < k; j++) echelles[j] = Math.max(...lignes.map((l) => Math.abs(l[j]))) || 1;
    const A = Array.from({ length: k }, () => new Array(k + 1).fill(0));
    lignes.forEach((l, i) => {
      const z = l.map((v, j) => v / echelles[j]);
      for (let r = 0; r < k; r++) {
        for (let c = 0; c < k; c++) A[r][c] += z[r] * z[c];
        A[r][k] += z[r] * points[i].a;
      }
    });
    for (let c = 0; c < k; c++) {
      let piv = c;
      for (let r = c + 1; r < k; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
      if (!(Math.abs(A[piv][c]) > 1e-300)) return null;
      [A[c], A[piv]] = [A[piv], A[c]];
      for (let r = 0; r < k; r++) {
        if (r === c) continue;
        const f = A[r][c] / A[c][c];
        for (let cc = c; cc <= k; cc++) A[r][cc] -= f * A[c][cc];
      }
    }
    const coef = A.map((row, j) => row[k] / row[j] / echelles[j]);
    let rss = 0;
    lignes.forEach((l, i) => {
      let v = 0;
      for (let j = 0; j < k; j++) v += coef[j] * l[j];
      const e = points[i].a - v;
      rss += e * e;
    });
    return { L: coef[0], rss, k };
  }

  // suite(n) → nombre (ou NaN) ; options : nMax (2^26 par défaut)
  function estimerLimite(suite, n0, options) {
    const kMax = (options && options.kMax) || 26;
    const echantillons = [];
    for (let k = 4; k <= kMax; k++) {
      const base = n0 + 2 ** k;
      let lo = Infinity, hi = -Infinity, nb = 0, somme = 0;
      for (let j = 0; j < FENETRE; j++) {
        const v = suite(base + j);
        if (!Number.isFinite(v)) continue;
        nb++; somme += v;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      if (nb < FENETRE / 2) {
        if (echantillons.length) break;       // la suite cesse d'être calculable : on s'arrête
        continue;
      }
      echantillons.push({ k, n: base + (FENETRE - 1) / 2, a: (lo + hi) / 2, moy: somme / nb, amp: hi - lo, lo, hi });
    }
    if (echantillons.length < 5) return { type: 'indetermine', echantillons };

    // Bruit d'arrondi aux grands n : l'étendue de la fenêtre se met à grandir
    // alors qu'elle diminuait ; on coupe là.
    let fin = echantillons.length;
    for (let i = 6; i < echantillons.length; i++) {
      const e = echantillons[i], av = echantillons[i - 3];
      const echelle = Math.max(1e-300, Math.abs(e.a));
      if (e.amp > 4 * av.amp && e.amp > 1e-9 * echelle && av.amp < 1e-4 * echelle) { fin = i; break; }
    }
    const E = echantillons.slice(0, fin);
    const dern = E[E.length - 1];
    const echelle = Math.max(Math.abs(dern.a), 1e-300);

    // Croissance sans borne ?
    const m6 = E.slice(-6);
    const croit = m6.every((e, i) => i === 0 || e.a > m6[i - 1].a);
    if (croit) {
      const d1 = m6[5].a - m6[4].a, d0 = m6[1].a - m6[0].a;
      if (dern.a > 1e6 || (m6[5].a / Math.max(m6[0].a, 1e-300) > 4 && m6[5].a > 2) || (d0 > 0 && d1 >= 0.6 * d0 && m6[5].a - m6[0].a > 0.5)) {
        return { type: 'infini', echantillons: E };
      }
    }

    // Oscillation qui ne s'éteint pas ?
    const ampRel = dern.amp / Math.max(1e-12, Math.abs(dern.a), Math.abs(dern.hi), Math.abs(dern.lo));
    const ampAvant = E[Math.max(0, E.length - 6)].amp;
    if (ampRel > 1e-3 && dern.amp > 0.5 * ampAvant && dern.amp > 1e-9) {
      return { type: 'oscille', lo: dern.lo, hi: dern.hi, echantillons: E };
    }

    // Constante (convergence plus rapide que toute puissance) ?
    const derniers = E.slice(-6);
    const ecartConst = Math.max(...derniers.map((e) => Math.abs(e.a - dern.a)));
    let meilleur = null;
    if (ecartConst <= 1e-13 * Math.max(1, echelle)) {
      meilleur = { L: dern.a, rss: 0, nom: 'const', incertitude: 1e-13 * Math.max(1, echelle) };
    } else {
      const pts = E.slice(-10);
      const m = pts.length;
      const plancher = (1e-14 * Math.max(1, echelle)) ** 2 * m;
      const resultats = [];
      for (const Mo of MODELES) {
        const r = ajuster(pts, Mo.g);
        if (!r || !Number.isFinite(r.L)) continue;
        // critère d'Akaike : la précision de l'ajustement, pénalisée par le nombre de paramètres
        r.score = m * Math.log((r.rss + plancher) / m) + 2 * r.k;
        resultats.push(Object.assign({ nom: Mo.nom, g: Mo.g }, r));
      }
      resultats.sort((a, b) => a.score - b.score);
      meilleur = resultats[0];
      // incertitude : écart avec les modèles presque aussi bons, et avec un ajustement sur moins de points
      let inc = 0;
      for (const r of resultats) if (r.score <= meilleur.score + 4) inc = Math.max(inc, Math.abs(r.L - meilleur.L));
      const r7 = ajuster(E.slice(-8), meilleur.g);
      if (r7) inc = Math.max(inc, Math.abs(r7.L - meilleur.L));
      inc = Math.max(inc, Math.sqrt(meilleur.rss / m), dern.amp / 2, 1e-12 * Math.max(1, Math.abs(meilleur.L)));
      meilleur.incertitude = inc;
    }
    let L = meilleur.L;
    const inc = meilleur.incertitude;
    // Limite nulle ? (L compatible avec 0, et une suite qui décroît encore vers 0)
    const decroit = derniers.every((e, i) => i === 0 || e.a <= derniers[i - 1].a);
    if (Math.abs(L) <= Math.max(4 * inc, 1e-10) && dern.a >= 0 && (decroit || Math.abs(dern.a) < 1e-9)) {
      return { type: 'zero', L: 0, incertitude: inc, echantillons: E, modele: meilleur.nom };
    }
    return { type: 'fini', L, incertitude: inc, echantillons: E, modele: meilleur.nom };
  }

  // Une valeur « reconnue » : fraction simple ou constante usuelle (affichage)
  const CONSTANTES = [
    ['e', Math.E, 'e'], ['1/e', 1 / Math.E, '\\frac{1}{e}'], ['2/e', 2 / Math.E, '\\frac{2}{e}'],
    ['e^2', Math.E ** 2, 'e^{2}'], ['1/e^2', Math.E ** -2, '\\frac{1}{e^{2}}'],
    ['pi', Math.PI, '\\pi'], ['1/pi', 1 / Math.PI, '\\frac{1}{\\pi}'],
    ['rac2', Math.SQRT2, '\\sqrt{2}'], ['1/rac2', Math.SQRT1_2, '\\frac{1}{\\sqrt{2}}'],
    ['rac3', Math.sqrt(3), '\\sqrt{3}'], ['log2', Math.LN2, '\\log 2'],
    ['e/2', Math.E / 2, '\\frac{e}{2}'], ['e/3', Math.E / 3, '\\frac{e}{3}'],
  ];
  function reconnaitre(L, incertitude) {
    const tol = Math.max(incertitude * 3, 1e-12 * Math.max(1, Math.abs(L)));
    if (tol > 1e-6 * Math.max(1, Math.abs(L))) return null;
    for (let q = 1; q <= 12; q++) {
      const p = Math.round(L * q);
      if (Math.abs(p) > 200) continue;
      if (Math.abs(L - p / q) <= tol) {
        const g = pgcdNb(Math.abs(p), q);
        const pp = p / g, qq = q / g;
        return { valeur: pp / qq, tex: qq === 1 ? String(pp) : (pp < 0 ? '-' : '') + '\\frac{' + Math.abs(pp) + '}{' + qq + '}', texte: qq === 1 ? String(pp) : pp + '/' + qq };
      }
    }
    for (const [texte, v, tex] of CONSTANTES) if (Math.abs(L - v) <= tol) return { valeur: v, tex, texte };
    return null;
  }
  function pgcdNb(a, b) { while (b) [a, b] = [b, a % b]; return a || 1; }

  // ===========================================================================
  //  4. Séries de référence : x_n = C · n^a · ρ^n (p-séries, séries géométriques)
  // ===========================================================================
  function constante(a) {
    // valeur si le sous-arbre ne dépend pas de n
    const sansN = (b) => {
      switch (b.t) {
        case 'n': return false;
        case 'num': case 'const': return true;
        case 'par': case 'neg': case 'fact': return sansN(b.a);
        case 'fn': return sansN(b.a);
        default: return sansN(b.a) && sansN(b.b);
      }
    };
    if (!sansN(a)) return null;
    const v = evalSimple(a, 1);
    return Number.isFinite(v) ? v : null;
  }
  // exposant affine en n : α n + β
  function affine(a) {
    const c = constante(a);
    if (c !== null) return { al: 0, be: c };
    switch (a.t) {
      case 'par': return affine(a.a);
      case 'n': return { al: 1, be: 0 };
      case 'neg': { const A = affine(a.a); return A && { al: -A.al, be: -A.be }; }
      case 'add': case 'sub': {
        const A = affine(a.a), B = affine(a.b);
        if (!A || !B) return null;
        const s = a.t === 'add' ? 1 : -1;
        return { al: A.al + s * B.al, be: A.be + s * B.be };
      }
      case 'mul': {
        const A = affine(a.a), B = affine(a.b);
        if (!A || !B) return null;
        if (A.al === 0) return { al: A.be * B.al, be: A.be * B.be };
        if (B.al === 0) return { al: B.be * A.al, be: B.be * A.be };
        return null;
      }
      case 'div': {
        const A = affine(a.a), B = affine(a.b);
        if (!A || !B || B.al !== 0 || B.be === 0) return null;
        return { al: A.al / B.be, be: A.be / B.be };
      }
      default: return null;
    }
  }
  // C · n^a · ρ^n, ou null
  function forme(a) {
    const c = constante(a);
    if (c !== null) return { C: c, a: 0, rho: 1 };
    switch (a.t) {
      case 'par': return forme(a.a);
      case 'n': return { C: 1, a: 1, rho: 1 };
      case 'neg': { const A = forme(a.a); return A && { C: -A.C, a: A.a, rho: A.rho }; }
      case 'mul': {
        const A = forme(a.a), B = forme(a.b);
        return A && B && { C: A.C * B.C, a: A.a + B.a, rho: A.rho * B.rho };
      }
      case 'div': {
        const A = forme(a.a), B = forme(a.b);
        if (!A || !B || B.C === 0 || B.rho === 0) return null;
        return { C: A.C / B.C, a: A.a - B.a, rho: A.rho / B.rho };
      }
      case 'pow': {
        const k = constante(a.b);
        if (k !== null) {
          const A = forme(a.a);
          if (!A || A.C <= 0 || A.rho <= 0) return null;
          return { C: A.C ** k, a: A.a * k, rho: A.rho ** k };
        }
        const b = constante(a.a), E = affine(a.b);
        if (b !== null && b > 0 && E) return { C: b ** E.be, a: 0, rho: b ** E.al };
        return null;
      }
      case 'fn': {
        if (a.nom === 'sqrt') {
          const A = forme(a.a);
          if (!A || A.C <= 0 || A.rho <= 0) return null;
          return { C: Math.sqrt(A.C), a: A.a / 2, rho: Math.sqrt(A.rho) };
        }
        if (a.nom === 'abs') { const A = forme(a.a); return A && { C: Math.abs(A.C), a: A.a, rho: Math.abs(A.rho) }; }
        if (a.nom === 'exp') { const E = affine(a.a); return E && { C: Math.exp(E.be), a: 0, rho: Math.exp(E.al) }; }
        return null;
      }
      default: return null;
    }
  }
  const proche = (u, v) => Math.abs(u - v) <= 1e-12 * Math.max(1, Math.abs(v));

  // Nature d'une série de référence reconnue
  //   { nature: 'conv'|'div', type: 'p'|'geo'|'npgeo', p, r, C }
  function natureReference(arbre) {
    const f = forme(arbre);
    if (!f || !(f.C > 0) || !(f.rho > 0)) return null;
    if (proche(f.rho, 1)) {
      const p = -f.a;
      return { nature: p > 1 ? 'conv' : 'div', type: 'p', p, C: f.C };
    }
    if (proche(f.a, 0)) return { nature: f.rho < 1 ? 'conv' : 'div', type: 'geo', r: f.rho, C: f.C };
    return { nature: f.rho < 1 ? 'conv' : 'div', type: 'npgeo', r: f.rho, a: f.a, C: f.C };
  }

  // ===========================================================================
  //  5. Les suites des tests (sur |x_n| et |y_n|)
  // ===========================================================================
  function lAbs(serie, n) { const v = serie.log(n); return v && v.l !== Infinity ? v : null; }
  const suites = {
    // x_n / y_n
    rapport(X, Y) {
      return (n) => {
        const a = lAbs(X, n), b = lAbs(Y, n);
        if (!a || !b || b.s === 0) return NaN;
        if (a.s === 0) return 0;
        return Math.exp(a.l - b.l);
      };
    },
    // |x_n|^(1/n)
    racine(X) {
      return (n) => {
        const a = lAbs(X, n);
        if (!a) return NaN;
        if (a.s === 0) return 0;
        return Math.exp(a.l / n);
      };
    },
    // |x_(n+1) / x_n|
    quotient(X) {
      return (n) => {
        const a = lAbs(X, n), b = lAbs(X, n + 1);
        if (!a || !b || a.s === 0) return NaN;
        if (b.s === 0) return 0;
        return Math.exp(b.l - a.l);
      };
    },
  };

  // Plus petit K ≥ n0 tel que cond(n) pour tout n de [K, nMax] ; on vérifie aussi
  // quelques indices plus grands (2^k), au-delà de la table.
  function rangDepuis(cond, n0, nMax, kMax) {
    let K = n0;
    for (let n = nMax; n >= n0; n--) {
      if (!cond(n)) { K = n + 1; break; }
    }
    if (K > nMax) return { K: null, echecAu: nMax };
    // contrôle au-delà de la table
    for (let k = Math.ceil(Math.log2(nMax + 1)); k <= (kMax || 26); k++) {
      for (const n of [2 ** k, 2 ** k + 1, 3 * 2 ** (k - 1)]) {
        if (n <= nMax) continue;
        const c = cond(n);
        if (c === false) return { K: null, echecAu: n, auDela: true, Ktable: K };
      }
    }
    return { K };
  }

  // ===========================================================================
  //  6. Sommes des aires : Σ_{n=N}^{M} |x_n| et reste estimé
  // ===========================================================================
  function reste(serie, tab) {
    // estimation de Σ_{n>M} |x_n| pour une série convergente
    const M = tab.M;
    const lM = tab.L[M], lM1 = tab.L[M + 1];
    if (!Number.isFinite(lM)) return { R: NaN };
    if (tab.V[M] === 0) return { R: 0, inc: 0 };
    const q = Math.exp(lM1 - lM);                          // quotient local
    const a2 = lAbs(serie, 2 * M);
    const p = a2 && a2.s !== 0 ? -(a2.l - lM) / Math.LN2 : Infinity;   // exposant local
    let R;
    if (q < 0.999) R = Math.exp(lM1) / (1 - q);
    else if (p > 1.0001) R = Math.exp(lM) * M ** p * (M + 0.5) ** (1 - p) / (p - 1);
    else return { R: Infinity };
    // incertitude : comparaison avec l'estimation faite à M/2
    const m = M >> 1;
    const qm = Math.exp(tab.L[m + 1] - tab.L[m]);
    const pm = -(tab.L[M] - tab.L[m]) / Math.LN2;
    let Rm;
    if (qm < 0.999) Rm = Math.exp(tab.L[m + 1]) / (1 - qm);
    else if (pm > 1.0001) Rm = Math.exp(tab.L[m]) * m ** pm * (m + 0.5) ** (1 - pm) / (pm - 1);
    else Rm = NaN;
    const inc = Number.isFinite(Rm) ? Math.abs((tab.P[M] + R) - (tab.P[m] + Rm)) : R;
    return { R, inc };
  }
  function sommePartielle(tab, N, M) {
    if (M < N) return 0;
    const avant = N - 1 >= tab.n0 ? tab.P[N - 1] : 0;
    return tab.P[Math.min(M, tab.M)] - avant;
  }

  // ===========================================================================
  //  7. Nature d'une série (référence reconnue, sinon par les tests eux-mêmes)
  // ===========================================================================
  function natureSerie(serie, tab) {
    const ref = natureReference(serie.arbre);
    if (ref) return Object.assign({ certain: true }, ref);
    // terme général qui ne tend pas vers 0 (le dernier quart de la table)
    const n1 = tab.M >> 2;
    let minTail = Infinity;
    for (let n = n1; n <= tab.M; n += 97) if (Number.isFinite(tab.V[n])) minTail = Math.min(minTail, tab.V[n]);
    if (minTail > 1e-3) return { nature: 'div', type: 'grossiere', certain: false };
    // test du quotient, puis de la racine
    const q = estimerLimite(suites.quotient(serie), tab.n0, { kMax: 24 });
    if ((q.type === 'fini' || q.type === 'zero') && q.L < 1 - Math.max(3 * (q.incertitude || 0), 1e-6)) return { nature: 'conv', type: 'quotient', r: q.L, certain: false };
    if (q.type === 'infini' || (q.type === 'fini' && q.L > 1 + Math.max(3 * q.incertitude, 1e-6))) return { nature: 'div', type: 'quotient', r: q.type === 'infini' ? Infinity : q.L, certain: false };
    const r = estimerLimite(suites.racine(serie), tab.n0);
    if ((r.type === 'fini' || r.type === 'zero') && r.L < 1 - Math.max(3 * (r.incertitude || 0), 1e-6)) return { nature: 'conv', type: 'racine', r: r.L, certain: false };
    // exposant de décroissance : x_n ≈ C / n^p ?
    const pe = estimerLimite((n) => {
      const a = lAbs(serie, n), b = lAbs(serie, 2 * n);
      if (!a || !b || a.s === 0 || b.s === 0) return NaN;
      return -(b.l - a.l) / Math.LN2;
    }, tab.n0, { kMax: 24 });
    if (pe.type === 'fini') {
      const p = pe.L;
      const unPres = Math.abs(p - 1) <= Math.max(0.05, 3 * pe.incertitude);
      const pr = unPres ? 1 : Math.round(p * 1e6) / 1e6;
      // la limite de x_n · n^p : finie et > 0, c'est une comparaison par limite avec 1/n^p
      const c = estimerLimite((n) => { const a = lAbs(serie, n); return a && a.s ? Math.exp(a.l + pr * Math.log(n)) : NaN; }, tab.n0, { kMax: 24 });
      const net = c.type === 'fini' && c.L > 0;
      if (unPres) {
        // p = 1 : 1/(2n − 1) diverge (x_n · n → 1/2), log n / n aussi (x_n · n → ∞) ;
        // mais 1/(n log n) (diverge) et 1/(n log² n) (converge) ont tous deux x_n · n → 0 : on ne décide pas.
        if (net) return { nature: 'div', type: 'pequiv', p: 1, certain: false };
        if (c.type === 'infini') return { nature: 'div', type: 'pplus', p: 1, certain: false };
        return { nature: null, type: 'inconnue', certain: false };
      }
      return { nature: p > 1 ? 'conv' : 'div', type: net ? 'pequiv' : 'pnum', p, certain: false };
    }
    return { nature: null, type: 'inconnue', certain: false };
  }

  // ===========================================================================
  //  8. L'analyse d'un test
  // ===========================================================================
  //  mode : 'comparaison' | 'limite' | 'racine' | 'quotient'
  //  X, Y : séries (creerSerie) ; TX, TY : tables (tabuler) ; opts : { N, eps, r1, K }
  // La partie coûteuse (natures, limite de la suite du test), calculée une fois
  // par couple de séries et par test ; analyser() la réutilise quand on bouge N, ε ou r1.
  function preparer(mode, X, TX, Y, TY) {
    const n0 = Math.max(TX.n0, TY ? TY.n0 : 1);
    const base = { mode, n0, natureX: natureSerie(X, TX) };
    if (Y) base.natureY = natureSerie(Y, TY);
    if (mode === 'limite') base.limite = estimerLimite(suites.rapport(X, Y), n0);
    else if (mode === 'racine') base.limite = estimerLimite(suites.racine(X), n0, { kMax: 26 });
    else if (mode === 'quotient') base.limite = estimerLimite(suites.quotient(X), n0, { kMax: 24 });
    return base;
  }

  function analyser(mode, X, TX, Y, TY, opts, base) {
    opts = opts || {};
    if (!base || base.mode !== mode) base = preparer(mode, X, TX, Y, TY);
    const res = { mode, base };
    const n0 = base.n0;
    res.n0 = n0;
    res.natureX = base.natureX;
    if (Y) res.natureY = base.natureY;
    const M = TX.M;

    if (mode === 'comparaison') {
      // dans quel sens l'inégalité vaut-elle à partir d'un certain rang ?
      const tol = 1e-12;
      const xLey = (n) => !(TX.L[n] > TY.L[n] + tol * Math.max(1, Math.abs(TY.L[n])));
      const yLex = (n) => !(TY.L[n] > TX.L[n] + tol * Math.max(1, Math.abs(TX.L[n])));
      const loin = (cmp) => (n) => {
        const a = lAbs(X, n), b = lAbs(Y, n);
        if (!a || !b) return null;
        return cmp === 'xy' ? !(a.l > b.l + 1e-9 * Math.max(1, Math.abs(b.l))) : !(b.l > a.l + 1e-9 * Math.max(1, Math.abs(a.l)));
      };
      const c1 = rangDepuis((n) => (n > M ? loin('xy')(n) : xLey(n)), n0, M);
      const c2 = rangDepuis((n) => (n > M ? loin('yx')(n) : yLex(n)), n0, M);
      let sens = null, rang = null;
      if (c1.K !== null && (c2.K === null || c1.K <= c2.K)) { sens = 'xy'; rang = c1.K; }
      else if (c2.K !== null) { sens = 'yx'; rang = c2.K; }
      // égalité à partir d'un rang : les deux sens valent ; on garde x ≤ y
      res.sens = sens;                       // 'xy' : x_n ≤ y_n ;  'yx' : y_n ≤ x_n
      res.Nmin = rang;
      res.echec = sens ? null : (c1.echecAu || c2.echecAu);
      const N = opts.N != null ? Math.max(n0, Math.round(opts.N)) : rang;
      res.N = N;
      res.hypotheseOK = sens !== null && N >= rang;
      // la conclusion
      if (sens) {
        const petite = sens === 'xy' ? res.natureX : res.natureY;  // la série majorée
        const grande = sens === 'xy' ? res.natureY : res.natureX;  // la série qui majore
        if (grande.nature === 'conv') res.conclusion = { enonce: 1, serie: sens === 'xy' ? 'x' : 'y', nature: 'conv' };
        else if (petite.nature === 'div') res.conclusion = { enonce: 2, serie: sens === 'xy' ? 'y' : 'x', nature: 'div' };
        else res.conclusion = { enonce: null };
      } else res.conclusion = { enonce: null, sansInegalite: true };
      return res;
    }

    if (mode === 'limite') {
      const lim = base.limite;
      res.limite = lim;
      // positivité stricte exigée par le théorème
      res.zeros = TX.nNul + TY.nNul;
      const r = lim.type === 'fini' ? lim.L : lim.type === 'zero' ? 0 : lim.type === 'infini' ? Infinity : null;
      res.r = r;
      res.rExact = lim.type === 'fini' ? reconnaitre(lim.L, lim.incertitude) : lim.type === 'zero' ? { valeur: 0, tex: '0', texte: '0' } : null;
      const ratio = suites.rapport(X, Y);
      const TR = (n) => (n <= M ? Math.exp(TX.L[n] - TY.L[n]) : ratio(n));
      if (r !== null && r > 0 && r < Infinity) {
        const eps = opts.eps != null ? opts.eps : r / 2;
        res.eps = eps;
        const rg = rangDepuis((n) => { const v = TR(n); return Number.isFinite(v) ? Math.abs(v - r) < eps : null; }, n0, M);
        res.Nmin = rg.K; res.echec = rg.echecAu;
        const nY = res.natureY.nature;
        res.conclusion = nY ? { enonce: 1, serie: 'x', nature: nY } : { enonce: null };
      } else if (r === 0) {
        const eps = opts.eps != null ? opts.eps : 1;
        res.eps = eps;
        const rg = rangDepuis((n) => { const v = TR(n); return Number.isFinite(v) ? v < eps : null; }, n0, M);
        res.Nmin = rg.K; res.echec = rg.echecAu;
        res.conclusion = res.natureY.nature === 'conv' ? { enonce: 2, serie: 'x', nature: 'conv' } : { enonce: null };
      } else if (r === Infinity) {
        const eps = opts.eps != null ? opts.eps : 1;   // ici : x_n/y_n > eps
        res.eps = eps;
        const rg = rangDepuis((n) => { const v = TR(n); return Number.isFinite(v) ? v > eps : null; }, n0, M);
        res.Nmin = rg.K; res.echec = rg.echecAu;
        res.conclusion = res.natureY.nature === 'div' ? { enonce: 'infini', serie: 'x', nature: 'div' } : { enonce: null };
      } else {
        res.conclusion = { enonce: null, sansLimite: true };
      }
      res.N = opts.N != null && res.Nmin != null ? Math.max(res.Nmin, Math.round(opts.N)) : res.Nmin;
      return res;
    }

    // racine et quotient
    const estQuotient = mode === 'quotient';
    const suite = estQuotient ? suites.quotient(X) : suites.racine(X);
    const lim = base.limite;
    res.limite = lim;
    const r = lim.type === 'fini' ? lim.L : lim.type === 'zero' ? 0 : lim.type === 'infini' ? Infinity : null;
    res.r = r;
    res.rExact = lim.type === 'fini' ? reconnaitre(lim.L, lim.incertitude) : lim.type === 'zero' ? { valeur: 0, tex: '0', texte: '0' } : null;
    res.zeros = TX.nNul;
    const tolUn = lim.type === 'fini' ? Math.max(3 * lim.incertitude, 1e-6) : 0;
    const TS = estQuotient
      ? (n) => (n < M ? Math.exp(TX.L[n + 1] - TX.L[n]) : suite(n))
      : (n) => (n <= M ? Math.exp(TX.L[n] / n) : suite(n));
    if (r === null) { res.cas = 'sansLimite'; res.conclusion = { enonce: null, sansLimite: true }; return res; }
    if (r < 1 - tolUn) {
      res.cas = 'a';
      let r1 = opts.r1 != null ? opts.r1 : (r + 1) / 2;
      r1 = Math.min(Math.max(r1, r + 1e-9), 1 - 1e-9);
      if (estQuotient && r1 <= 0) r1 = 0.5;
      res.r1 = r1;
      const rg = rangDepuis((n) => { const v = TS(n); return Number.isFinite(v) ? v <= r1 * (1 + 1e-12) : null; }, n0, M, estQuotient ? 24 : 26);
      res.Kmin = rg.K; res.echec = rg.echecAu;
      res.K = opts.K != null && rg.K != null ? Math.max(rg.K, Math.round(opts.K)) : rg.K;
      res.conclusion = { enonce: 'a', serie: 'x', nature: 'conv' };
    } else if (r > 1 + tolUn) {
      res.cas = 'b';
      const rg = rangDepuis((n) => { const v = TS(n); return Number.isFinite(v) ? v >= 1 - 1e-12 : null; }, n0, M, estQuotient ? 24 : 26);
      res.Kmin = rg.K; res.echec = rg.echecAu;
      res.K = opts.K != null && rg.K != null ? Math.max(rg.K, Math.round(opts.K)) : rg.K;
      res.conclusion = { enonce: 'b', serie: 'x', nature: 'div' };
    } else {
      res.cas = 'r1';
      res.conclusion = { enonce: null, rEgal1: true };
    }
    return res;
  }

  // ===========================================================================
  //  9. Aides pour l'affichage : le terme général avec n remplacé par n + 1
  // ===========================================================================
  function remplacerN(a, par) {
    switch (a.t) {
      case 'n': return par;
      case 'num': case 'const': return a;
      case 'par': case 'neg': case 'fact': case 'fn': return Object.assign({}, a, { a: remplacerN(a.a, par) });
      default: return Object.assign({}, a, { a: remplacerN(a.a, par), b: remplacerN(a.b, par) });
    }
  }
  const N_PLUS_1 = { t: 'par', a: { t: 'add', a: { t: 'n' }, b: { t: 'num', q: { n: 1n, d: 1n }, src: '1' } } };
  // x = B^(c n) : x^(1/n) = B^c (affichage du test de la racine)
  function racineSimple(a) {
    const b = a.t === 'par' ? a.a : a;
    if (b.t !== 'pow') return null;
    const E = affine(b.b);
    if (!E || E.be !== 0 || E.al === 0) return null;
    return { base: b.a, c: E.al };
  }

  return {
    // nombres en logarithme
    deNombre, versNombre, lAdd, evalLog, evalSimple, logFactorielle,
    // séries
    creerSerie, tabuler, M_TABLE,
    // limites
    estimerLimite, reconnaitre,
    // références
    forme, affine, natureReference, natureSerie,
    // tests
    suites, rangDepuis, preparer, analyser,
    // sommes
    reste, sommePartielle,
    // affichage
    remplacerN, N_PLUS_1, racineSimple,
  };
});
