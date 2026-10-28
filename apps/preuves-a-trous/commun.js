/* =============================================================================
   Preuves à trous — MPU1054 (UQTR) : utilitaires communs aux deux moteurs
   (app.js : démonstrations à trous ; ordre.js : démonstrations à remettre en ordre).

   - registre des activités (PreuvesATrous.enregistrer) et chargement d'un fichier
     preuves/<id>.js ;
   - rendu des formules par KaTeX avec les macros du cours ;
   - mode professeur protégé par mot de passe (empreinte SHA-256 dans prof.js) ;
   - boîte d'aide et icône ☰ de la barre du site (petits écrans).

   Chargé avant app.js ou ordre.js ; expose window.PreuvesCommun.
   ============================================================================= */
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  /* ------------------------------------------------------------ Registre */
  const REGISTRE = {};
  window.PreuvesATrous = window.PreuvesATrous || {
    enregistrer(preuve) { REGISTRE[preuve.id] = preuve; },
    registre: REGISTRE,
  };

  function chargerActivite(entree) {
    return new Promise((resoudre, rejeter) => {
      if (REGISTRE[entree.id]) { resoudre(REGISTRE[entree.id]); return; }
      const s = document.createElement('script');
      s.src = entree.fichier;
      s.onload = () => REGISTRE[entree.id] ? resoudre(REGISTRE[entree.id]) : rejeter(new Error('Le fichier ' + entree.fichier + ' n\'enregistre pas l\'activité « ' + entree.id + ' ».'));
      s.onerror = () => rejeter(new Error('Impossible de charger ' + entree.fichier + '.'));
      document.head.appendChild(s);
    });
  }

  /* ------------------------------------------------------------ KaTeX */
  // Macros du cours (integrale-commands.tex, math-commands.tex, suites-commands.tex)
  // pour pouvoir coller le LaTeX des diapositives tel quel.
  const MACROS = {
    '\\Rab': '\\mathcal{R}[a, b]',
    '\\eps': '\\varepsilon',
    '\\bR': '\\mathbb{R}',
    '\\bN': '\\mathbb{N}',
    '\\bZ': '\\mathbb{Z}',
    '\\bQ': '\\mathbb{Q}',
    '\\cP': '\\mathcal{P}',
    '\\cQ': '\\mathcal{Q}',
    '\\cR': '\\mathcal{R}',
    '\\ra': '\\to',
    '\\rra': '\\to',
    '\\nra': '\\nrightarrow',
    '\\cvu': '\\rightrightarrows',
    '\\normu': '\\lVert #1 \\rVert_{A}',
    '\\oc': '\\left[',
    '\\fc': '\\right]',
    '\\op': '\\left(',
    '\\fp': '\\right)',
    '\\oa': '\\left\\{',
    '\\fa': '\\right\\}',
    '\\pas': '\\lVert #1 \\rVert',
    '\\SDi': 'L(#1; #2)',
    '\\SDs': 'U(#1; #2)',
    '\\SR': 'S(#1; #2)',
    '\\Dx': '(x_{#1} - x_{#1 - 1})',
  };

  function echapper(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function rendreMath(tex, affichage) {
    try {
      return katex.renderToString(tex, {
        displayMode: !!affichage,
        throwOnError: false,
        strict: 'ignore',
        macros: Object.assign({}, MACROS),
        output: 'html',
      });
    } catch (e) {
      return '<code>' + echapper(tex) + '</code>';
    }
  }

  // Typographie française hors des formules : espace insécable avant « : ; ? ! » »
  // et après « « ».
  function typo(t) {
    return t.replace(/ ([:;?!»])/g, ' $1').replace(/« /g, '« ');
  }

  // Texte HTML contenant des formules $...$ (en ligne) ou $$...$$ (centrées).
  function rendreTexte(str) {
    if (str == null) return '';
    const s = String(str);
    const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
    let sortie = '', dernier = 0, m;
    while ((m = re.exec(s))) {
      sortie += typo(s.slice(dernier, m.index));
      sortie += m[1] !== undefined ? rendreMath(m[1], true) : rendreMath(m[2], false);
      dernier = re.lastIndex;
    }
    return sortie + typo(s.slice(dernier));
  }

  // Texte sans balises ni formules (pour les messages et les titres d'onglet).
  function texteBrut(str) {
    return String(str == null ? '' : str).replace(/\$\$?([^$]+)\$\$?/g, '$1').replace(/<[^>]+>/g, '');
  }

  /* ------------------------------------------------------------ SHA-256 */
  // SHA-256 (FIPS 180-4) sur l'UTF-8 de la chaîne, en hexadécimal. Implémentation
  // synchrone et autonome : crypto.subtle n'est disponible que dans un contexte
  // sécurisé (https, localhost), pas sur une page servie en http sur un réseau local.
  function sha256Hex(texte) {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    const octets = new TextEncoder().encode(texte);
    const nBits = octets.length * 8;
    const nBlocs = Math.ceil((octets.length + 9) / 64);
    const tampon = new Uint8Array(nBlocs * 64);
    tampon.set(octets);
    tampon[octets.length] = 0x80;
    const vue = new DataView(tampon.buffer);
    vue.setUint32(tampon.length - 8, Math.floor(nBits / 0x100000000));
    vue.setUint32(tampon.length - 4, nBits >>> 0);
    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
        h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    const w = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let b = 0; b < tampon.length; b += 64) {
      for (let i = 0; i < 16; i++) w[i] = vue.getUint32(b + 4 * i);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let a = h0, bb = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & bb) ^ (a & c) ^ (bb & c);
        const t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = bb; bb = a; a = (t1 + t2) >>> 0;
      }
      h0 = (h0 + a) >>> 0; h1 = (h1 + bb) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
    }
    return [h0, h1, h2, h3, h4, h5, h6, h7].map(x => x.toString(16).padStart(8, '0')).join('');
  }

  /* ------------------------------------------------------------ Mode professeur */
  // Protégé par mot de passe (empreinte dans prof.js) ; actif douze heures dans le
  // navigateur (localStorage) ; le bouton « Mode prof » de la barre l'active ou le quitte.
  const CLE_PROF = 'preuves-a-trous:prof';
  const DUREE_PROF = 12 * 60 * 60 * 1000;
  const prof = {
    actif: false,
    auChangement: null,   // rappel du moteur : () => majBoutons()
  };

  function profMemorise() {
    try { return parseInt(localStorage.getItem(CLE_PROF) || '0', 10) > Date.now(); } catch (e) { return false; }
  }
  function memoriserProf(actif) {
    try {
      if (actif) localStorage.setItem(CLE_PROF, String(Date.now() + DUREE_PROF));
      else localStorage.removeItem(CLE_PROF);
    } catch (e) { /* stockage indisponible : le mode vaut pour cette page seulement */ }
  }
  function majBoutonProf() {
    const b = $('#btn-prof');
    if (!b) return;
    b.classList.toggle('active', prof.actif);
    b.title = prof.actif
      ? 'Mode professeur actif (solution et corrigé accessibles) : cliquer pour le quitter'
      : 'Mode professeur (mot de passe requis) : solution et corrigé accessibles d\'emblée';
    b.setAttribute('aria-pressed', prof.actif ? 'true' : 'false');
  }
  function changerProf(actif) {
    prof.actif = actif;
    memoriserProf(actif);
    majBoutonProf();
    if (typeof prof.auChangement === 'function') prof.auChangement(actif);
  }
  function motDePasseValide(mdp) {
    const cfg = window.PREUVES_PROF || {};
    if (!cfg.empreinte) return false;
    return sha256Hex((cfg.sel || '') + mdp) === String(cfg.empreinte).toLowerCase();
  }
  function ouvrirProf() {
    $('#prof-erreur').hidden = true;
    $('#prof-mdp').value = '';
    $('#prof').hidden = false;
    $('#prof-mdp').focus();
  }
  function fermerProf() { $('#prof').hidden = true; }

  function brancherProf(auChangement) {
    prof.auChangement = auChangement || null;
    prof.actif = profMemorise();
    const b = $('#btn-prof');
    if (!b) return prof.actif;
    b.addEventListener('click', () => { if (prof.actif) changerProf(false); else ouvrirProf(); });
    $('#prof-fermer').addEventListener('click', fermerProf);
    $('#prof').addEventListener('click', ev => { if (ev.target === $('#prof')) fermerProf(); });
    $('#prof-form').addEventListener('submit', ev => {
      ev.preventDefault();
      if (motDePasseValide($('#prof-mdp').value)) { fermerProf(); changerProf(true); }
      else { $('#prof-erreur').hidden = false; $('#prof-mdp').select(); }
    });
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !$('#prof').hidden) fermerProf(); });
    majBoutonProf();
    return prof.actif;
  }

  /* ------------------------------------------------------------ Aide */
  function brancherAide() {
    if (!$('#btn-aide')) return;
    $('#btn-aide').addEventListener('click', () => { $('#aide').hidden = false; $('#aide-fermer').focus(); });
    $('#aide-fermer').addEventListener('click', () => { $('#aide').hidden = true; });
    $('#aide').addEventListener('click', ev => { if (ev.target === $('#aide')) $('#aide').hidden = true; });
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !$('#aide').hidden) $('#aide').hidden = true; });
  }

  /* ------------------------------------------------------------ Barre du site */
  // Sur petit écran, l'icône ☰ déroule les onglets (myFunction() du site).
  function brancherBarre() {
    const b = $('#btn-barre');
    if (b) b.addEventListener('click', () => $('#topnav').classList.toggle('responsive'));
  }

  // Page qui sert une entrée du catalogue : index.html (preuve à trous, défaut) ou
  // ordre.html (démonstration à remettre en ordre, type: 'ordre').
  function pageDe(entree) {
    return entree.page || (entree.type === 'ordre' ? 'ordre.html' : 'index.html');
  }

  /* ------------------------------------------------------------ Démarrage commun */
  // Choisit l'entrée du catalogue (?preuve=<id>, sinon la première du type voulu),
  // redirige vers l'autre page si l'entrée n'est pas du type attendu et charge le
  // fichier de l'activité. Rend une promesse de l'activité.
  function demarrer(typeAttendu) {
    const catalogue = window.CATALOGUE_PREUVES || [];
    const params = new URLSearchParams(location.search);
    const voulu = params.get('preuve');
    const estDuType = (e) => (e.type || 'trous') === typeAttendu;
    let entree = catalogue.find(e => e.id === voulu);
    if (entree && !estDuType(entree)) {
      location.replace(pageDe(entree) + '?preuve=' + encodeURIComponent(entree.id));
      return new Promise(() => {});
    }
    if (!entree) entree = catalogue.find(estDuType) || null;
    if (!entree) return Promise.reject(new Error('Aucune activité de ce type n\'est inscrite dans preuves/catalogue.js.'));
    return chargerActivite(entree);
  }

  window.PreuvesCommun = {
    $, MACROS, rendreMath, rendreTexte, echapper, typo, texteBrut, sha256Hex,
    prof, brancherProf, changerProf, brancherAide, brancherBarre, chargerActivite, demarrer, pageDe,
  };
})();
