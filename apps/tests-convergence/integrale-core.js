/* =============================================================================
   Tests de convergence — le test de l'intégrale (noyau de calcul, sans interface)
   MPU1054 · UQTR · P.-O. Parisé · 2026

   Pour une série Σ x_n dont le terme général s'écrit x_n = f(n), on cherche :
     1. le plus petit rang N tel que f soit positive et décroissante sur [N, ∞)
        (vérifié sur une grille jusqu'à t = 10^15, en logarithme) ;
     2. une primitive F de f (l'intégrale indéfinie ∫ f(t) dt = F(t) + C), avec
        les règles du calcul intégral : puissance d'une fonction affine, fractions
        partielles, changement de variable u = g(t), intégration par parties.
        Toute primitive trouvée est vérifiée numériquement (F' = f) ;
     3. la limite de F(b) lorsque b → ∞, par les ordres de grandeur
        c · t^a (log t)^b (log log t)^c e^(…) ;
     4. à défaut de primitive, l'intégrale calculée numériquement (Gauss-Legendre).
   Le test : Σ_{n ≥ N} f(n) converge si et seulement si ∫_N^∞ f converge.

   Utilisable dans le navigateur (window.IntegraleNoyau) et dans Node.
   ============================================================================= */
(function (racine, fabrique) {
  const enNode = typeof module === 'object' && module.exports;
  const SN = enNode ? require('./serie-core.js') : racine.SerieNoyau;
  const T = enNode ? require('./tests-core.js') : racine.TestsNoyau;
  const noyau = fabrique(SN, T);
  if (enNode) module.exports = noyau;
  else racine.IntegraleNoyau = noyau;
})(typeof self !== 'undefined' ? self : this, function (SN, T) {
  'use strict';

  // ===========================================================================
  //  1. Nombres : { v: valeur, f: fraction exacte { p, q } ou null }
  // ===========================================================================
  const pgcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  function Fr(p, q) {
    if (q === undefined) q = 1;
    if (!Number.isInteger(p) || !Number.isInteger(q) || q === 0) return null;
    if (Math.abs(p) > 4e15 || Math.abs(q) > 4e15) return null;
    if (q < 0) { p = -p; q = -q; }
    const g = pgcd(p, q) || 1;
    return { p: p / g, q: q / g };
  }
  const nbFr = (p, q) => { const f = Fr(p, q === undefined ? 1 : q); return { v: p / (q === undefined ? 1 : q), f }; };
  function nbDe(v) {
    if (Number.isInteger(v) && Math.abs(v) < 4e15) return { v, f: { p: v, q: 1 } };
    for (let q = 2; q <= 64; q++) {
      const p = Math.round(v * q);
      if (Math.abs(v * q - p) <= 1e-12 * Math.max(1, Math.abs(v * q))) return { v: p / q, f: Fr(p, q) };
    }
    return { v, f: null };
  }
  const UN = { v: 1, f: { p: 1, q: 1 } }, ZERO = { v: 0, f: { p: 0, q: 1 } };
  function nbAdd(a, b) {
    const f = a.f && b.f ? Fr(a.f.p * b.f.q + b.f.p * a.f.q, a.f.q * b.f.q) : null;
    return { v: f ? f.p / f.q : a.v + b.v, f };
  }
  function nbMul(a, b) {
    const f = a.f && b.f ? Fr(a.f.p * b.f.p, a.f.q * b.f.q) : null;
    return { v: f ? f.p / f.q : a.v * b.v, f };
  }
  const nbNeg = (a) => ({ v: -a.v, f: a.f ? { p: -a.f.p, q: a.f.q } : null });
  const nbSub = (a, b) => nbAdd(a, nbNeg(b));
  function nbInv(a) {
    if (a.f && a.f.p !== 0) { const f = Fr(a.f.q, a.f.p); return { v: f ? f.p / f.q : 1 / a.v, f }; }
    return { v: 1 / a.v, f: null };
  }
  const nbDiv = (a, b) => nbMul(a, nbInv(b));
  const nbZero = (a) => (a.f ? a.f.p === 0 : Math.abs(a.v) < 1e-300);
  const nbUn = (a) => (a.f ? a.f.p === 1 && a.f.q === 1 : Math.abs(a.v - 1) < 1e-15);
  const nbEntier = (a) => (a.f ? a.f.q === 1 : Number.isInteger(a.v));
  function nbPuiss(a, k) {   // k entier
    let r = UN, b = a, e = Math.abs(k);
    while (e) { if (e & 1) r = nbMul(r, b); b = nbMul(b, b); e >>= 1; }
    return k < 0 ? nbInv(r) : r;
  }

  // ===========================================================================
  //  2. Expressions en t
  //   { k:'c', n, tex? }  constante (tex : constante symbolique, π, e…)
  //   { k:'t' }            la variable
  //   { k:'+', a:[…] }     somme        { k:'*', a:[…] }  produit
  //   { k:'^', b, e }      puissance d'exposant constant (nombre)
  //   { k:'fn', f, a, base? }  exp, log, sin, cos, tan, atan, asin, acos,
  //                            sinh, cosh, tanh, abs ; base : exp(g log b) = b^g
  // ===========================================================================
  const K = (v) => ({ k: 'c', n: typeof v === 'number' ? nbDe(v) : v });
  const KF = (p, q) => ({ k: 'c', n: nbFr(p, q === undefined ? 1 : q) });
  const VT = { k: 't' };
  const somme = (...a) => ({ k: '+', a });
  const produit = (...a) => ({ k: '*', a });
  const puiss = (b, e) => ({ k: '^', b, e: typeof e === 'number' ? nbDe(e) : e });
  const fonc = (f, a, base) => (base ? { k: 'fn', f, a, base } : { k: 'fn', f, a });
  const estNum = (E) => E.k === 'c' && !E.tex;
  function dependT(E) {
    switch (E.k) {
      case 'c': return false;
      case 't': return true;
      case '+': case '*': return E.a.some(dependT);
      case '^': return dependT(E.b);
      default: return dependT(E.a);
    }
  }
  const texNb = (n) => (n.f ? n.f.p + '/' + n.f.q : String(n.v));
  function cle(E) {
    switch (E.k) {
      case 'c': return E.tex ? 'S' + E.tex : 'c' + (E.n.f ? E.n.f.p + '/' + E.n.f.q : E.n.v.toPrecision(14));
      case 't': return 't';
      case '+': return '+(' + E.a.map(cle).sort().join(',') + ')';
      case '*': return '*(' + E.a.map(cle).sort().join(',') + ')';
      case '^': return '^(' + cle(E.b) + ';' + texNb(E.e) + ')';
      default: return E.f + '(' + cle(E.a) + ')' + (E.base ? '@' + E.base.v : '');
    }
  }

  // Valeur en t (virgule flottante)
  function puissReelle(x, e) {
    if (x >= 0) return Math.pow(x, e.v);
    if (nbEntier(e)) return Math.pow(x, e.v);
    if (e.f && e.f.q % 2 === 1) return (e.f.p % 2 === 0 ? 1 : -1) * Math.pow(-x, e.v);
    return NaN;
  }
  function val(E, t) {
    switch (E.k) {
      case 'c': return E.n.v;
      case 't': return t;
      case '+': { let s = 0; for (const x of E.a) s += val(x, t); return s; }
      case '*': { let s = 1; for (const x of E.a) s *= val(x, t); return s; }
      case '^': return puissReelle(val(E.b, t), E.e);
      default: {
        const u = val(E.a, t);
        switch (E.f) {
          case 'exp': return Math.exp(u);
          case 'log': return u > 0 ? Math.log(u) : NaN;
          case 'sin': return Math.sin(u);
          case 'cos': return Math.cos(u);
          case 'tan': return Math.tan(u);
          case 'atan': return Math.atan(u);
          case 'asin': return Math.asin(u);
          case 'acos': return Math.acos(u);
          case 'sinh': return Math.sinh(u);
          case 'cosh': return Math.cosh(u);
          case 'tanh': return Math.tanh(u);
          case 'abs': return Math.abs(u);
          default: return NaN;
        }
      }
    }
  }

  // ---------------------------------------------------------------- simplifier
  function separer(E) {          // E = coef · corps (coef : nombre)
    if (estNum(E)) return [E.n, null];
    if (E.k === '*') {
      let c = UN;
      const reste = [];
      for (const x of E.a) { if (estNum(x)) c = nbMul(c, x.n); else reste.push(x); }
      return [c, reste.length === 0 ? null : reste.length === 1 ? reste[0] : { k: '*', a: reste }];
    }
    return [UN, E];
  }
  function simp(E) {
    switch (E.k) {
      case 'c': case 't': return E;
      case '+': return simpSomme(E.a.map(simp));
      case '*': return simpProduit(E.a.map(simp));
      case '^': return simpPuiss(simp(E.b), E.e);
      default: return simpFonc(E.f, simp(E.a), E.base);
    }
  }
  function simpSomme(liste) {
    const plat = [];
    for (const x of liste) { if (x.k === '+') plat.push(...x.a); else plat.push(x); }
    let c0 = ZERO;
    const groupes = new Map();
    for (const x of plat) {
      const [c, corps] = separer(x);
      if (!corps) { c0 = nbAdd(c0, c); continue; }
      const k = cle(corps);
      const g = groupes.get(k);
      if (g) g.c = nbAdd(g.c, c); else groupes.set(k, { c, corps });
    }
    const termes = [];
    for (const { c, corps } of groupes.values()) {
      if (nbZero(c) || Math.abs(c.v) < 1e-300) continue;
      termes.push(nbUn(c) ? corps : simpProduit([{ k: 'c', n: c }, corps]));
    }
    if (!nbZero(c0)) termes.push({ k: 'c', n: c0 });
    if (!termes.length) return K(0);
    if (termes.length === 1) return termes[0];
    return { k: '+', a: termes };
  }
  function simpProduit(liste) {
    const plat = [];
    for (const x of liste) { if (x.k === '*') plat.push(...x.a); else plat.push(x); }
    let c = UN;
    const groupes = new Map();      // clé de la base → { base, e }
    const exps = [];
    for (const x of plat) {
      if (estNum(x)) { c = nbMul(c, x.n); continue; }
      if (x.k === 'fn' && x.f === 'exp') { exps.push(x); continue; }
      const base = x.k === '^' ? x.b : x, e = x.k === '^' ? x.e : UN;
      const k = cle(base);
      const g = groupes.get(k);
      if (g) g.e = nbAdd(g.e, e); else groupes.set(k, { base, e });
    }
    if (nbZero(c)) return K(0);
    const facteurs = [];
    for (const { base, e } of groupes.values()) {
      if (nbZero(e)) continue;
      const f = simpPuiss(base, e);
      if (estNum(f)) c = nbMul(c, f.n); else if (f.k === '*') { for (const y of f.a) { if (estNum(y)) c = nbMul(c, y.n); else facteurs.push(y); } } else facteurs.push(f);
    }
    // exponentielles : e^a e^b = e^(a+b) (même base d'affichage)
    if (exps.length === 1) facteurs.push(exps[0]);
    else if (exps.length > 1) {
      const memeBase = exps.every((x) => (x.base ? x.base.v : null) === (exps[0].base ? exps[0].base.v : null));
      const e = simpFonc('exp', simpSomme(exps.map((x) => x.a)), memeBase ? exps[0].base : undefined);
      if (estNum(e)) c = nbMul(c, e.n); else facteurs.push(e);
    }
    if (nbZero(c)) return K(0);
    if (facteurs.length === 1 && facteurs[0].k === '+' && !nbUn(c)) return simpSomme(facteurs[0].a.map((x) => simpProduit([{ k: 'c', n: c }, x])));
    facteurs.sort((a, b) => rangFacteur(a) - rangFacteur(b));
    if (!facteurs.length) return { k: 'c', n: c };
    if (nbUn(c) && facteurs.length === 1) return facteurs[0];
    return { k: '*', a: nbUn(c) ? facteurs : [{ k: 'c', n: c }].concat(facteurs) };
  }
  function rangFacteur(x) {
    if (x.k === 'c') return 0;
    if (!dependT(x)) return 1;
    if (x.k === 't' || (x.k === '^' && x.b.k === 't')) return 2;
    if (x.k === '+' || (x.k === '^' && x.b.k === '+')) return 3;
    return 4;
  }
  function simpPuiss(b, e) {
    if (nbZero(e)) return K(1);
    if (nbUn(e)) return b;
    if (estNum(b)) {
      if (b.n.f && nbEntier(e) && Math.abs(e.v) <= 64) return { k: 'c', n: nbPuiss(b.n, e.v) };
      if (b.n.f && b.n.f.p > 0 && e.f) {
        // racine exacte ? (p/q)^(r/s)
        const s = e.f.q, r = e.f.p;
        const rp = Math.round(Math.pow(b.n.f.p, 1 / s)), rq = Math.round(Math.pow(b.n.f.q, 1 / s));
        if (Math.pow(rp, s) === b.n.f.p && Math.pow(rq, s) === b.n.f.q) return { k: 'c', n: nbPuiss(nbFr(rp, rq), r) };
      }
      if (b.n.v > 0 || nbEntier(e)) return { k: '^', b, e };
      return { k: '^', b, e };
    }
    if (b.k === '^') return simpPuiss(b.b, nbMul(b.e, e));
    if (b.k === '*') {
      const negatifNonEntier = !nbEntier(e) && b.a.some((x) => estNum(x) && x.n.v < 0);
      if (!negatifNonEntier) return simpProduit(b.a.map((x) => simpPuiss(x, e)));
    }
    if (b.k === 'fn' && b.f === 'exp') return simpFonc('exp', simpProduit([{ k: 'c', n: e }, b.a]), b.base);
    return { k: '^', b, e };
  }
  function simpFonc(f, a, base) {
    if (f === 'exp') {
      if (estNum(a) && nbZero(a.n)) return K(1);
      // exp(c log b) = b^c (b, c rationnels, c entier)
      if (a.k === '*' && a.a.length === 2 && estNum(a.a[0]) && nbEntier(a.a[0].n) && a.a[1].k === 'fn' && a.a[1].f === 'log' && estNum(a.a[1].a) && a.a[1].a.n.f) {
        if (Math.abs(a.a[0].n.v) <= 30) return { k: 'c', n: nbPuiss(a.a[1].a.n, a.a[0].n.v) };
      }
      if (a.k === 'fn' && a.f === 'log' && estNum(a.a)) return a.a;
      if (a.k === 'fn' && a.f === 'log') return a.a;
      return base ? { k: 'fn', f, a, base } : { k: 'fn', f, a };
    }
    if (f === 'log') {
      if (estNum(a) && nbUn(a.n)) return K(0);
      if (estNum(a) && a.n.f && a.n.f.p > 0) {
        // log(p/q) = log p − log q ; log(2^k) = k log 2
        const { p, q } = a.n.f;
        if (q !== 1) return simpSomme([logEntier(p), simpProduit([K(-1), logEntier(q)])]);
        return logEntier(p);
      }
      if (a.k === 'c' && a.tex === 'e') return K(1);
      if (a.k === 'fn' && a.f === 'exp') return a.a;
      // log(c t^k) = log c + k log t
      const [c, corps] = separer(a);
      if (corps && (corps.k === 't' || (corps.k === '^' && corps.b.k === 't')) && c.v > 0) {
        const k = corps.k === 't' ? UN : corps.e;
        const lt = { k: 'fn', f: 'log', a: VT };
        const terme = nbUn(k) ? lt : simpProduit([{ k: 'c', n: k }, lt]);
        return nbUn(c) ? terme : simpSomme([{ k: 'fn', f: 'log', a: { k: 'c', n: c } }, terme]);
      }
      return { k: 'fn', f, a };
    }
    if (f === 'atan' && !dependT(a)) {
      // arctan des valeurs usuelles : multiples de π/12
      const v = Math.atan(val(a, 0)) / Math.PI * 12;
      if (Math.abs(v - Math.round(v)) < 1e-12) return simpProduit([{ k: 'c', n: nbFr(Math.round(v), 12) }, PI_]);
    }
    if ((f === 'sin' || f === 'tan' || f === 'sinh' || f === 'tanh' || f === 'asin') && estNum(a) && nbZero(a.n)) return K(0);
    if ((f === 'cos' || f === 'cosh') && estNum(a) && nbZero(a.n)) return K(1);
    return { k: 'fn', f, a };
  }

  const PI_ = { k: 'c', n: { v: Math.PI, f: null }, tex: '\\pi' };
  // log d'un entier ; log(p^k) = k log p
  function logEntier(m) {
    if (m === 1) return K(0);
    for (let p = 2; p * p <= m && p < 1000; p++) {
      if (m % p) continue;
      let k = 0, r = m;
      while (r % p === 0) { r /= p; k++; }
      if (r === 1) return simpProduit([K(k), { k: 'fn', f: 'log', a: K(p) }]);
      break;
    }
    return { k: 'fn', f: 'log', a: K(m) };
  }

  // ---------------------------------------------------------------- dérivée
  function D(E) {
    switch (E.k) {
      case 'c': return K(0);
      case 't': return K(1);
      case '+': return somme(...E.a.map(D));
      case '*': return somme(...E.a.map((x, i) => produit(...E.a.map((y, j) => (i === j ? D(y) : y)))));
      case '^': return produit({ k: 'c', n: E.e }, puiss(E.b, nbSub(E.e, UN)), D(E.b));
      default: {
        const u = E.a, du = D(u);
        switch (E.f) {
          case 'exp': return produit(E, du);
          case 'log': return produit(puiss(u, -1), du);
          case 'sin': return produit(fonc('cos', u), du);
          case 'cos': return produit(K(-1), fonc('sin', u), du);
          case 'tan': return produit(puiss(fonc('cos', u), -2), du);
          case 'atan': return produit(puiss(somme(K(1), puiss(u, 2)), -1), du);
          case 'asin': return produit(puiss(somme(K(1), produit(K(-1), puiss(u, 2))), nbFr(-1, 2)), du);
          case 'acos': return produit(K(-1), puiss(somme(K(1), produit(K(-1), puiss(u, 2))), nbFr(-1, 2)), du);
          case 'sinh': return produit(fonc('cosh', u), du);
          case 'cosh': return produit(fonc('sinh', u), du);
          case 'tanh': return produit(puiss(fonc('cosh', u), -2), du);
          default: return null;
        }
      }
    }
  }
  const derivee = (E) => { const d = D(E); return d ? simp(d) : null; };

  // ---------------------------------------------------------------- depuis l'analyseur
  function nbDeQ(q) {
    const p = Number(q.n), d = Number(q.d);
    if (Math.abs(p) < 4e15 && Math.abs(d) < 4e15) return nbFr(p, d);
    return { v: SN.qVersNombre(q), f: null };
  }
  class Entiers extends Error {}
  function depuisArbre(a) {
    switch (a.t) {
      case 'par': return depuisArbre(a.a);
      case 'num': return { k: 'c', n: nbDeQ(a.q) };
      case 'n': return VT;
      case 'const': return a.nom === 'pi' ? { k: 'c', n: { v: Math.PI, f: null }, tex: '\\pi' } : { k: 'c', n: { v: Math.E, f: null }, tex: 'e' };
      case 'neg': return produit(K(-1), depuisArbre(a.a));
      case 'add': return somme(depuisArbre(a.a), depuisArbre(a.b));
      case 'sub': return somme(depuisArbre(a.a), produit(K(-1), depuisArbre(a.b)));
      case 'mul': return produit(depuisArbre(a.a), depuisArbre(a.b));
      case 'div': return produit(depuisArbre(a.a), puiss(depuisArbre(a.b), -1));
      case 'pow': {
        const B = simp(depuisArbre(a.a)), X = simp(depuisArbre(a.b));
        if (!dependT(X)) {
          if (estNum(X)) return puiss(B, X.n);
          return fonc('exp', produit(X, fonc('log', B)));
        }
        if (B.k === 'c' && B.tex === 'e') return fonc('exp', X);
        if (!dependT(B)) {
          if (!(B.n.v > 0)) throw new Entiers();          // (−1)^n : seulement aux entiers
          return fonc('exp', produit(X, fonc('log', B)), B.n);
        }
        return fonc('exp', produit(X, fonc('log', B)));
      }
      case 'fact': throw new Entiers();                     // n! : seulement aux entiers
      case 'fn': {
        const A = depuisArbre(a.a);
        switch (a.nom) {
          case 'sqrt': return puiss(A, nbFr(1, 2));
          case 'ln': case 'log': return fonc('log', A);
          case 'arctan': return fonc('atan', A);
          case 'arcsin': return fonc('asin', A);
          case 'arccos': return fonc('acos', A);
          default: return fonc(a.nom, A);
        }
      }
      default: throw new Error('arbre');
    }
  }

  // ===========================================================================
  //  3. LaTeX d'une expression (la primitive)
  // ===========================================================================
  function texFrac(f) { return f.q === 1 ? String(f.p) : (f.p < 0 ? '-' : '') + '\\frac{' + Math.abs(f.p) + '}{' + f.q + '}'; }
  function texNombre(n, o) {
    if (n.f) return texFrac(n.f);
    let s = Number(n.v.toPrecision(5)).toString();
    if (/e/.test(s)) { const [m, e] = s.split('e'); s = m + ' \\cdot 10^{' + Number(e) + '}'; }
    return o && o.virgule ? s.replace('.', '{,}') : s;
  }
  function tex(E, o) {
    o = o || {};
    const v = o.variable || 't';
    const par = (s) => '\\left(' + s + '\\right)';
    const atomique = (X) => X.k === 't' || (X.k === 'c' && (X.tex ? !/[+\-\s]/.test(X.tex) : X.n.f && X.n.f.q === 1 && X.n.f.p >= 0));
    // « polynomial » : t, t^k, √t, une somme (pour écrire \frac{2t-1}{\sqrt{3}})
    const simpleT = (X) => X.k === 't' || X.k === '+' || (X.k === '^' && X.b.k === 't');
    function T_(X) {
      switch (X.k) {
        case 'c': return X.tex ? X.tex : texNombre(X.n, o);
        case 't': return v;
        case '+': {
          const termes = X.a.slice().sort((a, b) => degre(b) - degre(a));
          let s = '';
          termes.forEach((x, i) => {
            const [c, corps] = separer(x);
            const neg = c.v < 0;
            const absTerme = neg ? simpProduit([{ k: 'c', n: nbNeg(c) }].concat(corps ? [corps] : [])) : x;
            const tt = T_(absTerme);
            s += i === 0 ? (neg ? '-' + tt : tt) : (neg ? ' - ' : ' + ') + tt;
          });
          return s;
        }
        case '*': return texProduit(X);
        case '^': return texPuiss(X.b, X.e);
        default: return texFonc(X);
      }
    }
    function texPuiss(b, e) {
      if (nbUn(e)) return T_(b);
      if (e.f && e.f.p === 1 && e.f.q === 2) return '\\sqrt{' + T_(b) + '}';
      if (e.v < 0) return '\\frac{1}{' + texPuiss(b, nbNeg(e)) + '}';
      const base = atomique(b) ? T_(b) : par(T_(b));
      return base + '^{' + (e.f ? (e.f.q === 1 ? e.f.p : e.f.p + '/' + e.f.q) : texNombre(e, o)) + '}';
    }
    function fracSeule(s) {
      if (!s.startsWith('\\frac{')) return false;
      let i = 5, groupes = 0;
      while (groupes < 2 && i < s.length) {
        if (s[i] !== '{') return false;
        let p = 0;
        for (; i < s.length; i++) { if (s[i] === '{') p++; else if (s[i] === '}') { p--; if (!p) { i++; break; } } }
        groupes++;
      }
      return groupes === 2 && i === s.length;
    }
    function texFonc(X) {
      const A = X.a;
      if (X.f === 'exp') {
        if (estNum(A) && nbUn(A.n)) return 'e';
        if (X.base) {
          const g = exposantSansLog(A, X.base);
          if (g) return texBase(X.base) + '^{' + T_(g) + '}';
        }
        return 'e^{' + T_(A) + '}';
      }
      if (X.f === 'abs') return '\\left\\lvert ' + T_(A) + ' \\right\\rvert';
      const nom = { log: '\\log', sin: '\\sin', cos: '\\cos', tan: '\\tan', atan: '\\arctan', asin: '\\arcsin', acos: '\\arccos', sinh: '\\sinh', cosh: '\\cosh', tanh: '\\tanh' }[X.f];
      const s = T_(A);
      if (A.k === 't' || (A.k === 'c' && atomique(A))) return nom + ' ' + s;
      if (X.f === 'log' && fracSeule(s)) return nom + ' ' + s;
      return nom + par(s);
    }
    // contenu d'une somme : son signe (celui du terme dominant) et le pgcd des coefficients
    function contenu(S) {
      const termes = S.a.map((x) => separer(x));
      if (!termes.every(([c]) => c.f)) return null;
      const dom = S.a.slice().sort((a, b) => degre(b) - degre(a))[0];
      const signe = separer(dom)[0].v < 0 ? -1 : 1;
      let g = 0, l = 1;
      for (const [c] of termes) { g = pgcd(g, c.f.p); l = l / pgcd(l, c.f.q) * c.f.q; }
      if (!g) return null;
      const ct = nbFr(signe * g, l);
      if (nbUn(ct)) return null;
      return { c: ct, reste: simpSomme(S.a.map((x) => simpProduit([{ k: 'c', n: nbInv(ct) }, x]))) };
    }
    function texProduit(X) {
      let [c, corps] = separer(X);
      let fac = corps ? (corps.k === '*' ? corps.a.slice() : [corps]) : [];
      fac = fac.map((f) => {
        const base = f.k === '^' ? f.b : f, e = f.k === '^' ? f.e : UN;
        if (base.k !== '+' || !nbEntier(e)) return f;
        const ct = contenu(base);
        if (!ct) return f;
        c = nbMul(c, nbPuiss(ct.c, e.v));
        return nbUn(e) ? ct.reste : { k: '^', b: ct.reste, e };
      });
      const num = [], den = [], numC = [], denC = [];
      for (const f of fac) {
        if (f.k === 'fn' && f.f === 'exp' && estNum(f.a) && f.a.n.v < 0 && !f.base) { denC.push({ k: 'fn', f: 'exp', a: { k: 'c', n: nbNeg(f.a.n) } }); continue; }
        const neg = f.k === '^' && f.e.v < 0;
        const g = neg ? (nbUn(nbNeg(f.e)) ? f.b : { k: '^', b: f.b, e: nbNeg(f.e) }) : f;
        (dependT(f) ? (neg ? den : num) : (neg ? denC : numC)).push(g);
      }
      const signe = c.v < 0 ? '-' : '';
      const ca = c.v < 0 ? nbNeg(c) : c;
      const p = ca.f ? String(ca.f.p) : texNombre(ca, o), q = ca.f ? ca.f.q : 1;
      const joindre = (liste, seul) => {
        let s = '';
        liste.forEach((x) => {
          let tt = T_(x);
          if (x.k === '+' && !seul) tt = par(tt);
          if (s && /^\d/.test(tt) && /\d$/.test(s)) s += ' \\cdot ';
          else if (s) s += ' ';
          s += tt;
        });
        return s;
      };
      const avecCoef = (coef, liste) => {
        if (!liste.length) return coef;
        if (coef === '1') return joindre(liste, liste.length === 1);
        const j = joindre(liste, false);
        return coef + (/^\d/.test(j) ? ' \\cdot ' : ' ') + j;
      };
      if (!den.length) {
        const fractionC = q !== 1 || denC.length;
        // \frac{2t - 1}{\sqrt{3}}, \frac{t}{\log 2}
        if (fractionC && p === '1' && !numC.length && num.length === 1 && simpleT(num[0])) {
          return signe + '\\frac{' + T_(num[0]) + '}{' + avecCoef(String(q), denC) + '}';
        }
        const prefixe = fractionC ? '\\frac{' + avecCoef(p, numC) + '}{' + avecCoef(String(q), denC) + '}' : avecCoef(p, numC);
        if (!num.length) return signe + prefixe;
        if (prefixe === '1') return signe + joindre(num, num.length === 1);
        const corpsT = joindre(num, false);
        return signe + prefixe + (/^\d/.test(corpsT) && /\d$/.test(prefixe) ? ' \\cdot ' : ' ') + corpsT;
      }
      return signe + '\\frac{' + avecCoef(p, numC.concat(num)) + '}{' + avecCoef(String(q), denC.concat(den)) + '}';
    }
    return T_(E);
  }
  function degre(x) {
    if (x.k === 'c') return -1;
    if (x.k === 't') return 1;
    if (x.k === '^' && x.b.k === 't') return x.e.v;
    if (x.k === '*') return x.a.reduce((s, y) => s + Math.max(0, degre(y)), 0);
    if (!dependT(x)) return -1;
    return 0.5;
  }
  // exp(g · log b) → g (pour écrire b^g)
  function exposantSansLog(A, b) {
    const estLogB = (x) => x.k === 'fn' && x.f === 'log' && estNum(x.a) && Math.abs(x.a.n.v - b.v) < 1e-12 * Math.max(1, b.v);
    if (A.k === '*' && A.a.some(estLogB)) {
      const reste = A.a.filter((x, i) => i !== A.a.findIndex(estLogB));
      return simp({ k: '*', a: reste });
    }
    if (A.k === '+') {
      const parts = A.a.map((x) => exposantSansLog(x, b));
      if (parts.every(Boolean)) return simpSomme(parts);
    }
    return null;
  }
  function texBase(b) { return b.f ? (b.f.q === 1 ? String(b.f.p) : '\\left(\\frac{' + b.f.p + '}{' + b.f.q + '}\\right)') : String(b.v); }

  // ===========================================================================
  //  4. Constantes reconnues (fractions, √k, π, log k) → expression
  // ===========================================================================
  function reconnaitreConstante(v) {
    if (!Number.isFinite(v)) return null;
    if (Math.abs(v) < 1e-14) return K(0);
    const frac = (x, qmax) => {
      for (let q = 1; q <= qmax; q++) {
        const p = Math.round(x * q);
        if (Math.abs(p) > 1e9) return null;
        if (Math.abs(x * q - p) <= 1e-9 * Math.max(1, Math.abs(x * q))) return Fr(p, q);
      }
      return null;
    };
    let f = frac(v, 2000);
    if (f) return { k: 'c', n: { v: f.p / f.q, f } };
    for (const k of [2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21, 23]) {
      f = frac(v / Math.sqrt(k), 400);
      if (f) return simpProduit([{ k: 'c', n: { v: f.p / f.q, f } }, puiss(K(k), nbFr(1, 2))]);
      f = frac(v * Math.sqrt(k), 400);
      if (f) return simpProduit([{ k: 'c', n: { v: f.p / f.q, f } }, puiss(K(k), nbFr(-1, 2))]);
    }
    const symb = [[Math.PI, { k: 'c', n: { v: Math.PI, f: null }, tex: '\\pi' }]];
    for (const b of [2, 3, 5, 10]) symb.push([Math.log(b), fonc('log', K(b))]);
    for (const [w, X] of symb) {
      f = frac(v / w, 400);
      if (f) return simpProduit([{ k: 'c', n: { v: f.p / f.q, f } }, X]);
      f = frac(v * w, 400);
      if (f) return simpProduit([{ k: 'c', n: { v: f.p / f.q, f } }, puiss(X, -1)]);
    }
    return { k: 'c', n: { v, f: null } };
  }

  // ===========================================================================
  //  5. Polynômes et fractions rationnelles (coefficients : nombres)
  // ===========================================================================
  const DEG_MAX = 10;
  const polyNettoyer = (P) => { while (P.length > 1 && nbZero(P[P.length - 1])) P.pop(); return P; };
  function polyAdd(P, Q) { const R = []; for (let i = 0; i < Math.max(P.length, Q.length); i++) R.push(nbAdd(P[i] || ZERO, Q[i] || ZERO)); return polyNettoyer(R); }
  function polyMul(P, Q) {
    const R = new Array(P.length + Q.length - 1).fill(ZERO);
    for (let i = 0; i < P.length; i++) for (let j = 0; j < Q.length; j++) R[i + j] = nbAdd(R[i + j], nbMul(P[i], Q[j]));
    return polyNettoyer(R);
  }
  function polyDe(E) {
    switch (E.k) {
      case 'c': return E.tex ? null : [E.n];
      case 't': return [ZERO, UN];
      case '+': { let P = [ZERO]; for (const x of E.a) { const Q = polyDe(x); if (!Q) return null; P = polyAdd(P, Q); } return P; }
      case '*': { let P = [UN]; for (const x of E.a) { const Q = polyDe(x); if (!Q) return null; P = polyMul(P, Q); if (P.length - 1 > DEG_MAX) return null; } return P; }
      case '^': {
        if (!nbEntier(E.e) || E.e.v < 0 || E.e.v > DEG_MAX) return null;
        const B = polyDe(E.b); if (!B) return null;
        let P = [UN]; for (let i = 0; i < E.e.v; i++) { P = polyMul(P, B); if (P.length - 1 > DEG_MAX) return null; }
        return P;
      }
      default: return null;
    }
  }
  function ratDe(E) {
    const P = polyDe(E);
    if (P) return { P, Q: [UN] };
    switch (E.k) {
      case '*': {
        let R = { P: [UN], Q: [UN] };
        for (const x of E.a) {
          const S = ratDe(x); if (!S) return null;
          R = { P: polyMul(R.P, S.P), Q: polyMul(R.Q, S.Q) };
          if (R.P.length - 1 > DEG_MAX || R.Q.length - 1 > DEG_MAX) return null;
        }
        return R;
      }
      case '^': {
        if (!nbEntier(E.e) || Math.abs(E.e.v) > DEG_MAX) return null;
        const B = ratDe(E.b); if (!B) return null;
        let R = { P: [UN], Q: [UN] };
        for (let i = 0; i < Math.abs(E.e.v); i++) {
          R = { P: polyMul(R.P, B.P), Q: polyMul(R.Q, B.Q) };
          if (R.P.length - 1 > DEG_MAX || R.Q.length - 1 > DEG_MAX) return null;
        }
        return E.e.v < 0 ? { P: R.Q, Q: R.P } : R;
      }
      case '+': {
        let R = { P: [ZERO], Q: [UN] };
        for (const x of E.a) {
          const S = ratDe(x); if (!S) return null;
          R = { P: polyAdd(polyMul(R.P, S.Q), polyMul(S.P, R.Q)), Q: polyMul(R.Q, S.Q) };
          if (R.P.length - 1 > DEG_MAX || R.Q.length - 1 > DEG_MAX) return null;
        }
        return R;
      }
      default: return null;
    }
  }
  // division euclidienne P = S Q + R
  function polyDiv(P, Q) {
    let R = P.slice();
    const dq = Q.length - 1;
    const S = new Array(Math.max(1, P.length - dq)).fill(ZERO);
    for (let i = P.length - 1; i >= dq; i--) {
      if (nbZero(R[i])) continue;
      const c = nbDiv(R[i], Q[dq]);
      S[i - dq] = c;
      for (let j = 0; j <= dq; j++) R[i - dq + j] = nbSub(R[i - dq + j], nbMul(c, Q[j]));
      R[i] = ZERO;
    }
    R = polyNettoyer(R.slice(0, Math.max(1, dq)));
    return { S: polyNettoyer(S), R };
  }
  // ---------------------------------------------------------------- complexes
  const cx = (re, im) => ({ re, im: im || 0 });
  const cAdd = (a, b) => cx(a.re + b.re, a.im + b.im);
  const cSub = (a, b) => cx(a.re - b.re, a.im - b.im);
  const cMul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const cDiv = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  const cAbs = (a) => Math.hypot(a.re, a.im);
  function polyValC(a, z) { let p = cx(0), dp = cx(0); for (let i = a.length - 1; i >= 0; i--) { dp = cAdd(cMul(dp, z), p); p = cAdd(cMul(p, z), cx(a[i])); } return [p, dp]; }
  // Racines (méthode d'Aberth-Ehrlich, puis Newton)
  function racines(c) {
    const n = c.length - 1;
    if (n < 1) return [];
    const a = c.map((x) => x / c[n]);
    const R = 1 + Math.max(...a.slice(0, n).map(Math.abs));
    let z = [];
    for (let k = 0; k < n; k++) z.push(cx(0.6 * R * Math.cos(2 * Math.PI * k / n + 0.4), 0.6 * R * Math.sin(2 * Math.PI * k / n + 0.4)));
    for (let it = 0; it < 800; it++) {
      let corr = 0;
      for (let i = 0; i < n; i++) {
        const [p, dp] = polyValC(a, z[i]);
        if (cAbs(p) === 0) continue;
        const ratio = cDiv(p, dp);
        let s = cx(0);
        for (let j = 0; j < n; j++) if (j !== i) s = cAdd(s, cDiv(cx(1), cSub(z[i], z[j])));
        const w = cDiv(ratio, cSub(cx(1), cMul(ratio, s)));
        z[i] = cSub(z[i], w);
        corr = Math.max(corr, cAbs(w) / (1 + cAbs(z[i])));
      }
      if (corr < 1e-15) break;
    }
    return z.map((r) => (Math.abs(r.im) < 1e-9 * (1 + Math.abs(r.re)) ? cx(r.re, 0) : r));
  }
  // Racines regroupées : [{ r, m }]
  function racinesMultiples(c) {
    const z = racines(c);
    const groupes = [];
    for (const r of z) {
      const g = groupes.find((G) => cAbs(cSub(G.r, r)) < 1e-5 * (1 + cAbs(r)));
      if (g) { g.somme = cAdd(g.somme, r); g.m++; g.r = cx(g.somme.re / g.m, g.somme.im / g.m); }
      else groupes.push({ r, m: 1, somme: r });
    }
    for (const g of groupes) {
      if (Math.abs(g.r.im) < 1e-7 * (1 + Math.abs(g.r.re))) g.r = cx(g.r.re, 0);
      if (g.m > 1) {
        let d = c.slice();
        for (let k = 1; k < g.m; k++) d = d.slice(1).map((x, i) => x * (i + 1));
        for (let it = 0; it < 30; it++) {
          const [p, dp] = polyValC(d, g.r);
          if (cAbs(dp) === 0) break;
          const w = cDiv(p, dp);
          g.r = cSub(g.r, w);
          if (cAbs(w) < 1e-16 * (1 + cAbs(g.r))) break;
        }
        if (Math.abs(g.r.im) < 1e-9 * (1 + Math.abs(g.r.re))) g.r = cx(g.r.re, 0);
      }
      // racine rationnelle ?
      for (const part of ['re', 'im']) {
        const x = g.r[part];
        for (let q = 1; q <= 1000; q++) { const p = Math.round(x * q); if (Math.abs(x * q - p) <= 1e-9 * Math.max(1, Math.abs(x * q))) { g.r[part] = p / q; break; } }
      }
    }
    return groupes;
  }
  // Système linéaire complexe (Gauss, pivot partiel)
  function resoudreC(A, b) {
    const n = b.length;
    const M = A.map((l, i) => l.slice().concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let l = c + 1; l < n; l++) if (cAbs(M[l][c]) > cAbs(M[piv][c])) piv = l;
      if (cAbs(M[piv][c]) < 1e-300) return null;
      [M[c], M[piv]] = [M[piv], M[c]];
      for (let l = 0; l < n; l++) {
        if (l === c) continue;
        const f = cDiv(M[l][c], M[c][c]);
        for (let k = c; k <= n; k++) M[l][k] = cSub(M[l][k], cMul(f, M[c][k]));
      }
    }
    return M.map((l, i) => cDiv(l[n], l[i]));
  }

  // ===========================================================================
  //  6. Primitives
  // ===========================================================================
  // Un facteur affine à coefficients entiers : t − r, r = p/q  →  q t − p
  function lineaire(r) {
    const f = Fr(Math.round(r * 1), 1) && Math.abs(r - Math.round(r)) < 1e-10 ? Fr(Math.round(r), 1) : null;
    const rc = f ? { k: 'c', n: { v: f.p, f } } : reconnaitreConstante(r);
    if (rc.n && rc.n.f) {
      const { p, q } = rc.n.f;
      return { E: simp(somme(produit(K(q), VT), K(-p))), echelle: q };
    }
    return { E: simp(somme(VT, produit(K(-1), rc))), echelle: 1 };
  }
  // Facteur quadratique (t − α)² + β², à coefficients entiers si possible
  function quadratique(al, be) {
    const P = [nbDe(al * al + be * be), nbDe(-2 * al), UN];
    let m = 1;
    for (const c of P) if (c.f) m = m / pgcd(m, c.f.q) * c.f.q;
    const ok = P.every((c) => c.f) && m <= 1e6;
    const coef = ok ? P.map((c) => nbMul(c, nbFr(m, 1))) : P;
    return { E: simp(somme(produit({ k: 'c', n: coef[2] }, puiss(VT, 2)), produit({ k: 'c', n: coef[1] }, VT), { k: 'c', n: coef[0] })), echelle: ok ? m : 1 };
  }

  // Fraction rationnelle : division, fractions partielles
  function primitiveRationnelle(R) {
    const dq = R.Q.length - 1;
    if (dq < 1) {
      // polynôme
      const termes = R.P.map((c, k) => produit({ k: 'c', n: nbDiv(c, nbFr(k + 1, 1)) }, puiss(VT, k + 1)));
      return { F: simp(somme(...termes)), methode: 'polynome' };
    }
    const { S, R: Rr } = polyDiv(R.P, R.Q);
    const termes = [];
    if (!(S.length === 1 && nbZero(S[0]))) S.forEach((c, k) => termes.push(produit({ k: 'c', n: nbDiv(c, nbFr(k + 1, 1)) }, puiss(VT, k + 1))));
    const qd = R.Q.map((c) => c.v), rd = Rr.map((c) => c.v);
    const groupes = racinesMultiples(qd);
    if (groupes.some((g) => g.r.im !== 0 && g.m > 1)) return null;
    // inconnues : A_{i,j}, 1 ≤ j ≤ m_i
    const inconnues = [];
    for (const g of groupes) for (let j = 1; j <= g.m; j++) inconnues.push({ g, j });
    const n = inconnues.length;
    if (n !== dq) return null;
    const echant = [];
    for (let s = 0.5; echant.length < n + 3; s += 1.37) {
      if (groupes.every((g) => cAbs(cSub(cx(s), g.r)) > 0.2)) echant.push(s);
    }
    const valR = (s) => { let p = 0; for (let i = rd.length - 1; i >= 0; i--) p = p * s + rd[i]; return p; };
    const valQ = (s) => { let p = 0; for (let i = qd.length - 1; i >= 0; i--) p = p * s + qd[i]; return p; };
    const ligne = (s) => inconnues.map(({ g, j }) => { let d = cx(1); for (let k = 0; k < j; k++) d = cMul(d, cSub(cx(s), g.r)); return cDiv(cx(1), d); });
    const A0 = resoudreC(echant.slice(0, n).map(ligne), echant.slice(0, n).map((s) => cx(valR(s) / valQ(s))));
    if (!A0) return null;
    // coefficients nuls ou rationnels : on les arrondit (les racines doubles sont moins précises)
    const amax = Math.max(...A0.map(cAbs));
    const propre = (x) => {
      if (Math.abs(x) < 1e-7 * amax) return 0;
      for (let q = 1; q <= 2000; q++) { const p = Math.round(x * q); if (Math.abs(x * q - p) <= 1e-8 * Math.max(1, Math.abs(x * q))) return p / q; }
      return x;
    };
    const A = A0.map((a) => cx(propre(a.re), propre(a.im)));
    // contrôle sur les autres points
    for (const s of echant.slice(n)) {
      const l = ligne(s);
      let tot = cx(0);
      l.forEach((x, i) => { tot = cAdd(tot, cMul(x, A[i])); });
      const ref = valR(s) / valQ(s);
      if (Math.abs(tot.re - ref) > 1e-8 * Math.max(1e-12, Math.abs(ref)) + 1e-14) return null;
    }
    // logarithmes (coefficient, facteur) et autres termes
    const logs = [];
    let W = 0;                         // poids des logarithmes : F ≈ W log t à l'infini
    inconnues.forEach(({ g, j }, i) => {
      const a = A[i];
      if (g.r.im === 0) {
        const r = g.r.re;
        const lin = lineaire(r);
        if (j === 1) {
          if (Math.abs(a.re) < 1e-13) return;
          logs.push({ c: a.re, fac: lin.E });
          W += a.re;
        } else {
          // ∫ a / (t − r)^j = −a / ((j − 1)(t − r)^(j−1)) ; t − r = lin / echelle
          if (Math.abs(a.re) < 1e-13) return;
          const coef = -a.re * Math.pow(lin.echelle, j - 1) / (j - 1);
          termes.push(produit(reconnaitreConstante(coef), puiss(lin.E, 1 - j)));
        }
      } else if (g.r.im > 0) {
        const al = g.r.re, be = g.r.im;
        const quad = quadratique(al, be);
        if (Math.abs(a.re) > 1e-13) { logs.push({ c: a.re, fac: quad.E }); W += 2 * a.re; }
        if (Math.abs(a.im) > 1e-13) {
          // −2b · arctan((t − α)/β) ; (t − α)/β = (m t − m α)/(m β)
          const alC = reconnaitreConstante(al);
          let m = 1;
          if (alC.n && alC.n.f) m = alC.n.f.q;
          const numE = simp(somme(produit(K(m), VT), produit(K(-1), reconnaitreConstante(m * al))));
          const denC = reconnaitreConstante(m * be);
          const arg = simp(produit(numE, puiss(denC, -1)));
          termes.push(produit(reconnaitreConstante(-2 * a.im), fonc('atan', arg)));
        }
      }
    });
    // les logarithmes : regroupés en un seul si les coefficients sont des multiples d'une même fraction
    if (logs.length) {
      // rapports au premier coefficient : des fractions ?
      const rap = logs.map((L) => Fr(Math.round(L.c / logs[0].c * 720), 720));
      const okRap = logs.length > 1 && rap.every((f, i) => f && Math.abs(f.p / f.q - logs[i].c / logs[0].c) < 1e-9);
      if (okRap) {
        let l = 1;
        for (const f of rap) l = l / pgcd(l, f.q) * f.q;
        let g = 0;
        for (const f of rap) g = pgcd(g, f.p * (l / f.q));
        // exposants entiers e_i ; F = k log Π fac_i^(e_i)
        const e = rap.map((f) => f.p * (l / f.q) / g);
        let kv = logs[0].c * g / l;
        // le facteur d'exposant positif au numérateur, le plus grand exposant positif d'abord
        if (e.reduce((s, x) => s + Math.max(0, x), 0) < e.reduce((s, x) => s + Math.max(0, -x), 0)) { kv = -kv; e.forEach((x, i) => { e[i] = -x; }); }
        const fac = logs.map((L, i) => puiss(L.fac, e[i]));
        termes.push(produit(reconnaitreConstante(kv), fonc('log', simp(produit(...fac)))));
      } else {
        logs.forEach((L) => termes.push(produit(reconnaitreConstante(L.c), fonc('log', L.fac))));
      }
    }
    const F = simp(somme(...termes));
    const polyNul = S.length === 1 && nbZero(S[0]);
    return { F, methode: 'fractions', infini: !polyNul ? (S[S.length - 1].v > 0 ? 1 : -1) : (Math.abs(W) > 1e-10 ? Math.sign(W) : 0) };
  }

  // u est-il affine en t ? { a, b } (constantes, éventuellement symboliques)
  function affineT(E) {
    if (!dependT(E)) return { a: K(0), b: E };
    if (E.k === 't') return { a: K(1), b: K(0) };
    if (E.k === '*') {
      const cst = E.a.filter((x) => !dependT(x)), var_ = E.a.filter(dependT);
      if (var_.length === 1 && var_[0].k === 't') return { a: simp(produit(...cst)), b: K(0) };
      return null;
    }
    if (E.k === '+') {
      let a = [], b = [];
      for (const x of E.a) { const r = affineT(x); if (!r) return null; a.push(r.a); b.push(r.b); }
      return { a: simp(somme(...a)), b: simp(somme(...b)) };
    }
    return null;
  }

  // (a t + b)^p, p ≠ −1 ; log si p = −1
  function primitivePuissanceAffine(G) {
    let base, p;
    if (G.k === '^') { base = G.b; p = G.e; } else { base = G; p = UN; }
    const L = affineT(base);
    if (!L || !dependT(base)) return null;
    if (nbZero(nbAdd(p, UN))) return { F: simp(produit(puiss(L.a, -1), fonc('log', base))), methode: 'puissance' };
    const q = nbAdd(p, UN);
    return { F: simp(produit({ k: 'c', n: nbInv(q) }, puiss(L.a, -1), puiss(base, q))), methode: 'puissance' };
  }

  // Changement de variable u = g(t) : f = k · u' · φ(u), φ(v) = v^p ou e^v
  function candidats(E, sortie, contexte) {
    if (E.k === '^' && dependT(E.b) && E.b.k !== 't') sortie.push({ u: E.b, type: 'puiss', p: E.e });
    if (E.k === 'fn' && E.f === 'exp' && dependT(E.a)) sortie.push({ u: E.a, type: 'exp' });
    if (E.k === 'fn' && E.f !== 'exp' && dependT(E.a) && contexte === 'facteur') sortie.push({ u: E, type: 'puiss', p: UN });
    if (E.k === '*') E.a.forEach((x) => candidats(x, sortie, 'facteur'));
    else if (E.k === '+') E.a.forEach((x) => candidats(x, sortie, 'terme'));
    else if (E.k === '^') candidats(E.b, sortie, 'base');
    else if (E.k === 'fn') candidats(E.a, sortie, 'arg');
  }
  function pointsTest(t0) { return [0.31, 0.83, 1.97, 4.41, 9.73, 23.9, 61.3].map((d) => t0 + d); }
  function primitiveSubstitution(G, t0) {
    const liste = [];
    candidats(G, liste, 'facteur');
    // une fonction seule (log t) n'est pas un changement de variable utile si elle est tout G
    for (const c of liste) {
      const du = derivee(c.u);
      if (!du || !dependT(c.u)) continue;
      const phi = c.type === 'exp' ? (u) => Math.exp(u) : (u) => puissReelle(u, c.p);
      const pts = pointsTest(t0);
      let k0 = null, ok = true, n = 0;
      for (const t of pts) {
        const fv = val(G, t), uv = val(c.u, t), d = val(du, t);
        const den = d * phi(uv);
        if (!Number.isFinite(fv) || !Number.isFinite(den) || den === 0) continue;
        const k = fv / den;
        n++;
        if (k0 === null) k0 = k;
        else if (!(Math.abs(k - k0) <= 1e-9 * Math.max(1e-300, Math.abs(k0)))) { ok = false; break; }
      }
      if (!ok || n < 4 || !Number.isFinite(k0) || k0 === 0) continue;
      const kE = reconnaitreConstante(k0);
      let F;
      if (c.type === 'exp') F = produit(kE, fonc('exp', c.u, G.base));
      else if (nbZero(nbAdd(c.p, UN))) {
        const signe = val(c.u, t0 + 0.5) > 0 ? 1 : -1;
        F = produit(kE, fonc('log', signe > 0 ? c.u : produit(K(-1), c.u)));
      } else {
        const q = nbAdd(c.p, UN);
        F = produit(kE, { k: 'c', n: nbInv(q) }, puiss(c.u, q));
      }
      // garder l'exponentielle telle quelle (base d'affichage)
      if (c.type === 'exp') {
        const expNoeud = trouverExp(G, c.u);
        if (expNoeud) F = produit(kE, expNoeud);
      }
      return { F: simp(F), methode: 'substitution', u: c.u };
    }
    return null;
  }
  function trouverExp(E, u) {
    if (E.k === 'fn' && E.f === 'exp' && cle(E.a) === cle(u)) return E;
    const enfants = E.k === '+' || E.k === '*' ? E.a : E.k === '^' ? [E.b] : E.k === 'fn' ? [E.a] : [];
    for (const x of enfants) { const r = trouverExp(x, u); if (r) return r; }
    return null;
  }

  // Intégration par parties : t^a (log t)^m ; t^m e^(ct+d) ; t^(k) e^(c√t)
  function facteursDe(G) { return G.k === '*' ? G.a : [G]; }
  function primitiveParParties(G) {
    const fac = facteursDe(G);
    let a = ZERO, m = 0, ex = null, autre = false;
    for (const x of fac) {
      if (x.k === 't') a = nbAdd(a, UN);
      else if (x.k === '^' && x.b.k === 't') a = nbAdd(a, x.e);
      else if (x.k === 'fn' && x.f === 'log' && x.a.k === 't') m += 1;
      else if (x.k === '^' && x.b.k === 'fn' && x.b.f === 'log' && x.b.a.k === 't' && nbEntier(x.e) && x.e.v > 0) m += x.e.v;
      else if (x.k === 'fn' && x.f === 'exp' && !ex) ex = x;
      else if (!dependT(x)) { /* constante */ }
      else autre = true;
    }
    if (autre) return null;
    const fact = (k) => { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; };
    const Lt = fonc('log', VT);
    // t^a (log t)^m
    if (!ex && m >= 1 && m <= 6 && !nbZero(nbAdd(a, UN))) {
      const a1 = nbAdd(a, UN);
      const termes = [];
      for (let j = 0; j <= m; j++) {
        const c = nbDiv(nbFr((j % 2 ? -1 : 1) * fact(m) / fact(m - j), 1), nbPuiss(a1, j + 1));
        termes.push(produit({ k: 'c', n: c }, puiss(Lt, m - j)));
      }
      return { F: simp(produit(puiss(VT, a1), somme(...termes))), methode: 'parties' };
    }
    if (ex && m === 0) {
      // t^m e^(ct + d), m entier ≥ 0
      const L = affineT(ex.a);
      if (L && nbEntier(a) && a.v >= 0 && a.v <= 8 && dependT(ex.a)) {
        const mm = a.v, c = L.a;
        const termes = [];
        for (let j = 0; j <= mm; j++) {
          const coef = nbFr((j % 2 ? -1 : 1) * fact(mm) / fact(mm - j), 1);
          termes.push(produit({ k: 'c', n: coef }, puiss(VT, mm - j), puiss(c, -(j + 1))));
        }
        return { F: simp(produit(ex, somme(...termes))), methode: 'parties' };
      }
      // t^k e^(c √t + d) : s = √t
      const arg = ex.a;
      const tS = (y) => y.k === '^' && y.b.k === 't' && y.e.f && y.e.f.p === 1 && y.e.f.q === 2;
      let c = null, d = K(0);
      const termesArg = arg.k === '+' ? arg.a : [arg];
      for (const y of termesArg) {
        if (!dependT(y)) { d = simp(somme(d, y)); continue; }
        if (tS(y)) { c = simp(somme(c || K(0), K(1))); continue; }
        if (y.k === '*' && y.a.filter(dependT).length === 1 && tS(y.a.find(dependT))) { c = simp(somme(c || K(0), produit(...y.a.filter((z) => !dependT(z))))); continue; }
        return null;
      }
      if (c && a.f && (2 * a.v + 1) >= 0 && Number.isInteger(2 * a.v + 1) && 2 * a.v + 1 <= 8) {
        const mm = 2 * a.v + 1;            // ∫ 2 s^mm e^(cs+d) ds
        const s = puiss(VT, nbFr(1, 2));
        const termes = [];
        for (let j = 0; j <= mm; j++) {
          const coef = nbFr(2 * (j % 2 ? -1 : 1) * fact(mm) / fact(mm - j), 1);
          termes.push(produit({ k: 'c', n: coef }, puiss(s, mm - j), puiss(c, -(j + 1))));
        }
        return { F: simp(produit(ex, somme(...termes))), methode: 'parties' };
      }
    }
    return null;
  }

  function integrer(E, t0, prof) {
    prof = prof || 0;
    if (prof > 3) return null;
    E = simp(E);
    if (!dependT(E)) return { F: simp(produit(E, VT)), methode: 'puissance' };
    // constante en facteur
    let c = K(1), G = E;
    if (E.k === '*') {
      const cst = E.a.filter((x) => !dependT(x)), var_ = E.a.filter(dependT);
      if (cst.length) { c = simp(produit(...cst)); G = var_.length === 1 ? var_[0] : { k: '*', a: var_ }; }
    }
    let r = primitivePuissanceAffine(G);
    const R = r ? null : ratDe(G);
    if (R) r = primitiveRationnelle(R);
    if (!r) r = primitiveSubstitution(G, t0);
    if (!r) r = primitiveParParties(G);
    if (!r && G.k === '+') {
      const parts = G.a.map((x) => integrer(x, t0, prof + 1));
      if (parts.every(Boolean)) r = { F: simp(somme(...parts.map((p) => p.F))), methode: parts.every((p) => p.methode === parts[0].methode) ? parts[0].methode : 'somme' };
    }
    if (!r) return null;
    return Object.assign({}, r, { F: simp(produit(c, r.F)) });
  }

  // F' = f, vérifié numériquement
  function verifier(F, f, t0) {
    let n = 0;
    for (const t of pointsTest(t0).concat([t0 + 150, t0 + 1234.5])) {
      const fv = f(t);
      if (!Number.isFinite(fv) || Math.abs(fv) < 1e-200) continue;
      const h = 1e-4 * Math.max(1, t);
      const d = (8 * (val(F, t + h) - val(F, t - h)) - (val(F, t + 2 * h) - val(F, t - 2 * h))) / (12 * h);
      if (!Number.isFinite(d)) return false;
      const echelle = Math.max(Math.abs(fv), 1e-9 * Math.abs(val(F, t)) / Math.max(1, t));
      if (Math.abs(d - fv) > 2e-5 * echelle) return false;
      n++;
    }
    return n >= 3;
  }

  // ===========================================================================
  //  7. Limite en +∞ : ordres de grandeur c · t^p0 (log t)^p1 (log log t)^p2 · e^X
  // ===========================================================================
  const P0 = [0, 0, 0, 0];
  const D_ = (c, p, x) => ({ c, p: p || P0, x: x || null });
  const pNul = (p) => p.every((v) => Math.abs(v) < 1e-12);
  function cmpP(p, q) { for (let i = 0; i < 4; i++) { if (Math.abs(p[i] - q[i]) > 1e-12) return p[i] - q[i]; } return 0; }
  function vers(D) {          // signe de la limite : 'inf', 'zero', 'fini'
    if (D.x) return D.x.c > 0 ? 'inf' : 'zero';
    for (const v of D.p) { if (v > 1e-12) return 'inf'; if (v < -1e-12) return 'zero'; }
    return 'fini';
  }
  function mulD(A, B) {
    if (!A || !B) return null;
    if ((A.c === 0 && vers(B) === 'inf') || (B.c === 0 && vers(A) === 'inf')) return null;
    let x = A.x || B.x;
    if (A.x && B.x) {
      const s = sommeD([A.x, B.x]);
      if (!s) return null;
      x = vers(s) === 'fini' ? null : s;
      if (!x) return null;          // annulation des exponentielles : on renonce
    }
    return D_(A.c * B.c, A.p.map((v, i) => v + B.p[i]), x);
  }
  function powD(A, e) {
    if (!A) return null;
    if (A.c < 0 && !Number.isInteger(e)) return null;
    return D_(Math.pow(A.c, e), A.p.map((v) => v * e), A.x ? D_(A.x.c * e, A.x.p, A.x.x) : null);
  }
  // comparaison des croissances
  function cmpD(A, B) {
    const gA = A.x ? (A.x.c > 0 ? 1 : -1) : 0, gB = B.x ? (B.x.c > 0 ? 1 : -1) : 0;
    if (gA !== gB) return gA - gB;
    if (gA !== 0) {
      const c = cmpP(A.x.p, B.x.p);
      if (c !== 0) return gA > 0 ? c : -c;
      if (Math.abs(A.x.c - B.x.c) > 1e-12 * Math.max(1, Math.abs(A.x.c))) return A.x.c - B.x.c;
    }
    return cmpP(A.p, B.p);
  }
  function sommeD(liste) {
    if (liste.some((x) => !x)) return null;
    let dom = [];
    for (const A of liste) {
      if (A.c === 0) continue;
      if (!dom.length) { dom = [A]; continue; }
      const c = cmpD(A, dom[0]);
      if (c > 0) dom = [A]; else if (c === 0) dom.push(A);
    }
    if (!dom.length) return D_(0);
    const c = dom.reduce((s, A) => s + A.c, 0);
    if (Math.abs(c) <= 1e-11 * dom.reduce((s, A) => s + Math.abs(A.c), 0)) return null;   // annulation
    return D_(c, dom[0].p, dom[0].x);
  }
  function asym(E) {
    switch (E.k) {
      case 'c': return D_(E.n.v);
      case 't': return D_(1, [1, 0, 0, 0]);
      case '+': return sommeD(E.a.map(asym));
      case '*': { let A = D_(1); for (const x of E.a) { A = mulD(A, asym(x)); if (!A) return null; } return A; }
      case '^': return powD(asym(E.b), E.e.v);
      default: {
        const A = asym(E.a);
        if (!A) return null;
        const lim = vers(A);
        switch (E.f) {
          case 'exp':
            if (A.x) return null;
            if (lim === 'fini') return D_(Math.exp(A.c));
            if (lim === 'zero') return D_(1);
            return D_(1, P0, D_(A.c, A.p));
          case 'log': {
            if (A.c <= 0) return null;
            if (A.x) return D_(A.x.c, A.x.p);
            const i = A.p.findIndex((v) => Math.abs(v) > 1e-12);
            if (i < 0) return Math.abs(A.c - 1) < 1e-12 ? D_(0) : D_(Math.log(A.c));
            if (i >= 3) return null;
            const p = [0, 0, 0, 0]; p[i + 1] = 1;
            return D_(A.p[i], p);
          }
          case 'atan': return lim === 'inf' ? D_(Math.sign(A.c) * Math.PI / 2) : lim === 'zero' ? D_(0) : D_(Math.atan(A.c));
          case 'abs': return D_(Math.abs(A.c), A.p, A.x);
          case 'tanh': return lim === 'inf' ? D_(Math.sign(A.c)) : lim === 'zero' ? D_(0) : D_(Math.tanh(A.c));
          default: return lim === 'fini' ? D_(val(E, 1)) : lim === 'zero' ? D_(val({ k: 'fn', f: E.f, a: K(0) }, 0)) : null;
        }
      }
    }
  }
  // F(c) : la variable remplacée par une constante
  function substituer(E, c) {
    switch (E.k) {
      case 'c': return E;
      case 't': return K(c);
      case '+': return { k: '+', a: E.a.map((x) => substituer(x, c)) };
      case '*': return { k: '*', a: E.a.map((x) => substituer(x, c)) };
      case '^': return { k: '^', b: substituer(E.b, c), e: E.e };
      default: return E.base ? { k: 'fn', f: E.f, a: substituer(E.a, c), base: E.base } : { k: 'fn', f: E.f, a: substituer(E.a, c) };
    }
  }
  // Limite de E en +∞, écrite exactement (π/2, log des coefficients…), ou null
  function limSym(E) {
    if (!dependT(E)) return E;
    const A = asym(E);
    if (!A) return null;
    const l = vers(A);
    if (l === 'zero') return K(0);
    if (l === 'inf') return null;
    switch (E.k) {
      case '+': {
        const parts = E.a.map(limSym);
        return parts.every(Boolean) ? simp({ k: '+', a: parts }) : null;
      }
      case '*': {
        const parts = E.a.map(limSym);
        return parts.every(Boolean) ? simp({ k: '*', a: parts }) : null;
      }
      case '^': { const b = limSym(E.b); return b ? simp({ k: '^', b, e: E.e }) : null; }
      case 'fn': {
        const B = asym(E.a);
        if (!B) return null;
        const lb = vers(B);
        if (E.f === 'atan' && lb === 'inf') return simpProduit([{ k: 'c', n: nbFr(B.c > 0 ? 1 : -1, 2) }, PI_]);
        if (lb === 'zero') return simp({ k: 'fn', f: E.f, a: K(0) });
        // argument de limite finie : une fraction rationnelle → rapport des coefficients dominants
        const R = ratDe(E.a);
        if (R) {
          const dp = R.P.length - 1, dq = R.Q.length - 1;
          if (dp === dq) return simp({ k: 'fn', f: E.f, a: { k: 'c', n: nbDiv(R.P[dp], R.Q[dq]) } });
        }
        const a = limSym(E.a);
        return a ? simp({ k: 'fn', f: E.f, a }) : null;
      }
      default: return null;
    }
  }
  // Limite de F en +∞ : { type: 'fini', v } | { type: 'inf', signe } | null
  function limiteInfini(F) {
    const A = asym(F);
    if (!A) return null;
    const l = vers(A);
    if (l === 'inf') return { type: 'inf', signe: Math.sign(A.c) };
    if (l === 'zero') return { type: 'fini', v: 0 };
    return { type: 'fini', v: A.c };
  }

  // ===========================================================================
  //  8. Intégration numérique (Gauss-Legendre à 8 points)
  // ===========================================================================
  const GLx = [0.1834346424956498, 0.5255324099163290, 0.7966664774136267, 0.9602898564975363];
  const GLw = [0.3626837833783620, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];
  function gl8(f, a, b) {
    const m = (a + b) / 2, h = (b - a) / 2;
    let s = 0;
    for (let i = 0; i < 4; i++) s += GLw[i] * (f(m - h * GLx[i]) + f(m + h * GLx[i]));
    return s * h;
  }
  // Intégrale adaptative (bissection tant que deux niveaux diffèrent)
  function integrale(f, a, b, prof) {
    prof = prof || 0;
    const I = gl8(f, a, b), m = (a + b) / 2;
    const I2 = gl8(f, a, m) + gl8(f, m, b);
    if (!Number.isFinite(I2)) return NaN;
    if (prof > 14 || Math.abs(I2 - I) <= 1e-12 * Math.max(Math.abs(I2), 1e-300)) return I2;
    return integrale(f, a, m, prof + 1) + integrale(f, m, b, prof + 1);
  }
  // Table des intégrales cumulées ∫_{n0}^{k} f, k = n0 … M
  function tableIntegrale(f, n0, M) {
    const I = new Float64Array(M + 2).fill(NaN);
    I[n0] = 0;
    let s = 0, c = 0;
    for (let k = n0; k <= M; k++) {
      const x = k < n0 + 64 ? integrale(f, k, k + 1) : gl8(f, k, k + 1);
      if (!Number.isFinite(x)) { for (let j = k + 1; j <= M + 1; j++) I[j] = NaN; break; }
      const u = s + x;
      c += Math.abs(s) >= Math.abs(x) ? (s - u) + x : (x - u) + s;
      s = u;
      I[k + 1] = s + c;
    }
    return I;
  }

  // ===========================================================================
  //  9. f positive et décroissante sur [N, ∞) : le plus petit N
  // ===========================================================================
  function grille(n0) {
    const G = [];
    for (let i = 0; i <= 64 * 32; i++) G.push(n0 + i / 32);
    let t = n0 + 64;
    while (t < 1e7) { t *= 1.004; G.push(t); }
    while (t < 1e15) { t *= 1.04; G.push(t); }
    return G;
  }
  function rangDecroissance(fLog, n0) {
    const G = grille(n0);
    const L = G.map((t) => fLog(t));
    let dernier = -1, type = null;
    for (let i = 0; i < G.length; i++) {
      const v = L[i];
      if (!v || v.s < 0 || Number.isNaN(v.l) || v.l === Infinity) { dernier = i; type = !v || Number.isNaN(v.l) || v.l === Infinity ? 'indefini' : 'negatif'; continue; }
      if (i > 0) {
        const u = L[i - 1];
        if (u && u.s >= 0 && Number.isFinite(u.l) && v.s > 0 && v.l > u.l + 1e-12 * Math.max(1, Math.abs(u.l))) { dernier = i; type = 'croit'; }
        else if (u && u.s === 0 && v.s > 0) { dernier = i; type = 'croit'; }
      }
    }
    if (dernier < 0) return { N: n0 };
    const tEchec = G[dernier];
    if (tEchec > 1e7 * 0.999) return { N: null, echec: { type, t: tEchec } };
    if (type !== 'croit') {
      const N = Math.floor(tEchec) + 1;
      return { N: Math.max(n0, N), echec: { type, t: tEchec } };
    }
    // maximum de f près de G[dernier] : section dorée sur log f
    let a = G[Math.max(0, dernier - 1)], b = G[Math.min(G.length - 1, dernier + 1)];
    const lf = (t) => { const v = fLog(t); return v && v.s > 0 ? v.l : -Infinity; };
    const r = (Math.sqrt(5) - 1) / 2;
    for (let k = 0; k < 80; k++) {
      const c = b - r * (b - a), d = a + r * (b - a);
      if (lf(c) > lf(d)) b = d; else a = c;
    }
    const cMax = (a + b) / 2;
    return { N: Math.max(n0, Math.ceil(cMax - 1e-7)), echec: { type: 'croit', t: cMax }, cMax };
  }

  // ===========================================================================
  //  10. Préparer (le coûteux) et analyser (selon le rang N)
  // ===========================================================================
  const M_TABLE = T.M_TABLE;
  function preparer(X, TX) {
    const arbre = X.arbre, n0 = TX.n0;
    const base = { mode: 'integrale', n0, natureX: T.natureSerie(X, TX), continue: true };
    const fLog = (t) => T.evalLog(arbre, t);
    base.fLog = fLog;
    let E = null;
    try { E = simp(depuisArbre(arbre)); } catch (e) {
      if (e instanceof Entiers) { base.continue = false; base.raison = 'entiers'; return base; }
      base.continue = false; base.raison = 'interne'; return base;
    }
    // f est-elle définie entre les entiers ?
    for (const d of [0.5, 1.25, 2.5, 3.75, 7.5, 12.5]) {
      const v = fLog(n0 + d), w = fLog(Math.round(n0 + d));
      if (w && !v) { base.continue = false; base.raison = 'entiers'; return base; }
    }
    base.E = E;
    const fc = SN.compiler(arbre);
    base.f = (t) => { const v = fc(t); return Number.isFinite(v) ? v : val(E, t); };
    base.texF = SN.texGeneral(arbre, { virgule: false, variable: 't' });
    base.decroissance = rangDecroissance(fLog, n0);
    // primitive
    const t0 = Math.max(n0, base.decroissance.N || n0);
    let prim = null;
    try { prim = integrer(E, t0); } catch (_) { prim = null; }
    if (prim && prim.F && verifier(prim.F, base.f, t0)) {
      let lim = null;
      if (prim.methode === 'fractions' && prim.infini) lim = { type: 'inf', signe: prim.infini };
      else if (prim.methode === 'fractions') lim = { type: 'fini', v: val(prim.F, 1e15) };
      else lim = limiteInfini(prim.F);
      if (lim && lim.type === 'fini' && !Number.isFinite(lim.v)) lim = null;
      let limE = null;
      if (lim && lim.type === 'fini') {
        try { limE = limSym(prim.F); } catch (_) { limE = null; }
        if (limE && !(Math.abs(val(limE, 0) - lim.v) <= 1e-9 * Math.max(1, Math.abs(lim.v)))) limE = null;
      }
      base.prim = { F: prim.F, methode: prim.methode, u: prim.u || null, limite: lim, limE };
    } else base.prim = null;
    // table numérique (sans primitive, ou pour l'affichage au besoin)
    if (!base.prim) base.I = tableIntegrale(base.f, n0, M_TABLE);
    return base;
  }

  // ∫_a^b f (a, b réels ≥ n0), par la primitive si possible
  function integraleAB(base, a, b) {
    if (!(b > a)) return 0;
    if (base.prim) return val(base.prim.F, b) - val(base.prim.F, a);
    const I = base.I, n0 = base.n0;
    const cum = (x) => {
      const k = Math.floor(x);
      if (k < n0) return -integrale(base.f, x, n0);
      if (k > M_TABLE) return I[M_TABLE] + integrale(base.f, M_TABLE, x);
      return I[k] + (x > k ? integrale(base.f, k, x) : 0);
    };
    return cum(b) - cum(a);
  }

  // ∫_N^∞ f, sans primitive : la table jusqu'à M, puis la queue d'après f près de M
  // (décroissance exponentielle : f(M)/(−log q) ; en puissance t^(−p) : M f(M)/(p − 1)).
  // On compare avec la même estimation faite à M/4.
  function queueNum(base, M) {
    const fM = base.f(M);
    if (!(fM > 0)) return fM === 0 ? 0 : NaN;
    const q = base.f(M + 1) / fM;
    if (q < 0.999) return fM / -Math.log(q);
    const a = base.fLog(M), b = base.fLog(2 * M);
    if (!a || !b || a.s <= 0 || b.s <= 0) return NaN;
    const p = -(b.l - a.l) / Math.LN2;
    if (p > 1.02) return M * fM / (p - 1);
    if (p < 0.98) return Infinity;
    return NaN;
  }
  function integraleNumerique(base, N) {
    const M = M_TABLE, M4 = M >> 2;
    const q1 = queueNum(base, M), q4 = queueNum(base, M4);
    if (q1 === Infinity && q4 === Infinity) return Infinity;
    if (!Number.isFinite(q1) || !Number.isFinite(q4)) return null;
    const L1 = integraleAB(base, N, M) + q1, L4 = integraleAB(base, N, M4) + q4;
    if (Math.abs(L1 - L4) <= 1e-3 * Math.max(1e-12, Math.abs(L1))) return L1;
    return null;
  }

  function analyser(base, opts) {
    opts = opts || {};
    const res = { mode: 'integrale', base, n0: base.n0, natureX: base.natureX };
    if (!base.continue) { res.applicable = false; res.raison = base.raison; res.conclusion = null; res.Nmin = undefined; return res; }
    res.applicable = true;
    const dec = base.decroissance;
    res.Nmin = dec.N;
    res.echec = dec.echec || null;
    const N = opts.N != null ? opts.N : (dec.N != null ? dec.N : base.n0);
    res.N = N;
    res.ok = dec.N != null && N >= dec.N;
    res.I = (b) => integraleAB(base, N, b);
    // ∫_N^∞ f
    let L = null, num = false;
    res.FNE = null; res.LE = null;
    if (base.prim && base.prim.limite) {
      const lim = base.prim.limite, F = base.prim.F;
      L = lim.type === 'inf' ? (lim.signe > 0 ? Infinity : -Infinity) : lim.v - val(F, N);
      // F(N) et la valeur de l'intégrale, exactes si possible
      try {
        const FN = simp(substituer(F, N));
        if (Math.abs(val(FN, 0) - val(F, N)) <= 1e-9 * Math.max(1, Math.abs(val(F, N))) && tex(FN).length <= 56) res.FNE = FN;
        if (base.prim.limE && res.FNE) {
          const LE = simp(somme(base.prim.limE, produit(K(-1), res.FNE)));
          if (Math.abs(val(LE, 0) - L) <= 1e-9 * Math.max(1, Math.abs(L)) && tex(LE).length <= 56) res.LE = LE;
        }
      } catch (_) { /* affichage décimal */ }
    } else {
      num = true;
      L = integraleNumerique(base, N);
    }
    res.L = L;
    res.Lnum = num;
    res.FN = base.prim ? val(base.prim.F, N) : null;
    res.conclusion = res.ok && L !== null ? { enonce: 'integrale', serie: 'x', nature: L === Infinity ? 'div' : 'conv', numerique: num } : null;
    return res;
  }

  // Somme Σ_{n ≥ N} x_n par la table, et le reste par les intégrales :
  //   ∫_{M+1}^∞ f ≤ Σ_{n > M} f(n) ≤ ∫_M^∞ f
  function sommeQueue(base, TX, N, L) {
    if (!(Number.isFinite(L)) || !base.prim) return null;
    const M = TX.M;
    const S = T.sommePartielle(TX, N, M);
    const lim = L + val(base.prim.F, N);       // lim F
    const r1 = lim - val(base.prim.F, M + 1), r2 = lim - val(base.prim.F, M);
    return S + (r1 + r2) / 2;
  }

  const texPrimitive = (F, o) => tex(F, o);

  return {
    // expressions
    depuisArbre, simp, val, tex: texPrimitive, derivee, Entiers, substituer, limSym,
    // primitives et limites
    integrer, verifier, limiteInfini, asym, reconnaitreConstante,
    // numérique
    integrale, gl8, tableIntegrale, integraleAB,
    // test
    rangDecroissance, preparer, analyser, sommeQueue,
  };
});
