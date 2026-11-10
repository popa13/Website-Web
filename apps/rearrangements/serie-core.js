/* =============================================================================
   Réarranger une série — noyau de calcul (UQTR)
   Aucune interface ni dépendance : utilisé par app.js (window.SerieNoyau) et
   par les tests (Node : require('./serie-core.js')).

     1. Fractions exactes (BigInt).
     2. Analyse d'un terme général en n : (-1)^(n+1)/n, sin(n)/n, 1/sqrt(n), n!…
     3. Le terme général en LaTeX, et chaque terme x_n en LaTeX, simplifié et
        exact quand c'est possible (1/3, √2/2, sin 2/2…).
     4. Compilation en fonction JavaScript (valeurs décimales rapides).
     5. Diagnostic numérique de convergence (2^18 termes).
     6. La banque des termes : termes positifs et négatifs, dans l'ordre, et
        le prochain terme inutilisé de chaque signe (procédé de Riemann).
   ============================================================================= */
'use strict';

(function (racine) {

  // ===========================================================================
  //  Erreurs : un code (traduit par app.js) et une position dans l'expression
  // ===========================================================================
  class ErreurSerie extends Error {
    constructor(code, details) {
      super(code);
      this.code = code;
      this.details = details || {};
    }
  }
  const erreur = (code, details) => new ErreurSerie(code, details);

  // ===========================================================================
  //  1. Fractions exactes : { n, d } avec d > 0 et pgcd(n, d) = 1
  // ===========================================================================
  const LIMITE_BITS = 4096;   // au-delà, on renonce à la valeur exacte
  const absB = (a) => (a < 0n ? -a : a);
  function pgcd(a, b) {
    a = absB(a); b = absB(b);
    while (b) { const r = a % b; a = b; b = r; }
    return a;
  }
  function nbBits(b) { b = absB(b); return b === 0n ? 0 : b.toString(16).length * 4; }
  function Q(n, d) {
    if (d === undefined) d = 1n;
    if (d === 0n) throw erreur('division');
    if (d < 0n) { n = -n; d = -d; }
    const g = pgcd(n, d);
    if (g > 1n) { n /= g; d /= g; }
    if (nbBits(n) > LIMITE_BITS || nbBits(d) > LIMITE_BITS) throw erreur('taille');
    return { n, d };
  }
  const ZERO = { n: 0n, d: 1n };
  const UN = { n: 1n, d: 1n };
  const qAdd = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
  const qSub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
  const qMul = (a, b) => Q(a.n * b.n, a.d * b.d);
  const qDiv = (a, b) => { if (b.n === 0n) throw erreur('division'); return Q(a.n * b.d, a.d * b.n); };
  const qNeg = (a) => ({ n: -a.n, d: a.d });
  const qAbs = (a) => ({ n: absB(a.n), d: a.d });
  const qSigne = (a) => (a.n > 0n ? 1 : a.n < 0n ? -1 : 0);
  const qEstEntier = (a) => a.d === 1n;
  const qEgal = (a, b) => a.n === b.n && a.d === b.d;
  const qEntier = (k) => ({ n: BigInt(k), d: 1n });

  function qVersNombre(a) {
    const bn = nbBits(a.n), bd = nbBits(a.d);
    if (bn < 1000 && bd < 1000) return Number(a.n) / Number(a.d);
    const s = BigInt(Math.max(bn, bd) - 900);
    return Number(a.n / (1n << s)) / Number(a.d / (1n << s));
  }

  // Fraction exacte d'un littéral décimal : "0.25" ou "0,25" → 1/4
  function qDepuisTexte(txt) {
    const [ent, frac] = txt.replace(',', '.').split('.');
    const chiffres = (ent || '0') + (frac || '');
    return Q(BigInt(chiffres), 10n ** BigInt((frac || '').length));
  }

  // a^k pour un entier k (|k| ≤ 100 000, avec garde sur la taille)
  function qPuissance(a, k) {
    if (!Number.isSafeInteger(k) || Math.abs(k) > 100000) throw erreur('taille');
    if (k === 0) return UN;
    if (a.n === 0n) { if (k < 0) throw erreur('division'); return ZERO; }
    const m = Math.abs(k);
    if ((nbBits(a.n) + nbBits(a.d)) * m > 2 * LIMITE_BITS && absB(a.n) !== 1n) throw erreur('taille');
    if (absB(a.n) === 1n && a.d === 1n) {           // (±1)^k : pas de calcul
      const s = (a.n < 0n && m % 2 === 1) ? -1n : 1n;
      return { n: s, d: 1n };
    }
    const bm = BigInt(m);
    const p = Q(a.n ** bm, a.d ** bm);
    return k > 0 ? p : qDiv(UN, p);
  }

  // Racine m-ième entière exacte d'un BigInt b ≥ 0 (ou null)
  function racineEntiere(b, m) {
    if (b < 0n) return null;
    if (b < 2n) return b;
    const x0 = Math.round(Math.pow(Number(b), 1 / m));
    for (const x of [x0 - 1, x0, x0 + 1]) {
      if (x < 0 || !Number.isFinite(x)) continue;
      const bx = BigInt(x);
      if (bx ** BigInt(m) === b) return bx;
    }
    if (nbBits(b) < 50) return null;
    // grands nombres : méthode de Newton entière
    let x = 1n << BigInt(Math.ceil(nbBits(b) / m) + 1);
    const M = BigInt(m);
    for (let i = 0; i < 400; i++) {
      const y = ((M - 1n) * x + b / (x ** (M - 1n))) / M;
      if (y >= x) break;
      x = y;
    }
    return x ** M === b ? x : null;
  }

  // b = c^m · r avec r sans facteur puissance m-ième (petits facteurs seulement)
  function extrairePuissances(b, m) {
    let c = 1n, r = b;
    if (nbBits(b) > 64) return { c, r };
    for (let p = 2n; p * p <= r && p < 20000n; p += (p === 2n ? 1n : 2n)) {
      const pm = p ** BigInt(m);
      while (r % pm === 0n) { r /= pm; c *= p; }
    }
    return { c, r };
  }

  // ===========================================================================
  //  2. Analyse syntaxique
  //  Grammaire : somme := produit (('+'|'-') produit)*
  //              produit := unaire (('*'|'/'|juxtaposition) unaire)*
  //              unaire := ('-'|'+') unaire | puissance
  //              puissance := postfixe ('^' exposant)?   (à droite)
  //              exposant := ('-'|'+') exposant | puissance
  //              postfixe := primaire '!'*
  //              primaire := nombre | n | pi | e | fonction '(' somme ')'
  //                        | '(' somme ')' | '|' somme '|'
  // ===========================================================================
  const FONCTIONS = {
    sqrt: 'sqrt', racine: 'sqrt', rac: 'sqrt',
    ln: 'ln', log: 'log', exp: 'exp',
    sin: 'sin', cos: 'cos', tan: 'tan',
    arctan: 'arctan', atan: 'arctan', arcsin: 'arcsin', asin: 'arcsin', arccos: 'arccos', acos: 'arccos',
    sinh: 'sinh', cosh: 'cosh', tanh: 'tanh', sh: 'sinh', ch: 'cosh', th: 'tanh',
    abs: 'abs',
  };
  const CONSTANTES = { pi: 'pi', e: 'e' };

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
        jetons.push({ t: 'id', v: m[0], pos: i });
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
      let a = unaire();
      for (;;) {
        if (estOp('*') || estOp('/')) {
          const op = J[k++].v;
          const b = unaire();
          a = { t: op === '*' ? 'mul' : 'div', a, b };
        } else if (commencePrimaire(voir())) {
          const b = puissance();          // juxtaposition : 2n, n(n+1), 3sin(n)
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
    function primaire() {
      const j = voir();
      if (!j) throw erreur('fin', { pos: finTexte });
      if (j.t === 'nb') { k++; return { t: 'num', q: qDepuisTexte(j.v), src: j.v.replace(',', '.') }; }
      if (j.t === 'id') {
        k++;
        const nom = j.v;
        const bas = nom.toLowerCase();
        if (nom === 'n') return { t: 'n' };
        if (CONSTANTES[bas] && nom === bas) return { t: 'const', nom: CONSTANTES[bas] };
        if (FONCTIONS[bas]) {
          const f = FONCTIONS[bas];
          if (estOp('(')) {
            k++;
            const a = somme();
            if (!estOp(')')) throw erreur('parenthese', { pos: J[k] ? J[k].pos : finTexte });
            k++;
            return { t: 'fn', nom: f, a };
          }
          throw erreur('fonctionParenthese', { pos: j.pos, texte: nom });
        }
        // « nn », « n2 »… : une suite de lettres collées commençant par n
        if (/^n+$/.test(nom)) {
          let a = { t: 'n' };
          for (let i = 1; i < nom.length; i++) a = { t: 'mul', a, b: { t: 'n' }, juxt: true };
          return a;
        }
        if (/^[a-zA-Z]$/.test(nom)) throw erreur('variable', { pos: j.pos, texte: nom });
        throw erreur('inconnu', { pos: j.pos, texte: nom });
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

  // Parenthèses de l'utilisateur : utiles à l'affichage du terme général
  // seulement ; les calculs les ignorent.
  const sansPar = (a) => (a.t === 'par' ? sansPar(a.a) : a);

  // ===========================================================================
  //  3a. Le terme général en LaTeX (tel que tapé, avec les parenthèses utiles)
  // ===========================================================================
  const NOMS_TEX = {
    ln: '\\ln', log: '\\log', sin: '\\sin', cos: '\\cos', tan: '\\tan', arctan: '\\arctan',
    arcsin: '\\arcsin', arccos: '\\arccos', sinh: '\\sinh', cosh: '\\cosh', tanh: '\\tanh',
  };

  function texNombre(src, virgule) {
    return virgule ? src.replace('.', '{,}') : src;
  }

  function texGeneral(arbre, opts) {
    const virgule = !!(opts && opts.virgule);
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
    function tex(a) {
      if (a.t === 'par') {
        // on garde les parenthèses tapées autour d'un opposé ou d'une somme
        // (« (-1)^n », « (n+1)(n+2) ») ; ailleurs, \frac les rend inutiles
        return tex(a.a);
      }
      switch (a.t) {
        case 'num': return texNombre(a.src, virgule);
        case 'n': return 'n';
        case 'const': return a.nom === 'pi' ? '\\pi' : 'e';
        case 'add': return tex(a.a) + ' + ' + (niveau(a.b) <= 2 ? par(tex(a.b)) : tex(a.b));
        case 'sub': return tex(a.a) + ' - ' + (niveau(a.b) <= 2 ? par(tex(a.b)) : tex(a.b));
        case 'neg': return '-' + (niveau(a.a) <= 2 ? par(tex(a.a)) : tex(a.a));
        case 'mul': {
          const ga = niveau(a.a) <= 2 ? par(tex(a.a)) : tex(a.a);
          const gb = niveau(a.b) <= 3 && !(sansPar(a.b).t === 'mul') ? par(tex(a.b)) : tex(a.b);
          const A = sansPar(a.a), B = sansPar(a.b);
          const droiteChiffre = /^[\d]/.test(gb);
          let lien = ' \\cdot ';
          if (!droiteChiffre && (A.t === 'num' || /^\\left\(|^\\sqrt|^\\ln|^\\log|^\\sin|^\\cos|^\\tan|^\\arc|^\\pi|^\(/.test(gb))) lien = ' ';
          if (A.t === 'num' && (B.t === 'n' || B.t === 'const')) lien = '';
          return ga + lien + gb;
        }
        case 'div': return '\\frac{' + tex(sansPar(a.a)) + '}{' + tex(sansPar(a.b)) + '}';
        case 'pow': {
          const A = sansPar(a.a);
          const atome = A.t === 'n' || A.t === 'const' || (A.t === 'num' && !A.src.includes('.'));
          const base = atome ? tex(A) : par(tex(A));
          return base + '^{' + tex(sansPar(a.b)) + '}';
        }
        case 'fact': {
          const A = sansPar(a.a);
          const atome = A.t === 'n' || A.t === 'num';
          return (atome ? tex(A) : par(tex(A))) + '!';
        }
        case 'fn': {
          const A = sansPar(a.a);
          if (a.nom === 'sqrt') return '\\sqrt{' + tex(A) + '}';
          if (a.nom === 'abs') return '\\left\\lvert ' + tex(A) + ' \\right\\rvert';
          if (a.nom === 'exp') return 'e^{' + tex(A) + '}';
          const atome = A.t === 'n' || A.t === 'num' || A.t === 'const';
          return NOMS_TEX[a.nom] + (atome ? ' ' + tex(A) : par(tex(A)));
        }
        default: return '?';
      }
    }
    return tex(arbre);
  }

  // ===========================================================================
  //  4. Compilation : une fonction n ↦ x_n en virgule flottante
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
    fact(x) {
      if (!Number.isInteger(x) || x < 0) return NaN;
      return x <= 170 ? FACT[x] : Infinity;
    },
  };
  const FN_JS = {
    sqrt: 'Math.sqrt', ln: 'Math.log', log: 'Math.log', exp: 'Math.exp',
    sin: 'Math.sin', cos: 'Math.cos', tan: 'Math.tan', arctan: 'Math.atan', arcsin: 'Math.asin',
    arccos: 'Math.acos', sinh: 'Math.sinh', cosh: 'Math.cosh', tanh: 'Math.tanh', abs: 'Math.abs',
  };
  function versJS(a) {
    switch (a.t) {
      case 'par': return versJS(a.a);
      case 'num': return '(' + String(qVersNombre(a.q)) + ')';
      case 'n': return 'n';
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
  // Le code est produit à partir de l'arbre seulement (nombres, n et fonctions
  // de Math) : aucune chaîne tapée par l'utilisateur n'y passe telle quelle.
  function compiler(arbre) {
    const code = versJS(arbre);
    // eslint-disable-next-line no-new-func
    return new Function('F', '"use strict"; return function (n) { return ' + code + '; };')(AIDES);
  }

  // Évaluation décimale d'un sous-arbre (pour le signe d'une valeur absolue)
  function evalDecimal(a, n) {
    switch (a.t) {
      case 'par': return evalDecimal(a.a, n);
      case 'num': return qVersNombre(a.q);
      case 'n': return n;
      case 'const': return a.nom === 'pi' ? Math.PI : Math.E;
      case 'neg': return -evalDecimal(a.a, n);
      case 'add': return evalDecimal(a.a, n) + evalDecimal(a.b, n);
      case 'sub': return evalDecimal(a.a, n) - evalDecimal(a.b, n);
      case 'mul': return evalDecimal(a.a, n) * evalDecimal(a.b, n);
      case 'div': return evalDecimal(a.a, n) / evalDecimal(a.b, n);
      case 'pow': return AIDES.pow(evalDecimal(a.a, n), evalDecimal(a.b, n));
      case 'fact': return AIDES.fact(evalDecimal(a.a, n));
      case 'fn': {
        const v = evalDecimal(a.a, n);
        switch (a.nom) {
          case 'sqrt': return Math.sqrt(v); case 'ln': case 'log': return Math.log(v);
          case 'exp': return Math.exp(v); case 'sin': return Math.sin(v); case 'cos': return Math.cos(v);
          case 'tan': return Math.tan(v); case 'arctan': return Math.atan(v); case 'arcsin': return Math.asin(v);
          case 'arccos': return Math.acos(v); case 'sinh': return Math.sinh(v); case 'cosh': return Math.cosh(v);
          case 'tanh': return Math.tanh(v); case 'abs': return Math.abs(v);
          default: return NaN;
        }
      }
      default: return NaN;
    }
  }

  // ===========================================================================
  //  3b. La valeur exacte simplifiée de x_n, en LaTeX
  //  Une valeur est { q } (fraction exacte) ou { s } (expression symbolique dont
  //  les feuilles sont des fractions, π, e, des racines et des fonctions).
  // ===========================================================================
  const feuille = (q) => ({ t: 'q', q });
  const versS = (V) => (V.q ? feuille(V.q) : V.s);
  const estQ = (V, q) => !!V.q && qEgal(V.q, q);
  const MOINS_UN = { n: -1n, d: 1n };

  function opposeS(s) {
    if (s.t === 'neg') return s.a;
    if (s.t === 'q') return feuille(qNeg(s.q));
    return { t: 'neg', a: s };
  }
  function produitS(A, B) {
    if (A.q && B.q) return { q: qMul(A.q, B.q) };
    if (A.q || B.q) {
      const q = A.q || B.q, S = A.q ? B : A;
      if (q.n === 0n) return { q: ZERO };
      if (qEgal(q, UN)) return S;
      if (qEgal(q, MOINS_UN)) return { s: opposeS(S.s) };
      // coefficient fractionnaire × (coefficient × facteur) : on regroupe
      if (S.s.t === 'mul' && S.s.a.t === 'q') return produitS({ q: qMul(q, S.s.a.q) }, { s: S.s.b });
      return { s: { t: 'mul', a: feuille(q), b: S.s } };
    }
    return { s: { t: 'mul', a: A.s, b: B.s } };
  }
  function quotientS(A, B) {
    if (B.q) {
      if (B.q.n === 0n) throw erreur('division');
      if (A.q) return { q: qDiv(A.q, B.q) };
      return produitS({ q: qDiv(UN, B.q) }, A);
    }
    if (A.q && A.q.n === 0n) return { q: ZERO };
    return { s: { t: 'div', a: versS(A), b: B.s } };
  }
  function sommeS(A, B, signe) {
    if (A.q && B.q) return { q: signe > 0 ? qAdd(A.q, B.q) : qSub(A.q, B.q) };
    if (B.q && B.q.n === 0n) return A;
    if (A.q && A.q.n === 0n) return signe > 0 ? B : { s: opposeS(B.s) };
    const b = signe > 0 ? versS(B) : opposeS(versS(B));
    return { s: { t: 'add', a: versS(A), b } };
  }
  // q^(p/m) avec m > 1 : racine exacte, ou c·ⁿ√r
  function racineQ(q, p, m) {
    if (q.n < 0n) {
      if (m % 2 === 0) throw erreur('domaine');
      const r = racineQ(qNeg(q), p, m);
      return (p % 2 === 0) ? r : (r.q ? { q: qNeg(r.q) } : { s: opposeS(r.s) });
    }
    const rn = racineEntiere(q.n, m), rd = racineEntiere(q.d, m);
    if (rn !== null && rd !== null) return { q: qPuissance(Q(rn, rd), p) };
    // ᵐ√(a/b) = ᵐ√(a·b^(m-1)) / b, puis extraction des puissances m-ièmes
    const rad = q.n * q.d ** BigInt(m - 1);
    const { c, r } = extrairePuissances(rad, m);
    const coef = Q(c, q.d);
    let base;
    if (r === 1n) base = { q: coef };
    else base = produitS({ q: coef }, { s: { t: 'rac', r, m } });
    if (p === 1) return base;
    if (base.q) return { q: qPuissance(base.q, p) };
    return { s: { t: 'pow', a: base.s, b: feuille(qEntier(p)) } };
  }

  // A = k·π avec k rationnel ? (π, ou le produit d'une fraction et de π)
  function multipleDePi(A) {
    if (A.q) return A.q.n === 0n ? ZERO : null;
    const s = A.s;
    if (s.t === 'c' && s.nom === 'pi') return UN;
    if (s.t === 'mul' && s.a.t === 'q' && s.b.t === 'c' && s.b.nom === 'pi') return s.a.q;
    if (s.t === 'neg') { const k = multipleDePi({ s: s.a }); return k ? qNeg(k) : null; }
    return null;
  }
  // cos(kπ) exact quand 12k est entier et multiple de 2 ou de 3 (angles de 30° et 45°)
  const COS12 = {                         // 12k mod 24 → [coefficient, radicande]
    0: [1, 1], 2: [1 / 2, 3], 3: [1 / 2, 2], 4: [1 / 2, 1], 6: [0, 1], 8: [-1 / 2, 1], 9: [-1 / 2, 2], 10: [-1 / 2, 3],
    12: [-1, 1], 14: [-1 / 2, 3], 15: [-1 / 2, 2], 16: [-1 / 2, 1], 18: [0, 1], 20: [1 / 2, 1], 21: [1 / 2, 2], 22: [1 / 2, 3],
  };
  function cosExact(k) {
    const t = qMul(k, qEntier(12));
    if (!qEstEntier(t)) return null;
    const i = Number(((t.n % 24n) + 24n) % 24n);
    const e = COS12[i];
    if (!e) return null;
    const coef = e[0] === 0 ? ZERO : Q(BigInt(Math.sign(e[0])), BigInt(Math.round(1 / Math.abs(e[0]))));
    if (e[1] === 1 || coef.n === 0n) return { q: coef };
    return produitS({ q: coef }, { s: { t: 'rac', r: BigInt(e[1]), m: 2 } });
  }
  // tan(kπ) : 12k mod 12 → [coefficient, radicande] (6 : tangente non définie)
  const TAN12 = { 0: [0, 1], 2: [1 / 3, 3], 3: [1, 1], 4: [1, 3], 8: [-1, 3], 9: [-1, 1], 10: [-1 / 3, 3] };
  function trigExacte(nom, k) {
    if (nom === 'cos') return cosExact(k);
    if (nom === 'sin') return cosExact(qSub(k, Q(1n, 2n)));      // sin(kπ) = cos((k − 1/2)π)
    const t = qMul(k, qEntier(12));
    if (!qEstEntier(t)) return null;
    const i = Number(((t.n % 12n) + 12n) % 12n);
    if (i === 6) throw erreur('domaine');
    const e = TAN12[i];
    if (!e) return null;
    const coef = e[0] === 0 ? ZERO : Q(BigInt(Math.sign(e[0])), BigInt(Math.round(1 / Math.abs(e[0]))));
    if (e[1] === 1 || coef.n === 0n) return { q: coef };
    return produitS({ q: coef }, { s: { t: 'rac', r: BigInt(e[1]), m: 2 } });
  }

  function simplifier(a, n) {
    switch (a.t) {
      case 'par': return simplifier(a.a, n);
      case 'num': return { q: a.q };
      case 'n': return { q: qEntier(n) };
      case 'const': return { s: { t: 'c', nom: a.nom } };
      case 'neg': { const A = simplifier(a.a, n); return A.q ? { q: qNeg(A.q) } : { s: opposeS(A.s) }; }
      case 'add': return sommeS(simplifier(a.a, n), simplifier(a.b, n), 1);
      case 'sub': return sommeS(simplifier(a.a, n), simplifier(a.b, n), -1);
      case 'mul': return produitS(simplifier(a.a, n), simplifier(a.b, n));
      case 'div': return quotientS(simplifier(a.a, n), simplifier(a.b, n));
      case 'pow': {
        const A = simplifier(a.a, n), B = simplifier(a.b, n);
        if (A.q && B.q) {
          if (qEstEntier(B.q)) {
            const k = Number(B.q.n);
            return { q: qPuissance(A.q, k) };
          }
          const m = Number(B.q.d), p = Number(B.q.n);
          if (m > 12 || Math.abs(p) > 1000) throw erreur('taille');
          if (p < 0) {
            const r = racineQ(A.q, -p, m);
            return quotientS({ q: UN }, r);
          }
          return racineQ(A.q, p, m);
        }
        if (B.q && qEgal(B.q, UN)) return A;
        if (B.q && B.q.n === 0n) return { q: UN };
        return { s: { t: 'pow', a: versS(A), b: versS(B) } };
      }
      case 'fact': {
        const A = simplifier(a.a, n);
        if (!A.q || !qEstEntier(A.q) || A.q.n < 0n) throw erreur('domaine');
        const m = Number(A.q.n);
        if (m > 3000) throw erreur('taille');
        let p = 1n;
        for (let i = 2n; i <= BigInt(m); i++) p *= i;
        return { q: Q(p) };
      }
      case 'fn': {
        if (a.nom === 'sqrt') {
          const A = simplifier(a.a, n);
          if (A.q) return racineQ(A.q, 1, 2);
          if (evalDecimal(a.a, n) < 0) throw erreur('domaine');
          return { s: { t: 'fn', nom: 'sqrt', a: A.s } };
        }
        if (a.nom === 'abs') {
          const A = simplifier(a.a, n);
          if (A.q) return { q: qAbs(A.q) };
          return { s: { t: 'fn', nom: 'abs', a: A.s } };
        }
        const A = simplifier(a.a, n);
        if (a.nom === 'sin' || a.nom === 'cos' || a.nom === 'tan') {
          const k = multipleDePi(A);
          if (k) {
            const v = trigExacte(a.nom, k);
            if (v) return v;
          }
        }
        if (A.q) {
          const z = A.q.n === 0n, un = estQ(A, UN);
          switch (a.nom) {
            case 'exp': case 'cosh': case 'cos': if (z) return { q: UN }; break;
            case 'sin': case 'tan': case 'arctan': case 'arcsin': case 'sinh': case 'tanh': if (z) return { q: ZERO }; break;
            case 'arccos': if (un) return { q: ZERO }; break;
            case 'ln': case 'log':
              if (A.q.n <= 0n) throw erreur('domaine');
              if (un) return { q: ZERO };
              break;
            default: break;
          }
        }
        return { s: { t: 'fn', nom: a.nom, a: versS(A) } };
      }
      default: throw erreur('interne');
    }
  }

  // Impression : { sg, tex, somme } avec valeur = sg · tex
  function texFraction(q) {
    const n = absB(q.n);
    return q.d === 1n ? n.toString() : '\\frac{' + n.toString() + '}{' + q.d.toString() + '}';
  }
  function texS(s) {
    switch (s.t) {
      case 'q': return { sg: qSigne(s.q) < 0 ? -1 : 1, tex: texFraction(s.q), somme: false, atome: s.q.d === 1n, entier: s.q.d === 1n };
      case 'c': return { sg: 1, tex: s.nom === 'pi' ? '\\pi' : 'e', somme: false, atome: true };
      case 'rac': return { sg: 1, tex: (s.m === 2 ? '\\sqrt{' : '\\sqrt[' + s.m + ']{') + s.r.toString() + '}', somme: false, atome: true };
      case 'neg': { const r = texS(s.a); return Object.assign({}, r, { sg: -r.sg }); }
      case 'add': {
        const ra = texS(s.a), rb = texS(s.b);
        const tb = rb.somme ? '\\left(' + rb.tex + '\\right)' : rb.tex;
        return { sg: 1, tex: (ra.sg < 0 ? '-' : '') + ra.tex + (rb.sg < 0 ? ' - ' : ' + ') + tb, somme: true, atome: false };
      }
      case 'mul': {
        const ra = texS(s.a), rb = texS(s.b);
        const sg = ra.sg * rb.sg;
        const tb = rb.somme ? '\\left(' + rb.tex + '\\right)' : rb.tex;
        if (s.a.t === 'q') {
          const q = qAbs(s.a.q);
          if (qEgal(q, UN)) return { sg, tex: tb, somme: false, atome: rb.atome };
          if (q.d === 1n) return { sg, tex: q.n.toString() + (/^\d/.test(tb) ? ' \\cdot ' : '') + tb, somme: false, atome: false };
          const num = q.n === 1n ? tb : q.n.toString() + (/^\d/.test(tb) ? ' \\cdot ' : '') + tb;
          return { sg, tex: '\\frac{' + num + '}{' + q.d.toString() + '}', somme: false, atome: true };
        }
        const ta = ra.somme ? '\\left(' + ra.tex + '\\right)' : ra.tex;
        const lien = /^\d/.test(tb) ? ' \\cdot ' : ' ';
        return { sg, tex: ta + lien + tb, somme: false, atome: false };
      }
      case 'div': {
        const ra = texS(s.a), rb = texS(s.b);
        return { sg: ra.sg * rb.sg, tex: '\\frac{' + ra.tex + '}{' + rb.tex + '}', somme: false, atome: true };
      }
      case 'pow': {
        const ra = texS(s.a), rb = texS(s.b);
        const base = (ra.sg < 0 || !ra.atome || ra.somme || /\\frac/.test(ra.tex)) && s.a.t !== 'c'
          ? '\\left(' + (ra.sg < 0 ? '-' : '') + ra.tex + '\\right)' : ra.tex;
        return { sg: 1, tex: base + '^{' + (rb.sg < 0 ? '-' : '') + rb.tex + '}', somme: false, atome: false };
      }
      case 'fn': {
        const ra = texS(s.a);
        const arg = (ra.sg < 0 ? '-' : '') + ra.tex;
        if (s.nom === 'sqrt') return { sg: 1, tex: '\\sqrt{' + arg + '}', somme: false, atome: true };
        if (s.nom === 'exp') return { sg: 1, tex: 'e^{' + arg + '}', somme: false, atome: false };
        if (s.nom === 'abs') return { sg: 1, tex: '\\left\\lvert ' + arg + ' \\right\\rvert', somme: false, atome: true };
        const simple = ra.sg > 0 && (ra.entier || s.a.t === 'c');
        return { sg: 1, tex: NOMS_TEX[s.nom] + (simple ? ' ' + arg : '\\left(' + arg + '\\right)'), somme: false, atome: false };
      }
      default: return { sg: 1, tex: '?', somme: false, atome: true };
    }
  }

  // Terme x_n : valeur décimale, fraction exacte éventuelle et LaTeX signé
  // (null si l'écriture exacte est trop longue ; app.js affiche alors un décimal).
  function termeExact(arbre, n) {
    try {
      const V = simplifier(arbre, n);
      if (V.q) {
        const q = V.q;
        if (nbBits(q.n) > 160 || nbBits(q.d) > 160) return { q, tex: null };
        return { q, tex: (qSigne(q) < 0 ? '-' : '') + texFraction(q), somme: false };
      }
      const r = texS(V.s);
      if (r.tex.length > 90) return { q: null, tex: null };
      return { q: null, tex: (r.sg < 0 ? '-' : '') + r.tex, somme: r.somme, sg: r.sg };
    } catch (e) {
      if (e instanceof ErreurSerie && (e.code === 'division' || e.code === 'domaine')) return { indefini: true };
      return { q: null, tex: null };
    }
  }

  // ===========================================================================
  //  5. Diagnostic numérique (2^18 termes, blocs dyadiques ]2^j, 2^(j+1)])
  //   - le terme général tend-il vers 0 ? (maximum de |x_n| sur les derniers blocs)
  //   - la série converge-t-elle ? (moyenne de deux sommes partielles consécutives,
  //     qui neutralise les oscillations d'une série alternée)
  //   - absolument ? (les sommes de |x_n| par bloc décroissent géométriquement,
  //     comme dans le critère de condensation de Cauchy)
  // ===========================================================================
  function diagnostiquer(f, exposant) {
    const J = exposant || 18;
    const N = 2 ** J;
    let S = 0, P = 0, M = 0, blocAbs = 0, blocMax = 0, Sborne = 0;
    let borne = 2, k = 1, attente = false;
    const moy = [], bloc = [], maxi = [];
    for (let n = 1; n <= N + 1; n++) {
      const x = f(n);
      if (!Number.isFinite(x)) return { classe: 'indefinie', n };
      S += x;
      if (x > 0) P += x; else M += x;
      if (n <= N) { const ax = Math.abs(x); blocAbs += ax; if (ax > blocMax) blocMax = ax; }
      if (n === borne) {               // fin du bloc ]borne/2, borne]
        bloc[k] = blocAbs; maxi[k] = blocMax; blocAbs = 0; blocMax = 0;
        Sborne = S; attente = true;
      } else if (attente) {            // n = borne + 1
        moy[k] = (Sborne + S) / 2;
        attente = false; k++; borne *= 2;
      }
    }
    const d = J;                       // dernier bloc : ]2^(J-1), 2^J]
    const versZero = maxi[d] < 1e-4 || maxi[d] < 0.95 * maxi[d - 3];
    const ecart = Math.abs(moy[d] - moy[d - 1]);
    const converge = versZero && ecart <= 1e-3 * Math.max(1, Math.abs(moy[d]));
    const r1 = bloc[d] / bloc[d - 1], r2 = bloc[d - 1] / bloc[d - 2];
    const absolue = bloc[d] < 1e-10 || (r1 < 0.97 && r2 < 0.97);
    let classe;
    if (!versZero) classe = 'grossiere';
    else if (!converge) classe = 'divergente';
    else classe = absolue ? 'absolue' : 'conditionnelle';
    return { classe, s: converge ? moy[d] : null, sommePos: P, sommeNeg: M, N };
  }

  // ===========================================================================
  //  6. La série et sa banque de termes
  // ===========================================================================
  const NMAX_BANQUE = 2000000;

  function creerSerie(src) {
    const arbre = analyser(src);
    const f = compiler(arbre);
    const valeurs = [NaN];              // valeurs[n], n ≥ 1
    const exacts = new Map();           // n → termeExact (calculé à la demande)
    const pos = [], neg = [], nul = []; // indices, dans l'ordre croissant
    let nCalcule = 0;

    function etendre(nMax) {
      nMax = Math.min(nMax, NMAX_BANQUE);
      for (let n = nCalcule + 1; n <= nMax; n++) {
        let v = f(n);
        if (!Number.isFinite(v)) throw erreur('indefini', { n });
        if (v !== 0 && Math.abs(v) < 1e-12) {          // cos(nπ/2) vaut 0, pas 6e-17
          const e = termeExact(arbre, n);
          if (e.q && e.q.n === 0n) v = 0;
        } else if (Math.abs(v) > 1e12) {               // tan(π/2) n'est pas défini
          const e = termeExact(arbre, n);
          if (e.indefini) throw erreur('indefini', { n });
        }
        valeurs[n] = v;
        (v > 0 ? pos : v < 0 ? neg : nul).push(n);
      }
      if (nMax > nCalcule) nCalcule = nMax;
    }
    function valeur(n) { if (n > nCalcule) etendre(Math.max(n, 2 * nCalcule, 64)); return valeurs[n]; }
    function exact(n) {
      if (!exacts.has(n)) {
        const e = termeExact(arbre, n);
        if (e.indefini) throw erreur('indefini', { n });
        exacts.set(n, e);
      }
      return exacts.get(n);
    }
    function liste(signe) { return signe > 0 ? pos : signe < 0 ? neg : nul; }

    // Curseurs : le plus petit indice inutilisé de chaque signe
    const curseur = { 1: 0, '-1': 0, 0: 0 };
    // On cherche au plus jusqu'à l'indice « limite » (2 000 000 au plus).
    function prochain(signe, estUtilise, limite) {
      const L = liste(signe);
      const lim = Math.min(limite || 200000, NMAX_BANQUE);
      let i = curseur[signe];
      for (;;) {
        while (i >= L.length) {
          if (nCalcule >= lim) { curseur[signe] = i; return null; }
          etendre(Math.min(lim, Math.max(64, nCalcule * 2)));
        }
        if (!estUtilise(L[i])) { curseur[signe] = i; return L[i]; }
        i++;
      }
    }
    function reculerCurseurs() { curseur[1] = 0; curseur[-1] = 0; curseur[0] = 0; }

    etendre(64);
    return {
      arbre, f, valeur, exact, liste, etendre, prochain, reculerCurseurs,
      texGeneral: (opts) => texGeneral(arbre, opts),
      get nCalcule() { return nCalcule; },
    };
  }

  // Une étape du procédé de Riemann : un terme positif si t ≤ c, sinon un négatif.
  function etapeRiemann(serie, t, c, estUtilise, limite) {
    const voulu = t <= c ? 1 : -1;
    const n = serie.prochain(voulu, estUtilise, limite);
    if (n !== null) return { n, signe: voulu, force: false };
    const autre = serie.prochain(-voulu, estUtilise, limite);
    return autre === null ? null : { n: autre, signe: -voulu, force: true };
  }

  // Sommes partielles exactes (fractions) tant que les termes sont rationnels
  function sommesExactes(serie, indices, limiteBits) {
    const L = limiteBits || 512;
    const res = [ZERO];
    let s = ZERO;
    for (const n of indices) {
      const e = serie.exact(n);
      if (!e.q) break;
      s = qAdd(s, e.q);
      if (nbBits(s.d) > L) break;
      res.push(s);
    }
    return res;
  }

  const SerieNoyau = {
    ErreurSerie, analyser, texGeneral, compiler, termeExact, diagnostiquer, creerSerie,
    etapeRiemann, sommesExactes,
    Q, qAdd, qSub, qMul, qDiv, qNeg, qVersNombre, qSigne, qEgal, qDepuisTexte, texFraction, nbBits,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = SerieNoyau;
  else racine.SerieNoyau = SerieNoyau;
})(typeof window !== 'undefined' ? window : globalThis);
