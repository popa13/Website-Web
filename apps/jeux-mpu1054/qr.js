/* =============================================================================
   Jeux d'étude MPU1054 — encodeur de codes QR (autonome, sans dépendance)

   Mode octet (UTF-8), niveau de correction M, versions 1 à 10 choisies selon la
   longueur du texte (jusqu'à 213 octets), masque choisi par la règle de pénalité
   de la norme ISO/IEC 18004. Sert à ouvrir la « clé des chefs » d'Agents ε sur un
   téléphone sans retaper le code de la partie.

   QR.svg(texte, { taille, marge }) -> chaîne SVG ; QR.matrice(texte) -> tableau de booléens.
   ============================================================================= */
(function () {
  'use strict';

  // Niveau M : [codes de correction par bloc, [[nombre de blocs, octets de données par bloc], ...]]
  const BLOCS_M = [null,
    [10, [[1, 16]]], [16, [[1, 28]]], [26, [[1, 44]]], [18, [[2, 32]]], [24, [[2, 43]]],
    [16, [[4, 27]]], [18, [[4, 31]]], [22, [[2, 38], [2, 39]]], [22, [[3, 36], [2, 37]]],
    [26, [[4, 43], [1, 44]]]];
  const ALIGNEMENT = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
    [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  const RESTE = [0, 0, 7, 7, 7, 7, 7, 0, 0, 0, 0];

  // ---------------------------------------------------------------- GF(256)
  const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x; LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  const mul = (a, b) => (a && b) ? EXP[LOG[a] + LOG[b]] : 0;

  function generateur(n) {
    let g = [1];
    for (let i = 0; i < n; i++) {
      const h = new Array(g.length + 1).fill(0);
      for (let j = 0; j < g.length; j++) {
        h[j] ^= g[j];
        h[j + 1] ^= mul(g[j], EXP[i]);
      }
      g = h;
    }
    return g;
  }

  function correction(donnees, n) {
    const g = generateur(n);
    const r = donnees.concat(new Array(n).fill(0));
    for (let i = 0; i < donnees.length; i++) {
      const c = r[i];
      if (!c) continue;
      for (let j = 0; j < g.length; j++) r[i + j] ^= mul(g[j], c);
    }
    return r.slice(donnees.length);
  }

  // ---------------------------------------------------------------- codage des données
  function capacite(v) {
    const [, groupes] = BLOCS_M[v];
    return groupes.reduce((s, [nb, k]) => s + nb * k, 0);
  }

  function codesDonnees(octets, v) {
    const bits = [];
    const pousser = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    pousser(0b0100, 4);
    pousser(octets.length, v < 10 ? 8 : 16);
    octets.forEach(o => pousser(o, 8));
    const total = capacite(v) * 8;
    for (let i = 0; i < 4 && bits.length < total; i++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    const codes = [];
    for (let i = 0; i < bits.length; i += 8) {
      let o = 0;
      for (let j = 0; j < 8; j++) o = (o << 1) | bits[i + j];
      codes.push(o);
    }
    for (let p = 0; codes.length < capacite(v); p++) codes.push(p % 2 ? 0x11 : 0xec);
    return codes;
  }

  function entrelacer(codes, v) {
    const [nec, groupes] = BLOCS_M[v];
    const blocs = [], ecs = [];
    let k = 0;
    groupes.forEach(([nb, taille]) => {
      for (let b = 0; b < nb; b++) {
        const bloc = codes.slice(k, k + taille);
        k += taille;
        blocs.push(bloc);
        ecs.push(correction(bloc, nec));
      }
    });
    const sortie = [];
    const max = Math.max(...blocs.map(b => b.length));
    for (let i = 0; i < max; i++) blocs.forEach(b => { if (i < b.length) sortie.push(b[i]); });
    for (let i = 0; i < nec; i++) ecs.forEach(e => sortie.push(e[i]));
    return sortie;
  }

  // ---------------------------------------------------------------- matrice
  function bch(val, gen, degre) {
    let r = val << degre;
    const dg = Math.floor(Math.log2(gen));
    while (r && Math.floor(Math.log2(r)) >= dg) r ^= gen << (Math.floor(Math.log2(r)) - dg);
    return (val << degre) | r;
  }

  function construire(octets) {
    let v = 1;
    while (v <= 10 && capacite(v) < octets.length + (v < 10 ? 2 : 3)) v++;
    if (v > 10) throw new Error('Texte trop long pour le code QR');
    const n = 17 + 4 * v;
    const M = Array.from({ length: n }, () => new Array(n).fill(null));   // null = libre
    const fixe = Array.from({ length: n }, () => new Array(n).fill(false));
    const poser = (r, c, val) => { if (r >= 0 && c >= 0 && r < n && c < n) { M[r][c] = !!val; fixe[r][c] = true; } };

    // motifs de position et séparateurs
    [[0, 0], [0, n - 7], [n - 7, 0]].forEach(([r0, c0]) => {
      for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
        const dans = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const noir = dans && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        poser(r0 + r, c0 + c, noir);
      }
    });
    // motifs d'alignement
    const pos = ALIGNEMENT[v];
    pos.forEach(r => pos.forEach(c => {
      if (fixe[r][c]) return;
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++)
        poser(r + i, c + j, Math.max(Math.abs(i), Math.abs(j)) !== 1);
    }));
    // lignes de synchronisation
    for (let i = 8; i < n - 8; i++) { poser(6, i, i % 2 === 0); poser(i, 6, i % 2 === 0); }
    // module noir et zones réservées (format, version)
    poser(4 * v + 9, 8, true);
    for (let i = 0; i < 9; i++) { if (!fixe[8][i]) poser(8, i, false); if (!fixe[i][8]) poser(i, 8, false); }
    for (let i = 0; i < 8; i++) { poser(8, n - 1 - i, false); if (!fixe[n - 1 - i][8]) poser(n - 1 - i, 8, false); }
    if (v >= 7) {
      const vb = bch(v, 0x1f25, 12);
      for (let i = 0; i < 18; i++) {
        const b = (vb >> i) & 1, a = Math.floor(i / 3), c = n - 11 + (i % 3);
        poser(a, c, b); poser(c, a, b);
      }
    }

    // placement des données en zigzag
    const codes = entrelacer(codesDonnees(octets, v), v);
    const bits = [];
    codes.forEach(o => { for (let i = 7; i >= 0; i--) bits.push((o >> i) & 1); });
    for (let i = 0; i < RESTE[v]; i++) bits.push(0);
    let k = 0, haut = true;
    for (let col = n - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (let t = 0; t < n; t++) {
        const r = haut ? n - 1 - t : t;
        for (const c of [col, col - 1]) {
          if (fixe[r][c]) continue;
          M[r][c] = k < bits.length ? !!bits[k] : false;
          k++;
        }
      }
      haut = !haut;
    }

    // choix du masque
    const MASQUES = [
      (r, c) => (r + c) % 2 === 0, (r) => r % 2 === 0, (r, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0,
      (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, (r, c) => (r * c) % 2 + (r * c) % 3 === 0,
      (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0, (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0];
    let meilleure = null, meilleurScore = Infinity;
    for (let m = 0; m < 8; m++) {
      const A = M.map((ligne, r) => ligne.map((x, c) => fixe[r][c] ? x : (x !== MASQUES[m](r, c))));
      ecrireFormat(A, n, m);
      const s = penalite(A, n);
      if (s < meilleurScore) { meilleurScore = s; meilleure = A; }
    }
    return meilleure;
  }

  function ecrireFormat(A, n, masque) {
    const f = bch((0b00 << 3) | masque, 0x537, 10) ^ 0x5412;   // niveau M = 00
    for (let i = 0; i < 15; i++) {
      const b = !!((f >> i) & 1);
      // première copie, autour du motif en haut à gauche
      if (i < 6) A[i][8] = b;
      else if (i === 6) A[7][8] = b;
      else if (i === 7) A[8][8] = b;
      else if (i === 8) A[8][7] = b;
      else A[8][14 - i] = b;
      // seconde copie : ligne 8 à droite (bits 0 à 7), colonne 8 en bas (bits 8 à 14)
      if (i < 8) A[8][n - 1 - i] = b;
      else A[n - 15 + i][8] = b;
    }
    A[n - 8][8] = true;   // module toujours foncé
  }

  function penalite(A, n) {
    let s = 0;
    // règle 1 : suites de 5 modules ou plus de même couleur
    for (let r = 0; r < n; r++) {
      for (const lire of [(i) => A[r][i], (i) => A[i][r]]) {
        let long = 1;
        for (let i = 1; i < n; i++) {
          if (lire(i) === lire(i - 1)) long++;
          else { if (long >= 5) s += long - 2; long = 1; }
        }
        if (long >= 5) s += long - 2;
      }
    }
    // règle 2 : blocs 2 × 2
    for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) {
      const x = A[r][c];
      if (x === A[r][c + 1] && x === A[r + 1][c] && x === A[r + 1][c + 1]) s += 3;
    }
    // règle 3 : motif 1:1:3:1:1 précédé ou suivi de quatre modules clairs
    const P1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], P2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
    for (let r = 0; r < n; r++) for (let c = 0; c + 11 <= n; c++) {
      for (const lire of [(i) => A[r][c + i], (i) => A[c + i][r]]) {
        let ok1 = true, ok2 = true;
        for (let i = 0; i < 11; i++) {
          const x = lire(i) ? 1 : 0;
          if (x !== P1[i]) ok1 = false;
          if (x !== P2[i]) ok2 = false;
        }
        if (ok1) s += 40;
        if (ok2) s += 40;
      }
    }
    // règle 4 : proportion de modules foncés
    let noirs = 0;
    A.forEach(l => l.forEach(x => { if (x) noirs++; }));
    s += Math.floor(Math.abs(noirs * 100 / (n * n) - 50) / 5) * 10;
    return s;
  }

  function matrice(texte) {
    return construire(Array.from(new TextEncoder().encode(String(texte))));
  }

  function svg(texte, opts) {
    opts = opts || {};
    const A = matrice(texte), n = A.length, marge = opts.marge == null ? 4 : opts.marge;
    const t = n + 2 * marge;
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++)
      if (A[r][c]) d += 'M' + (c + marge) + ' ' + (r + marge) + 'h1v1h-1z';
    const taille = opts.taille ? ` width="${opts.taille}" height="${opts.taille}"` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}"${taille} shape-rendering="crispEdges" role="img" aria-label="Code QR">` +
      `<rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="${opts.couleur || '#1d2b3a'}"/></svg>`;
  }

  window.QR = { svg, matrice };
})();
