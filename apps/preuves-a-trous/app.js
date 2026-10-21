/* =============================================================================
   Preuves à trous — MPU1054 (UQTR)
   Moteur générique : une démonstration dont certains morceaux sont des blancs,
   chaque blanc étant un menu d'options (vraies et fausses). Les preuves sont
   décrites dans preuves/<id>.js (voir README.md) et listées dans
   preuves/catalogue.js. Mathématiques rendues par KaTeX (vendor/katex).

   Adresse : index.html?preuve=<id>. Le mode professeur (solution, impression et
   corrigé accessibles d'emblée) s'active par le bouton « Mode prof » sous le titre,
   protégé par un mot de passe dont l'empreinte SHA-256 est dans prof.js (à changer
   avec mot-de-passe.py) ; il reste actif douze heures dans le navigateur, et un
   second clic sur le bouton le quitte.
   ============================================================================= */
(function () {
  'use strict';

  /* ------------------------------------------------------------ Registre */
  const REGISTRE = {};
  window.PreuvesATrous = {
    enregistrer(preuve) { REGISTRE[preuve.id] = preuve; },
    registre: REGISTRE,
  };

  /* ------------------------------------------------------------ KaTeX */
  // Macros du cours (integrale-commands.tex, math-commands.tex) pour pouvoir
  // coller le LaTeX des diapositives tel quel.
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

  function echapper(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  // Typographie française hors des formules : espace insécable avant « : ; ? ! » »
  // et après « « ».
  function typo(t) {
    return t.replace(/ ([:;?!»])/g, '\u00A0$1').replace(/« /g, '«\u00A0');
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

  /* ------------------------------------------------------------ État */
  const etat = {
    preuve: null,        // description de la preuve courante
    blancs: [],          // [{id, menu, def, numero, el}]
    choix: {},           // id du blanc -> id de l'option choisie
    essais: 0,
    solution: false,     // la solution est affichée en ce moment
    solutionVue: false,  // la solution a été consultée au moins une fois (mention imprimée)
    complet: false,      // dernière vérification : tout est juste
    essaiAffiche: 0,     // numéro de l'essai dont la rétroaction est affichée
    modeProf: false,
    menuBlanc: null,     // blanc dont le menu est ouvert
  };

  const $ = (sel) => document.querySelector(sel);
  const params = new URLSearchParams(location.search);

  /* ------------------------------------------------------------ Persistance */
  function cleStockage() { return 'preuves-a-trous:' + etat.preuve.id; }
  function sauver() {
    try {
      localStorage.setItem(cleStockage(), JSON.stringify({ choix: etat.choix, essais: etat.essais, solutionVue: etat.solutionVue }));
    } catch (e) { /* stockage indisponible : on continue sans */ }
  }
  function restaurer() {
    try {
      const brut = localStorage.getItem(cleStockage());
      if (!brut) return;
      const d = JSON.parse(brut);
      if (d && typeof d === 'object') {
        etat.choix = d.choix || {};
        etat.essais = d.essais | 0;
        etat.solutionVue = !!d.solutionVue;
      }
    } catch (e) { etat.choix = {}; etat.essais = 0; etat.solutionVue = false; }
  }
  function oublier() {
    try { localStorage.removeItem(cleStockage()); } catch (e) { /* rien */ }
  }

  /* ------------------------------------------------------------ Mode professeur */
  const CLE_PROF = 'preuves-a-trous:prof';
  const DUREE_PROF = 12 * 60 * 60 * 1000;   // douze heures

  function profActif() {
    try {
      const fin = parseInt(localStorage.getItem(CLE_PROF) || '0', 10);
      return fin > Date.now();
    } catch (e) { return false; }
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
    b.classList.toggle('active', etat.modeProf);
    b.title = etat.modeProf
      ? 'Mode professeur actif (solution et corrigé accessibles) : cliquer pour le quitter'
      : 'Mode professeur (mot de passe requis) : solution et corrigé accessibles d\'emblée';
    b.setAttribute('aria-pressed', etat.modeProf ? 'true' : 'false');
  }
  function activerProf() {
    etat.modeProf = true;
    memoriserProf(true);
    majBoutonProf();
    if (etat.preuve) majBoutons();
  }
  function quitterProf() {
    etat.modeProf = false;
    memoriserProf(false);
    majBoutonProf();
    if (etat.preuve) majBoutons();
  }

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
    // Remplissage : 0x80, zéros, longueur sur 64 bits (big-endian) ; longueur totale multiple de 64.
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

  function motDePasseValide(mdp) {
    const cfg = window.PREUVES_PROF || {};
    if (!cfg.empreinte) return false;
    return sha256Hex((cfg.sel || '') + mdp) === String(cfg.empreinte).toLowerCase();
  }

  function ouvrirProf() {
    const boite = $('#prof');
    $('#prof-erreur').hidden = true;
    $('#prof-mdp').value = '';
    boite.hidden = false;
    $('#prof-mdp').focus();
  }
  function fermerProf() { $('#prof').hidden = true; }

  function brancherProf() {
    const b = $('#btn-prof');
    if (!b) return;
    b.addEventListener('click', () => { if (etat.modeProf) quitterProf(); else ouvrirProf(); });
    $('#prof-fermer').addEventListener('click', fermerProf);
    $('#prof').addEventListener('click', ev => { if (ev.target === $('#prof')) fermerProf(); });
    $('#prof-form').addEventListener('submit', ev => {
      ev.preventDefault();
      if (motDePasseValide($('#prof-mdp').value)) {
        fermerProf();
        activerProf();
      } else {
        $('#prof-erreur').hidden = false;
        $('#prof-mdp').select();
      }
    });
    document.addEventListener('keydown', ev => {
      if (ev.key === 'Escape' && !$('#prof').hidden) fermerProf();
    });
    majBoutonProf();
  }

  /* ------------------------------------------------------------ Accès aux données */
  function menu(id) {
    const m = etat.preuve.menus[id];
    if (!m) throw new Error('Menu inconnu : ' + id);
    return m;
  }
  function option(menuId, optId) {
    return menu(menuId).options.find(o => o.id === optId) || null;
  }
  function blancParId(id) { return etat.blancs.find(b => b.id === id); }

  // Verdict d'un blanc : 'vide', 'ok', 'remarque' (accepté avec remarque) ou 'faux'.
  function evaluer(blanc) {
    const def = blanc.def;
    const c = etat.choix[blanc.id];
    if (!c) return { verdict: 'vide' };
    if ((def.ok || []).includes(c)) return { verdict: 'ok' };
    if (def.okAvecRemarque && Object.prototype.hasOwnProperty.call(def.okAvecRemarque, c)) {
      return { verdict: 'remarque', texte: def.okAvecRemarque[c] };
    }
    const opt = option(def.menu, c);
    const texte = (def.pourquoi && def.pourquoi[c])
      || (opt && opt.pourquoi)
      || (def.pourquoi && def.pourquoi['*'])
      || 'Cette option ne convient pas ici.';
    return { verdict: 'faux', texte };
  }

  function idSolution(blanc) {
    return blanc.def.solution || (blanc.def.ok && blanc.def.ok[0]) || null;
  }

  /* ------------------------------------------------------------ Construction */
  function construire() {
    const p = etat.preuve;
    document.title = (p.titreCourt || p.titre) + ' — Preuve à trous';
    $('#titre').innerHTML = rendreTexte(p.titre);
    $('#sous-titre').innerHTML = rendreTexte(p.sousTitre || 'MPU1054 · Analyse à une variable réelle II');
    $('#imp-cours').textContent = (p.sousTitre || 'MPU1054').replace(/<[^>]+>/g, '');
    $('#imp-titre').innerHTML = rendreTexte(p.titre);

    // Consignes
    const cons = $('#consignes');
    if (p.consignes) {
      cons.innerHTML = '<h2>Consignes</h2>' + rendreTexte(p.consignes);
    } else {
      cons.hidden = true;
    }

    // Énoncé
    const en = $('#enonce');
    en.innerHTML = (p.enonce.titre ? '<div class="bloc-titre">' + rendreTexte(p.enonce.titre) + '</div>' : '')
      + rendreTexte(p.enonce.html);

    // Rappels
    if (p.rappels && p.rappels.length) {
      const r = $('#rappels');
      r.hidden = false;
      $('#rappels-contenu').innerHTML = p.rappels.map(x =>
        '<div class="rappel"><h3>' + rendreTexte(x.titre) + '</h3>' + rendreTexte(x.html) + '</div>').join('');
    }

    // Démonstration
    const zone = $('#preuve');
    zone.innerHTML = '';
    etat.blancs = [];
    let numero = 0;
    p.preuve.forEach(paragraphe => {
      const par = document.createElement('p');
      paragraphe.forEach(seg => {
        if (typeof seg === 'string') {
          par.insertAdjacentHTML('beforeend', rendreTexte(seg));
        } else {
          numero += 1;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'blanc vide';
          btn.dataset.blanc = seg.b;
          btn.setAttribute('aria-haspopup', 'dialog');
          btn.title = 'Blanc ' + numero + ' : ' + libelleMenu(seg.menu);
          btn.innerHTML = '<span class="num">' + numero + '</span><span class="contenu"></span>';
          btn.addEventListener('click', () => ouvrirMenu(seg.b));
          par.appendChild(btn);
          etat.blancs.push({ id: seg.b, menu: seg.menu, def: seg, numero, el: btn });
        }
      });
      zone.appendChild(par);
    });

    // Corrigé (lien vers le PDF recadré, s'il existe)
    const lien = $('#lien-corrige');
    if (p.corrige && p.corrige.pdf) {
      lien.href = p.corrige.pdf;
    } else {
      lien.remove();
    }

    etat.blancs.forEach(afficherBlanc);
    // Une preuve déjà complète (rechargement) garde l'accès à l'impression sans re-vérifier.
    etat.complet = etat.blancs.length > 0
      && etat.blancs.every(b => ['ok', 'remarque'].includes(evaluer(b).verdict));
    construireAnnexeMenus();
    majProgression();
    majBoutons();
  }

  // Annexe imprimée (feuille vierge) : les menus et leurs options, lettrées.
  function construireAnnexeMenus() {
    const zone = $('#annexe-menus');
    if (!zone) return;
    const p = etat.preuve;
    const utilises = [];
    etat.blancs.forEach(b => { if (!utilises.includes(b.menu)) utilises.push(b.menu); });
    zone.innerHTML = '<h2>Options des blancs</h2>' + utilises.map(id => {
      const m = menu(id);
      const nums = etat.blancs.filter(b => b.menu === id).map(b => b.numero).join(', ');
      return '<div class="annexe-menu"><h3>' + rendreTexte(m.titre || m.libelle || id)
        + ' <span class="annexe-blancs">(blanc' + (nums.includes(',') ? 's ' : ' ') + nums + ')</span></h3><ol>'
        + m.options.map(o => '<li>' + rendreTexte(o.texte) + '</li>').join('') + '</ol></div>';
    }).join('');
  }

  function libelleMenu(menuId) {
    const m = menu(menuId);
    return m.libelle || menuId;
  }

  // Met à jour le contenu affiché d'un blanc à partir du choix courant.
  function afficherBlanc(blanc) {
    const c = etat.choix[blanc.id];
    const cont = blanc.el.querySelector('.contenu');
    blanc.el.classList.remove('vide', 'rempli', 'ok', 'remarque', 'faux', 'manque', 'solution', 'vide-impression');
    if (c) {
      const opt = option(blanc.menu, c);
      cont.innerHTML = opt ? rendreTexte(opt.texte) : '<span class="vide">option inconnue</span>';
      blanc.el.classList.add('rempli');
    } else {
      cont.innerHTML = '<span class="vide">' + echapper(libelleMenu(blanc.menu)) + '</span>';
      blanc.el.classList.add('vide', 'vide-impression');
    }
  }

  function majProgression() {
    const n = etat.blancs.length;
    const remplis = etat.blancs.filter(b => etat.choix[b.id]).length;
    let txt = remplis + ' blanc' + (remplis > 1 ? 's' : '') + ' sur ' + n + ' rempli' + (remplis > 1 ? 's' : '');
    if (etat.essais) txt += ' · essai' + (etat.essais > 1 ? 's' : '') + ' : ' + etat.essais;
    $('#progression').textContent = txt;
  }

  function majBoutons() {
    const p = etat.preuve;
    const seuil = p.solutionApres == null ? 3 : p.solutionApres;
    $('#btn-solution').hidden = !(etat.modeProf || etat.essais >= seuil || etat.solution);
    const peutImprimer = etat.complet || etat.solution || etat.modeProf;
    const bImp = $('#btn-imprimer');
    bImp.disabled = !peutImprimer;
    bImp.title = peutImprimer
      ? 'Mettre en page la démonstration (enregistrer en PDF ou imprimer)'
      : 'Disponible lorsque la démonstration est complète';
    const lien = $('#lien-corrige');
    if (lien) lien.hidden = !(etat.complet || etat.solution || etat.modeProf);
  }

  /* ------------------------------------------------------------ Menu */
  function ouvrirMenu(blancId) {
    const blanc = blancParId(blancId);
    const m = menu(blanc.menu);
    etat.menuBlanc = blanc;
    $('#menu-titre').innerHTML = 'Blanc ' + blanc.numero + ' — ' + rendreTexte(m.titre || m.libelle || blanc.menu);
    const zone = $('#menu-options');
    zone.innerHTML = '';
    const courant = etat.choix[blancId];
    m.options.forEach(opt => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', String(opt.id === courant));
      b.innerHTML = rendreTexte(opt.texte);
      b.addEventListener('click', () => { choisir(blanc, opt.id); fermerMenu(); });
      zone.appendChild(b);
    });
    $('#menu-effacer').disabled = !courant;
    blanc.el.classList.add('ouvert');
    $('#voile').hidden = false;
    $('#menu').hidden = false;
    const sel = zone.querySelector('[aria-selected="true"]') || zone.firstElementChild;
    if (sel) sel.focus();
  }

  function fermerMenu() {
    const blanc = etat.menuBlanc;
    $('#voile').hidden = true;
    $('#menu').hidden = true;
    if (blanc) {
      blanc.el.classList.remove('ouvert');
      blanc.el.focus();
    }
    etat.menuBlanc = null;
  }

  function choisir(blanc, optId) {
    if (optId) etat.choix[blanc.id] = optId; else delete etat.choix[blanc.id];
    etat.solution = false;
    etat.complet = false;
    afficherBlanc(blanc);
    const retro = $('#retro');
    if (!retro.hidden && !retro.querySelector('.perime')) {
      retro.insertAdjacentHTML('afterbegin', '<p class="perime">Modifié depuis '
        + (etat.essaiAffiche ? 'l\'essai ' + etat.essaiAffiche : 'l\'affichage de la solution')
        + ' : appuyez de nouveau sur « Vérifier ».</p>');
    }
    majProgression();
    majBoutons();
    sauver();
  }

  // Navigation au clavier dans le menu (flèches, Échap).
  function clavierMenu(ev) {
    if ($('#menu').hidden) return;
    const opts = Array.from($('#menu-options').querySelectorAll('button'));
    const i = opts.indexOf(document.activeElement);
    if (ev.key === 'Escape') { ev.preventDefault(); fermerMenu(); }
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); (opts[i + 1] || opts[0]).focus(); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); (opts[i - 1] || opts[opts.length - 1]).focus(); }
    else if (ev.key === 'Tab') {
      // Le focus reste dans la fenêtre du menu.
      const focalisables = Array.from($('#menu').querySelectorAll('button:not(:disabled)'));
      const premier = focalisables[0], dernier = focalisables[focalisables.length - 1];
      if (ev.shiftKey && document.activeElement === premier) { ev.preventDefault(); dernier.focus(); }
      else if (!ev.shiftKey && document.activeElement === dernier) { ev.preventDefault(); premier.focus(); }
      else if (!focalisables.includes(document.activeElement)) { ev.preventDefault(); premier.focus(); }
    }
  }

  /* ------------------------------------------------------------ Vérification */
  function verifier() {
    etat.essais += 1;
    etat.essaiAffiche = etat.essais;
    etat.solution = false;
    const resultats = etat.blancs.map(b => ({ blanc: b, res: evaluer(b) }));
    resultats.forEach(({ blanc, res }) => {
      afficherBlanc(blanc);
      blanc.el.classList.add(res.verdict === 'vide' ? 'manque' : res.verdict);
    });
    const nbOk = resultats.filter(r => r.res.verdict === 'ok' || r.res.verdict === 'remarque').length;
    const nbFaux = resultats.filter(r => r.res.verdict === 'faux').length;
    const nbVides = resultats.filter(r => r.res.verdict === 'vide').length;
    etat.complet = nbOk === resultats.length;

    const retro = $('#retro');
    retro.hidden = false;
    let html = '';
    if (etat.complet && etat.solutionVue) {
      html += '<p class="bilan succes">La démonstration est complète (solution consultée).</p>';
    } else if (etat.complet) {
      html += '<p class="bilan succes">Bravo ! La démonstration est complète et correcte'
        + (etat.essais > 1 ? ' (' + etat.essais + ' essais).' : ' du premier coup.') + '</p>';
      const remarques = resultats.filter(r => r.res.verdict === 'remarque');
      if (remarques.length) {
        html += '<ul>' + remarques.map(r => ligneRetro(r, 'Accepté. ' + r.res.texte)).join('') + '</ul>';
      }
    }
    if (etat.complet) {
      html += '<p class="indice">Vous pouvez maintenant imprimer la démonstration ou en faire une capture d\'écran pour la coller dans votre cahier.</p>';
    } else {
      const morceaux = [];
      morceaux.push(nbOk + ' réponse' + (nbOk > 1 ? 's' : '') + ' juste' + (nbOk > 1 ? 's' : '') + ' sur ' + resultats.length);
      if (nbFaux) morceaux.push(nbFaux + ' erreur' + (nbFaux > 1 ? 's' : ''));
      if (nbVides) morceaux.push(nbVides + ' blanc' + (nbVides > 1 ? 's' : '') + ' vide' + (nbVides > 1 ? 's' : ''));
      html += '<p class="bilan">' + morceaux.join(' · ') + ' — essai ' + etat.essais + '.</p><ul>';
      resultats.forEach(r => {
        if (r.res.verdict === 'faux') html += ligneRetro(r, r.res.texte);
        else if (r.res.verdict === 'remarque') html += ligneRetro(r, 'Accepté. ' + r.res.texte);
        else if (r.res.verdict === 'vide') html += ligneRetro(r, 'À compléter.');
      });
      html += '</ul>';
    }
    retro.innerHTML = '<h2>Rétroaction</h2>' + html;
    retro.querySelectorAll('li[data-blanc]').forEach(li => {
      li.addEventListener('click', () => {
        const b = blancParId(li.dataset.blanc);
        b.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        b.el.focus();
      });
    });
    majProgression();
    majBoutons();
    sauver();
  }

  function ligneRetro(r, texte) {
    const c = etat.choix[r.blanc.id];
    const opt = c ? option(r.blanc.menu, c) : null;
    const choix = opt ? '<span class="choix">Votre choix : ' + rendreTexte(opt.texte) + '.</span> ' : '';
    return '<li class="' + r.res.verdict + '" data-blanc="' + echapper(r.blanc.id) + '">'
      + '<span class="num">' + r.blanc.numero + '</span>'
      + '<span class="texte">' + choix + rendreTexte(texte) + '</span></li>';
  }

  /* ------------------------------------------------------------ Solution */
  function montrerSolution() {
    etat.blancs.forEach(b => {
      const s = idSolution(b);
      if (s) etat.choix[b.id] = s;
      afficherBlanc(b);
      b.el.classList.add('solution');
    });
    etat.solution = true;
    etat.solutionVue = true;
    etat.complet = true;
    etat.essaiAffiche = 0;
    const retro = $('#retro');
    retro.hidden = false;
    let html = '<p class="bilan">Solution affichée : chaque blanc contient une réponse attendue.</p>';
    const alternatives = etat.blancs.filter(b => b.def.okAvecRemarque && Object.keys(b.def.okAvecRemarque).length);
    if (alternatives.length) {
      html += '<p class="indice">D\'autres réponses sont acceptées à certains blancs :</p><ul>';
      alternatives.forEach(b => {
        Object.keys(b.def.okAvecRemarque).forEach(optId => {
          const opt = option(b.menu, optId);
          html += '<li class="remarque" data-blanc="' + echapper(b.id) + '"><span class="num">' + b.numero + '</span>'
            + '<span class="texte"><span class="choix">' + rendreTexte(opt ? opt.texte : optId) + '.</span> '
            + rendreTexte(b.def.okAvecRemarque[optId]) + '</span></li>';
        });
      });
      html += '</ul>';
    }
    retro.innerHTML = '<h2>Rétroaction</h2>' + html;
    majProgression();
    majBoutons();
    sauver();
  }

  function recommencer() {
    etat.choix = {};
    etat.essais = 0;
    etat.solution = false;
    etat.solutionVue = false;
    etat.complet = false;
    etat.essaiAffiche = 0;
    oublier();
    etat.blancs.forEach(afficherBlanc);
    $('#retro').hidden = true;
    $('#retro').innerHTML = '';
    majProgression();
    majBoutons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ------------------------------------------------------------ Impression */
  function preparerImpression() {
    const d = new Date();
    $('#imp-date').textContent = d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
    const mention = $('#imp-mention');
    const nbVides = etat.blancs.filter(b => !etat.choix[b.id]).length;
    // Feuille vierge (mode prof) : numéros des blancs et annexe des menus.
    document.body.classList.toggle('vierge', nbVides > 0);
    if (etat.solution) {
      mention.hidden = false;
      mention.textContent = 'Solution.';
    } else if (etat.complet && etat.solutionVue) {
      mention.hidden = false;
      mention.textContent = 'Démonstration complétée après consultation de la solution.';
    } else if (etat.complet) {
      mention.hidden = false;
      mention.textContent = 'Démonstration complétée en ' + etat.essais + ' essai' + (etat.essais > 1 ? 's' : '') + '.';
    } else {
      mention.hidden = true;
    }
  }

  /* ------------------------------------------------------------ Démarrage */
  function brancher() {
    $('#btn-verifier').addEventListener('click', verifier);
    $('#btn-recommencer').addEventListener('click', () => {
      if (Object.keys(etat.choix).length === 0 || confirm('Effacer tous les choix et recommencer ?')) recommencer();
    });
    $('#btn-solution').addEventListener('click', montrerSolution);
    $('#btn-imprimer').addEventListener('click', () => { preparerImpression(); window.print(); });
    $('#menu-fermer').addEventListener('click', fermerMenu);
    $('#voile').addEventListener('click', fermerMenu);
    $('#menu-effacer').addEventListener('click', () => { if (etat.menuBlanc) choisir(etat.menuBlanc, null); fermerMenu(); });
    $('#btn-aide').addEventListener('click', () => { $('#aide').hidden = false; $('#aide-fermer').focus(); });
    $('#aide-fermer').addEventListener('click', () => { $('#aide').hidden = true; });
    $('#aide').addEventListener('click', ev => { if (ev.target === $('#aide')) $('#aide').hidden = true; });
    document.addEventListener('keydown', ev => {
      clavierMenu(ev);
      if (ev.key === 'Escape' && !$('#aide').hidden) $('#aide').hidden = true;
    });
    window.addEventListener('beforeprint', preparerImpression);
  }

  function chargerPreuve(entree) {
    return new Promise((resoudre, rejeter) => {
      if (REGISTRE[entree.id]) { resoudre(REGISTRE[entree.id]); return; }
      const s = document.createElement('script');
      s.src = entree.fichier;
      s.onload = () => REGISTRE[entree.id] ? resoudre(REGISTRE[entree.id]) : rejeter(new Error('Le fichier ' + entree.fichier + ' n\'enregistre pas la preuve « ' + entree.id + ' ».'));
      s.onerror = () => rejeter(new Error('Impossible de charger ' + entree.fichier + '.'));
      document.head.appendChild(s);
    });
  }

  function demarrer() {
    // Barre du site : sur petit écran, l'icône ☰ déroule les onglets (myFunction() du site).
    $('#btn-barre').addEventListener('click', () => $('#topnav').classList.toggle('responsive'));

    const catalogue = window.CATALOGUE_PREUVES || [];
    if (!catalogue.length) {
      $('#preuve').innerHTML = '<p>Aucune preuve n\'est inscrite dans <code>preuves/catalogue.js</code>.</p>';
      return;
    }
    const voulu = params.get('preuve');
    const entree = catalogue.find(e => e.id === voulu) || catalogue[0];
    etat.modeProf = profActif();
    brancherProf();

    chargerPreuve(entree).then(p => {
      etat.preuve = p;
      restaurer();
      construire();
      brancher();
    }).catch(err => {
      $('#preuve').innerHTML = '<p>' + echapper(err.message) + '</p>';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
