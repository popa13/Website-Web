/* =============================================================================
   Séries de fonctions — noyau de calcul (UQTR, MPU1054, section 4.1)
   Aucune interface ni dépendance : utilisé par catalogue.js et app.js
   (window.SeriesFonctionsNoyau) et par les tests (Node : require('./fonctions-core.js')).

     1. Analyse d'un terme général f_n(x) : x^n/n!, cos(nx)/n^2, sin(x/n^2)…
        (même grammaire que les applications « Réarranger une série » et
        « Tests de convergence », avec la variable x en plus).
     2. Le terme général en LaTeX.
     3. Compilation en fonction JavaScript (x, n) ↦ f_n(x).
     4. Fonctions spéciales pour les sommes et les restes : queues de p-séries
        (Euler–Maclaurin), zêta, dilogarithme, fonction de Clausen, digamma…
     5. Outils numériques : sommes partielles sur une grille, borne supérieure
        sur une réunion d'intervalles, estimation d'une somme, premier indice.
   ============================================================================= */
'use strict';

(function (racine) {

  // ===========================================================================
  //  Erreurs : un code (traduit par app.js) et une position dans l'expression
  // ===========================================================================
  class ErreurTerme extends Error {
    constructor(code, details) {
      super(code);
      this.code = code;
      this.details = details || {};
    }
  }
  const erreur = (code, details) => new ErreurTerme(code, details);

  // ===========================================================================
  //  1. Analyse syntaxique
  //  Grammaire : somme := produit (('+'|'-') produit)*
  //              produit := ('-'|'+') produit | puissance (('*'|'/') unaire | juxtaposition)*
  //              unaire := ('-'|'+') unaire | puissance
  //              puissance := postfixe ('^' exposant)?   (à droite)
  //              exposant := ('-'|'+') exposant | puissance
  //              postfixe := primaire '!'*
  //              primaire := nombre | n | x | pi | e | fonction '(' somme ')'
  //                        | fonction argument | '(' somme ')' | '|' somme '|'
  // ===========================================================================
  const FONCTIONS = {
    sqrt: 'sqrt', racine: 'sqrt', rac: 'sqrt',
    ln: 'ln', log: 'log', exp: 'exp',
    sin: 'sin', cos: 'cos', tan: 'tan',
    arctan: 'arctan', atan: 'arctan', arcsin: 'arcsin', asin: 'arcsin', arccos: 'arccos', acos: 'arccos',
    sinh: 'sinh', cosh: 'cosh', tanh: 'tanh', sh: 'sinh', ch: 'cosh', th: 'tanh',
    abs: 'abs', dist: 'dist',
  };
  const CONSTANTES = { pi: 'pi', e: 'e' };
  const VARIABLES = { x: 'x', n: 'n' };
  // les noms connus, du plus long au plus court : « sinhx » se lit sinh · x, « exp » n'est pas e · x · p
  const NOMS = Object.keys(FONCTIONS).map((v) => ({ v, genre: 'fn' }))
    .concat(Object.keys(CONSTANTES).map((v) => ({ v, genre: 'const' })))
    .concat(Object.keys(VARIABLES).map((v) => ({ v, genre: 'var' })))
    .sort((p, q) => q.v.length - p.v.length);

  function normaliser(src) {
    return String(src)
      .replace(/\*\*/g, '^')
      .replace(/[−–—]/g, '-')
      .replace(/[×·∙⋅]/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'pi')
      .replace(/√/g, 'sqrt')
      .replace(/[²]/g, '^2').replace(/[³]/g, '^3');
  }

  // « nx » → n, x ; « cosnx » → cos, n, x ; « sinh » → sinh
  function decouperMot(mot, pos) {
    const res = [];
    let i = 0, inconnu = '', posInconnu = -1;
    while (i < mot.length) {
      let trouve = null;
      for (const nom of NOMS) {
        const bout = mot.substr(i, nom.v.length);
        if (bout.length < nom.v.length) continue;
        if (nom.genre === 'var' ? bout === nom.v : bout.toLowerCase() === nom.v) { trouve = nom; break; }
      }
      if (!trouve) {
        if (posInconnu < 0) posInconnu = i;
        inconnu += mot[i];
        i++;
        continue;
      }
      res.push({ t: 'id', v: trouve.v, genre: trouve.genre, pos: pos + i });
      i += trouve.v.length;
    }
    // une lettre seule qui n'est ni n ni x (k, t, X…) : sans doute une autre variable
    if (inconnu.length === 1) throw erreur('variable', { pos: pos + posInconnu, texte: inconnu });
    if (inconnu) throw erreur('inconnu', { pos, texte: mot });
    return res;
  }

  function decouper(src) {
    const s = normaliser(src);
    const jetons = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      let m;
      if ((m = /^(\d+(?:[.,]\d+)?|[.,]\d+)/.exec(s.slice(i)))) {
        jetons.push({ t: 'nb', v: m[1], pos: i });
        i += m[1].length;
        continue;
      }
      if ((m = /^[A-Za-z_À-ſ]+/.exec(s.slice(i)))) {
        for (const j of decouperMot(m[0], i)) jetons.push(j);
        i += m[0].length;
        continue;
      }
      if ('+-*/^()!|[]{}'.includes(c)) {
        const v = c === '[' || c === '{' ? '(' : c === ']' || c === '}' ? ')' : c;
        jetons.push({ t: 'op', v, pos: i });
        i++;
        continue;
      }
      throw erreur('caractere', { pos: i, texte: c });
    }
    return jetons;
  }

  function analyser(src) {
    if (!String(src).trim()) throw erreur('vide');
    const J = decouper(src);
    let k = 0;
    const voir = () => J[k];
    const estOp = (v) => J[k] && J[k].t === 'op' && J[k].v === v;
    const finTexte = String(src).length;

    function somme() {
      let a = produit();
      while (estOp('+') || estOp('-')) {
        const op = J[k++].v;
        const b = produit();
        a = { t: op === '+' ? 'add' : 'sub', a, b };
      }
      return a;
    }
    function commencePrimaire(j) {
      if (!j) return false;
      if (j.t === 'nb' || j.t === 'id') return true;
      return j.t === 'op' && j.v === '(';
    }
    function produit() {
      // le signe moins porte sur tout le produit : −n x² = −(n x²)
      if (estOp('-')) { k++; return { t: 'neg', a: produit() }; }
      if (estOp('+')) { k++; return produit(); }
      let a = puissance();
      for (;;) {
        if (estOp('*') || estOp('/')) {
          const op = J[k++].v;
          const b = unaire();
          a = { t: op === '*' ? 'mul' : 'div', a, b };
        } else if (commencePrimaire(voir())) {
          const b = puissance();          // juxtaposition : 2n, nx, x^n(1-x), 3sin(nx)
          a = { t: 'mul', a, b, juxt: true };
        } else break;
      }
      return a;
    }
    function unaire() {
      if (estOp('-')) { k++; return { t: 'neg', a: unaire() }; }
      if (estOp('+')) { k++; return unaire(); }
      return puissance();
    }
    function exposant() {
      if (estOp('-')) { k++; return { t: 'neg', a: exposant() }; }
      if (estOp('+')) { k++; return exposant(); }
      return puissance();
    }
    function puissance() {
      const base = postfixe();
      if (estOp('^')) { k++; return { t: 'pow', a: base, b: exposant() }; }
      return base;
    }
    function postfixe() {
      let a = primaire();
      while (estOp('!')) { k++; a = { t: 'fact', a }; }
      return a;
    }
    const estSimple = (j) => !!j && (j.t === 'nb' || (j.t === 'id' && j.genre !== 'fn'));
    function primaire() {
      const j = voir();
      if (!j) throw erreur('fin', { pos: finTexte });
      if (j.t === 'nb') { k++; return { t: 'num', v: Number(j.v.replace(',', '.')), src: j.v.replace(',', '.') }; }
      if (j.t === 'id') {
        k++;
        if (j.genre === 'var') return { t: j.v };
        if (j.genre === 'const') return { t: 'const', nom: CONSTANTES[j.v] };
        const f = FONCTIONS[j.v];
        if (estOp('(')) {
          k++;
          const a = somme();
          if (!estOp(')')) throw erreur('parenthese', { pos: J[k] ? J[k].pos : finTexte });
          k++;
          return { t: 'fn', nom: f, a };
        }
        // Sans parenthèses, comme dans les notes : cos nx, sin 2x, log n ;
        // « sin nx/n^2 » se lit (sin nx)/n^2.
        const s = voir();
        if (estSimple(s) || (s && s.t === 'op' && s.v === '|')) {
          let a = puissance();
          while (estSimple(voir())) a = { t: 'mul', a, b: puissance(), juxt: true };
          return { t: 'fn', nom: f, a };
        }
        throw erreur('fonctionParenthese', { pos: j.pos, texte: j.v });
      }
      if (j.t === 'op' && j.v === '(') {
        k++;
        const a = somme();
        if (!estOp(')')) throw erreur('parenthese', { pos: J[k] ? J[k].pos : finTexte });
        k++;
        return { t: 'par', a };
      }
      if (j.t === 'op' && j.v === '|') {
        k++;
        const a = somme();
        if (!estOp('|')) throw erreur('barre', { pos: J[k] ? J[k].pos : finTexte });
        k++;
        return { t: 'fn', nom: 'abs', a };
      }
      throw erreur('inattendu', { pos: j.pos, texte: j.v });
    }

    const arbre = somme();
    if (k < J.length) throw erreur('inattendu', { pos: J[k].pos, texte: J[k].v });
    return arbre;
  }

  // Parenthèses de l'utilisateur : utiles à l'affichage seulement.
  const sansPar = (a) => (a.t === 'par' ? sansPar(a.a) : a);

  // Le terme dépend-il de x ? (sinon, les f_n sont des fonctions constantes)
  function dependDeX(a) {
    if (a.t === 'x') return true;
    return (a.a ? dependDeX(a.a) : false) || (a.b ? dependDeX(a.b) : false);
  }

  // ===========================================================================
  //  2. Le terme général en LaTeX (tel que tapé, avec les parenthèses utiles)
  //     opts : { virgule: virgule décimale, indice: lettre qui remplace n }
  // ===========================================================================
  const NOMS_TEX = {
    ln: '\\ln', log: '\\log', sin: '\\sin', cos: '\\cos', tan: '\\tan', arctan: '\\arctan',
    arcsin: '\\arcsin', arccos: '\\arccos', sinh: '\\sinh', cosh: '\\cosh', tanh: '\\tanh',
    dist: '\\operatorname{dist}',
  };

  function texTerme(arbre, opts) {
    const virgule = !!(opts && opts.virgule);
    const indice = (opts && opts.indice) || 'n';
    // niveau : 1 somme, 2 opposé, 3 produit, 4 puissance, 5 atome
    function niveau(a) {
      a = sansPar(a);
      switch (a.t) {
        case 'add': case 'sub': return 1;
        case 'neg': return 2;
        case 'mul': return 3;
        case 'pow': return 4;
        default: return 5;
      }
    }
    const par = (s) => '\\left(' + s + '\\right)';
    const lettre = (a) => a.t === 'n' || a.t === 'x' || a.t === 'const';
    function tex(a) {
      if (a.t === 'par') return tex(a.a);
      switch (a.t) {
        case 'num': return virgule ? a.src.replace('.', '{,}') : a.src;
        case 'n': return indice;
        case 'x': return 'x';
        case 'const': return a.nom === 'pi' ? '\\pi' : 'e';
        case 'add': return tex(a.a) + ' + ' + (niveau(a.b) <= 2 ? par(tex(a.b)) : tex(a.b));
        case 'sub': return tex(a.a) + ' - ' + (niveau(a.b) <= 2 ? par(tex(a.b)) : tex(a.b));
        case 'neg': return '-' + (niveau(a.a) <= 2 ? par(tex(a.a)) : tex(a.a));
        case 'mul': {
          const A = sansPar(a.a), B = sansPar(a.b);
          const ga = niveau(a.a) <= 2 ? par(tex(a.a)) : tex(a.a);
          const gb = niveau(a.b) <= 2 || (niveau(a.b) === 3 && a.b.t === 'par') ? par(tex(a.b)) : tex(a.b);
          let lien = ' \\, ';
          if (/^[\d]/.test(gb)) lien = ' \\cdot ';                       // 2 · 3, x · 2^n
          else if ((A.t === 'num' || lettre(A)) && lettre(B)) lien = ' '; // 2x, nx, n pi
          else if (A.t === 'num' && /^(\\left\(|\\sqrt)/.test(gb)) lien = ' ';
          return ga + lien + gb;
        }
        case 'div': return '\\frac{' + tex(sansPar(a.a)) + '}{' + tex(sansPar(a.b)) + '}';
        case 'pow': {
          const A = sansPar(a.a);
          const atome = lettre(A) || (A.t === 'num' && !A.src.includes('.'));
          const base = atome ? tex(A) : (A.t === 'fn' && A.nom === 'abs' ? tex(A) : par(tex(A)));
          return base + '^{' + tex(sansPar(a.b)) + '}';
        }
        case 'fact': {
          const A = sansPar(a.a);
          return (lettre(A) || A.t === 'num' ? tex(A) : par(tex(A))) + '!';
        }
        case 'fn': {
          const A = sansPar(a.a);
          if (a.nom === 'sqrt') return '\\sqrt{' + tex(A) + '}';
          if (a.nom === 'abs') return '\\left\\lvert ' + tex(A) + ' \\right\\rvert';
          if (a.nom === 'exp') return 'e^{' + tex(A) + '}';
          const atome = lettre(A) || A.t === 'num';
          return NOMS_TEX[a.nom] + (atome && a.nom !== 'dist' ? ' ' + tex(A) : par(tex(A)));
        }
        default: return '?';
      }
    }
    return tex(arbre);
  }

  // ===========================================================================
  //  3. Compilation : une fonction (x, n) ↦ f_n(x) en virgule flottante
  // ===========================================================================
  const FACT = [1];
  for (let i = 1; i <= 170; i++) FACT[i] = FACT[i - 1] * i;
  const AIDES = {
    pow(a, b) {
      if (a < 0 && !Number.isInteger(b)) {
        const r = 1 / b, rr = Math.round(r);
        if (Math.abs(r - rr) < 1e-9 && Math.abs(rr) % 2 === 1) return -Math.pow(-a, b);
        return NaN;
      }
      return Math.pow(a, b);
    },
    fact(v) {
      if (!Number.isInteger(v) || v < 0) return NaN;
      return v <= 170 ? FACT[v] : Infinity;
    },
    dist(v) { return Math.abs(v - Math.round(v)); },    // distance à l'entier le plus proche
  };
  const FN_JS = {
    sqrt: 'Math.sqrt', ln: 'Math.log', log: 'Math.log', exp: 'Math.exp',
    sin: 'Math.sin', cos: 'Math.cos', tan: 'Math.tan', arctan: 'Math.atan', arcsin: 'Math.asin',
    arccos: 'Math.acos', sinh: 'Math.sinh', cosh: 'Math.cosh', tanh: 'Math.tanh', abs: 'Math.abs',
    dist: 'F.dist',
  };
  function versJS(a) {
    switch (a.t) {
      case 'par': return versJS(a.a);
      case 'num': return '(' + String(a.v) + ')';
      case 'n': return 'n';
      case 'x': return 'x';
      case 'const': return a.nom === 'pi' ? 'Math.PI' : 'Math.E';
      case 'neg': return '(-' + versJS(a.a) + ')';
      case 'add': return '(' + versJS(a.a) + '+' + versJS(a.b) + ')';
      case 'sub': return '(' + versJS(a.a) + '-' + versJS(a.b) + ')';
      case 'mul': return '(' + versJS(a.a) + '*' + versJS(a.b) + ')';
      case 'div': return '(' + versJS(a.a) + '/' + versJS(a.b) + ')';
      case 'pow': return 'F.pow(' + versJS(a.a) + ',' + versJS(a.b) + ')';
      case 'fact': return 'F.fact(' + versJS(a.a) + ')';
      case 'fn': return FN_JS[a.nom] + '(' + versJS(a.a) + ')';
      default: throw erreur('interne');
    }
  }
  // Le code est produit à partir de l'arbre seulement (nombres, n, x et fonctions
  // de Math) : aucune chaîne tapée par l'utilisateur n'y passe telle quelle.
  function compiler(arbre) {
    const code = versJS(arbre);
    // eslint-disable-next-line no-new-func
    return new Function('F', '"use strict"; return function (x, n) { return ' + code + '; };')(AIDES);
  }

  // Un terme général tapé : arbre, fonction (x, n) et LaTeX
  function creerTerme(src) {
    const arbre = analyser(src);
    return {
      src: String(src).trim(),
      arbre,
      f: compiler(arbre),
      constant: !dependDeX(arbre),
      tex: (opts) => texTerme(arbre, opts),
    };
  }

  // ===========================================================================
  //  4. Fonctions spéciales
  // ===========================================================================
  const DEUX_PI = 2 * Math.PI;
  const mod2pi = (x) => { const r = x - DEUX_PI * Math.floor(x / DEUX_PI); return r >= DEUX_PI ? 0 : r; };

  // Σ_{k>n} k^(−s), s > 1 : somme directe jusqu'à N = max(n + 1, 16), puis formule
  // d'Euler–Maclaurin (erreur relative de l'ordre de 10^−14).
  function queueZeta(s, n) {
    if (!(s > 1)) return Infinity;
    const N = Math.max(n + 1, 16);
    let somme = 0;
    for (let k = n + 1; k < N; k++) somme += Math.pow(k, -s);
    const Ns = Math.pow(N, -s), N2 = N * N;
    let t = N * Ns / (s - 1) + Ns / 2;
    let p = s * Ns / N;                                   // s N^(−s−1)
    t += p / 12;
    p *= (s + 1) * (s + 2) / N2; t -= p / 720;
    p *= (s + 3) * (s + 4) / N2; t += p / 30240;
    p *= (s + 5) * (s + 6) / N2; t -= p / 1209600;
    return somme + t;
  }
  const zeta = (s) => queueZeta(s, 0);

  // Nombre harmonique H_n et ln(n!)
  function harmonique(n) {
    if (n < 64) { let h = 0; for (let k = 1; k <= n; k++) h += 1 / k; return h; }
    const f = 1 / (n * n);
    return Math.log(n) + 0.5772156649015329 + 0.5 / n - f * (1 / 12 - f * (1 / 120 - f / 252));
  }
  const LNFACT = [0];
  function lnFact(n) {
    for (let k = LNFACT.length; k <= n; k++) LNFACT[k] = LNFACT[k - 1] + Math.log(k);
    return LNFACT[n];
  }

  // Dilogarithme Li2(x) = Σ x^k/k², −1 ≤ x ≤ 1
  function dilogSerie(x) {
    let s = 0, p = x;
    for (let k = 1; k <= 400; k++) {
      s += p / (k * k);
      p *= x;
      if (Math.abs(p) < 1e-18) break;
    }
    return s;
  }
  function dilog(x) {
    if (!(x >= -1 && x <= 1)) return NaN;
    if (x === 1) return Math.PI * Math.PI / 6;
    if (x > 0.5) return Math.PI * Math.PI / 6 - Math.log(x) * Math.log(1 - x) - dilogSerie(1 - x);
    if (x < -0.5) return 0.5 * dilog(x * x) - dilog(-x);       // Li2(x) + Li2(−x) = Li2(x²)/2
    return dilogSerie(x);
  }

  // Fonction de Clausen Cl2(x) = Σ sin(kx)/k² :
  //   Cl2(x) = x − x ln x + Σ_{j≥1} ζ(2j)/(j(2j+1)) · x (x/2π)^(2j)   pour 0 < x ≤ π,
  //   Cl2(2π − x) = −Cl2(x), période 2π.
  const COEF_CL2 = [];
  for (let j = 1; j <= 40; j++) COEF_CL2.push(zeta(2 * j) / (j * (2 * j + 1)));
  function clausen2(x) {
    let t = mod2pi(x), signe = 1;
    if (t > Math.PI) { t = DEUX_PI - t; signe = -1; }
    if (t === 0) return 0;
    const q = (t / DEUX_PI) * (t / DEUX_PI);
    let s = 0, p = 1;
    for (let j = 0; j < COEF_CL2.length; j++) { p *= q; s += COEF_CL2[j] * p; }
    return signe * (t - t * Math.log(t) + t * s);
  }

  // Fonction digamma ψ(x), x > 0
  function digamma(x) {
    if (!(x > 0)) return NaN;
    let r = 0;
    while (x < 12) { r -= 1 / x; x += 1; }
    const f = 1 / (x * x);
    return r + Math.log(x) - 0.5 / x - f * (1 / 12 - f * (1 / 120 - f * (1 / 252 - f * (1 / 240 - f / 132))));
  }

  // Σ_{k>n} 1/(x^k + 1), x > 1 : somme directe, ou Euler–Maclaurin quand x est proche de 1
  function queueLambert(x, n) {
    if (!(x > 1)) return Infinity;
    const L = Math.log(x);
    const g = (t) => 1 / (Math.exp(L * t) + 1);
    let s = 0, k = n + 1;
    if (L >= 0.1) {
      for (; k < n + 6000; k++) { const v = g(k); s += v; if (v < 1e-18) break; }
      return s;
    }
    const N = n + 64;
    for (; k <= N; k++) s += g(k);
    // Σ_{k>N} g(k) = ∫_N^∞ g − g(N)/2 − g′(N)/12 + g‴(N)/720 − …
    const u = Math.exp(L * N), d = 1 + u;
    const I = Math.log1p(1 / u) / L;
    const g0 = 1 / d;
    const g1 = -L * u / (d * d);
    const g3 = -L * L * L * u * (1 - 4 * u + u * u) / (d * d * d * d);
    return s + I - g0 / 2 - g1 / 12 + g3 / 720;
  }

  // Σ_{k>n} sin(x/k²) : somme directe jusqu'à K, puis développement de la queue
  //   Σ_{k>K} sin(x/k²) = x ζ_K(2) − x³/3! ζ_K(6) + x⁵/5! ζ_K(10) − …,  ζ_K(s) := Σ_{k>K} k^(−s)
  function queueSinCarre(x, n) {
    const K = Math.max(n, 12, Math.ceil(Math.sqrt(2 * Math.abs(x))));
    let s = 0;
    for (let k = n + 1; k <= K; k++) s += Math.sin(x / (k * k));
    const x2 = x * x;
    return s + x * (queueZeta(2, K) - x2 / 6 * (queueZeta(6, K) - x2 / 20 * (queueZeta(10, K)
      - x2 / 42 * (queueZeta(14, K) - x2 / 72 * queueZeta(18, K)))));
  }

  // Fonction de van der Waerden g(x) = Σ_{m≥0} 4^(−m) dist(4^m x) (période 1)
  const fracPart = (x) => x - Math.floor(x);
  function termeVdW(x, m) {
    const p = Math.pow(4, m), y = p * fracPart(x);
    return Math.abs(y - Math.round(y)) / p;
  }
  function vanDerWaerden(x, depuis) {
    const t = fracPart(x);
    let s = 0;
    for (let m = depuis || 0; m <= 26; m++) {
      const p = Math.pow(4, m), y = p * t;
      s += Math.abs(y - Math.round(y)) / p;
    }
    return s;
  }

  // ===========================================================================
  //  5. Outils numériques
  // ===========================================================================

  // Sommes partielles sur une grille : pour chaque indice demandé (croissants),
  // le tableau des s_indice(x_i). Les termes sont ajoutés de n0 au plus grand indice.
  //   depuis : indice de départ de la somme (n0, ou n + 1 pour s_m − s_n)
  function sommesSurGrille(terme, depuis, xs, indices) {
    const N = xs.length, S = new Float64Array(N);
    const res = new Map();
    if (!indices.length) return res;
    const tri = Array.from(new Set(indices)).sort((p, q) => p - q);
    const dernier = tri[tri.length - 1];
    let j = 0;
    while (j < tri.length && tri[j] < depuis) { res.set(tri[j], new Float64Array(N)); j++; }
    for (let k = depuis; k <= dernier; k++) {
      for (let i = 0; i < N; i++) S[i] += terme(xs[i], k);
      while (j < tri.length && tri[j] === k) { res.set(k, Float64Array.from(S)); j++; }
    }
    return res;
  }

  // Une somme partielle en un point
  function sommePartielle(terme, n0, n, x) {
    let s = 0;
    for (let k = n0; k <= n; k++) s += terme(x, k);
    return s;
  }

  // Borne supérieure de |g| sur une réunion d'intervalles bornés (échantillonnage,
  // puis recherche par section dorée autour du meilleur point). Extrémité ouverte :
  // on s'en approche à 10^−9 près (relativement à la longueur).
  //   morceaux : [{ a, b, ao, bo }] ; renvoie { v, x }
  const PHI = (Math.sqrt(5) - 1) / 2;
  function supAbs(g, morceaux, N) {
    let meilleur = -Infinity, xm = NaN;
    const n = N || 600;
    for (const I of morceaux) {
      if (!(I.b >= I.a)) continue;
      const marge = 1e-9 * Math.max(I.b - I.a, 1e-9);
      const a = I.ao ? I.a + marge : I.a, b = I.bo ? I.b - marge : I.b;
      if (b <= a) { const v = Math.abs(g(a)); if (v > meilleur) { meilleur = v; xm = a; } continue; }
      const h = (b - a) / n;
      let vi = -Infinity, ii = 0;
      for (let i = 0; i <= n; i++) {
        const x = i === n ? b : a + i * h;
        const v = Math.abs(g(x));
        if (v > vi) { vi = v; ii = i; }                     // les NaN sont ignorés
      }
      if (vi === Infinity) return { v: Infinity, x: ii === n ? b : a + ii * h };
      if (vi === -Infinity) continue;
      // raffinement sur [x_{i−1}, x_{i+1}]
      let lo = Math.max(a, a + (ii - 1) * h), hi = Math.min(b, a + (ii + 1) * h);
      let x1 = hi - PHI * (hi - lo), x2 = lo + PHI * (hi - lo);
      let f1 = Math.abs(g(x1)), f2 = Math.abs(g(x2));
      for (let it = 0; it < 40; it++) {
        if (!(f1 < f2)) { hi = x2; x2 = x1; f2 = f1; x1 = hi - PHI * (hi - lo); f1 = Math.abs(g(x1)); }
        else { lo = x1; x1 = x2; f1 = f2; x2 = lo + PHI * (hi - lo); f2 = Math.abs(g(x2)); }
      }
      let xr = (lo + hi) / 2, vr = Math.abs(g(xr));
      const xi = ii === n ? b : a + ii * h;
      if (!(vr >= vi)) { vr = vi; xr = xi; }
      if (vr > meilleur) { meilleur = vr; xm = xr; }
    }
    return { v: meilleur === -Infinity ? NaN : meilleur, x: xm };
  }

  // Estimation de la somme Σ_{k≥n0} terme(x, k) en un point, pour une série tapée :
  // somme directe (arrêt quand les termes sont négligeables), puis extrapolation
  // d'Aitken sur les sommes s_{K/4}, s_{K/2}, s_K quand les écarts décroissent
  // géométriquement (queues en k^(−p)). Renvoie { v, fiable } ; v = NaN si la série
  // ne semble pas converger en x.
  function estimerSomme(terme, n0, x, K) {
    const Kmax = K || 4096;
    const e = Kmax >> 3, q = Kmax >> 2, h = Kmax >> 1;
    let s = 0, se = 0, sq = 0, sh = 0, petits = 0, dernier = 0;
    for (let i = 1; i <= Kmax; i++) {
      const t = terme(x, n0 + i - 1);
      if (!Number.isFinite(t)) return { v: NaN, fiable: false };
      s += t;
      dernier = t;
      if (i === e) se = s; else if (i === q) sq = s; else if (i === h) sh = s;
      if (Math.abs(t) <= 1e-15 * (1 + Math.abs(s))) {
        if (++petits >= 24 && i >= 48) return { v: s, fiable: true };
      } else petits = 0;
    }
    if (!Number.isFinite(s)) return { v: NaN, fiable: false };
    const d0 = sq - se, d1 = sh - sq, d2 = s - sh;
    const ech = 1 + Math.abs(s);
    if (Math.abs(d2) <= 1e-12 * ech) return { v: s, fiable: true };
    const r = d1 !== 0 ? d2 / d1 : NaN, r0 = d0 !== 0 ? d1 / d0 : NaN;
    if (r > 0 && r < 0.93 && r0 > 0 && r0 < 0.96 && Math.abs(r - r0) < 0.12) {
      const c = d2 * r / (1 - r);                       // Aitken : s + d2 r/(1 − r)
      return { v: s + c, fiable: Math.abs(c) <= 0.5 * ech };
    }
    if (Math.abs(d2) <= 2e-3 * ech && Math.abs(d1) <= 1e-2 * ech) return { v: s, fiable: true };
    if (Math.abs(dernier) <= 1e-2 && Math.abs(d2) <= 0.05 * ech && Math.abs(d1) <= 0.12 * ech) return { v: s, fiable: false };
    return { v: NaN, fiable: false };
  }

  // Premier indice d'une série tapée : le plus petit n ∈ {0, 1, 2, 3} où le terme
  // est défini (fini) en tous les points d'essai.
  function premierIndice(terme, points) {
    for (let n = 0; n <= 3; n++) {
      let ok = true;
      for (const x of points) { if (!Number.isFinite(terme(x, n))) { ok = false; break; } }
      if (ok) return n;
    }
    return null;
  }

  // Pas « joli » (1, 2 ou 5 × 10^k) pour une graduation
  function pasJoli(etendue, cible) {
    const brut = etendue / Math.max(1, cible);
    const p = Math.pow(10, Math.floor(Math.log10(brut)));
    const m = brut / p;
    return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  }

  const SeriesFonctionsNoyau = {
    ErreurTerme, analyser, texTerme, compiler, creerTerme, dependDeX,
    mod2pi, queueZeta, zeta, harmonique, lnFact, dilog, clausen2, digamma, queueLambert, queueSinCarre,
    termeVdW, vanDerWaerden, fracPart,
    sommesSurGrille, sommePartielle, supAbs, estimerSomme, premierIndice, pasJoli,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = SeriesFonctionsNoyau;
  else racine.SeriesFonctionsNoyau = SeriesFonctionsNoyau;
})(typeof window !== 'undefined' ? window : globalThis);
