/* =============================================================================
   Démonstrations à remettre en ordre — MPU1054 (UQTR)
   Second moteur de l'application « Preuves à trous » : une démonstration est
   découpée en parties (but, partie 1, partie 2...), chaque partie en étapes
   présentées dans le désordre, avec quelques étapes intruses. L'étudiant remet
   les cartes en ordre (glisser-déposer, sélection puis touche, boutons ▲ ▼) et
   écarte les intruses. La vérification ne compare pas à un ordre unique : chaque
   étape déclare les étapes qu'elle requiert (requiert: [...]) et tout ordre qui
   respecte ces dépendances est accepté ; une étape mal placée reçoit l'explication
   de ce qui lui manque, ou de qui l'attend.

   Fichier d'activité : preuves/<id>.js, PreuvesATrous.enregistrer({ type: 'ordre', ... })
   (format dans README.md). Utilitaires communs (KaTeX, mode prof, aide, barre) : commun.js.
   Adresse : ordre.html?preuve=<id>
   ============================================================================= */
(function () {
  'use strict';

  const C = window.PreuvesCommun;
  const { $, rendreTexte, echapper, texteBrut } = C;

  /* ------------------------------------------------------------ État */
  const etat = {
    act: null,            // description de l'activité
    cartes: {},           // id -> carte {id, texte, court, partie, intrus, requiert, explications, pourquoi, rang}
    parties: [],          // [{id, titre, etapes: [ids canoniques], intrus: [ids]}]
    listes: {},           // nom de liste -> [ids] ; listes : 'tas', 'p:<partie>', 'ecartees'
    verrous: {},          // id -> true (cartes placées par un indice ou la solution)
    verdicts: {},         // id -> {verdict, messages} après vérification
    essais: 0,
    solution: false,
    solutionVue: false,
    complet: false,
    selection: null,      // id de la carte sélectionnée (déplacement par touches)
    difficile: false,     // toutes les étapes mélangées dans un seul tas
    get modeProf() { return C.prof.actif; },
  };

  const LETTRES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /* ------------------------------------------------------------ Persistance */
  function cleStockage() { return 'preuves-a-trous:ordre:' + etat.act.id; }
  function sauver() {
    try {
      localStorage.setItem(cleStockage(), JSON.stringify({
        listes: etat.listes, verrous: Object.keys(etat.verrous), essais: etat.essais,
        solutionVue: etat.solutionVue, difficile: etat.difficile,
      }));
    } catch (e) { /* stockage indisponible : on continue sans */ }
  }
  function restaurer() {
    try {
      const brut = localStorage.getItem(cleStockage());
      if (!brut) return false;
      const d = JSON.parse(brut);
      if (!d || typeof d !== 'object' || !d.listes) return false;
      // Les listes doivent contenir exactement les cartes de l'activité (sinon l'activité a changé).
      const ids = Object.keys(etat.cartes).sort();
      const presents = Object.values(d.listes).flat().sort();
      if (ids.join('|') !== presents.join('|')) return false;
      etat.listes = d.listes;
      etat.verrous = {};
      (d.verrous || []).forEach(id => { if (etat.cartes[id]) etat.verrous[id] = true; });
      etat.essais = d.essais | 0;
      etat.solutionVue = !!d.solutionVue;
      etat.difficile = !!d.difficile;
      return true;
    } catch (e) { return false; }
  }
  function oublier() { try { localStorage.removeItem(cleStockage()); } catch (e) { /* rien */ } }

  /* ------------------------------------------------------------ Préparation */
  function melanger(tableau) {
    const t = tableau.slice();
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [t[i], t[j]] = [t[j], t[i]];
    }
    return t;
  }
  // Mélange qui n'est jamais l'ordre canonique (quand c'est possible).
  function melangerVraiment(ids, canonique) {
    if (ids.length < 2) return ids.slice();
    let t = melanger(ids);
    for (let k = 0; k < 20 && t.join() === canonique.join(); k++) t = melanger(ids);
    return t;
  }

  function preparerCartes() {
    const a = etat.act;
    etat.cartes = {};
    etat.parties = (a.parties || []).map((p, ip) => {
      const etapes = (p.etapes || []).map((e, i) => {
        etat.cartes[e.id] = {
          id: e.id, texte: e.texte, court: e.court || texteBrut(e.texte).slice(0, 40),
          partie: p.id, intrus: false, rang: i,
          requiert: e.requiert || [], explications: e.explications || {},
        };
        return e.id;
      });
      const intrus = (p.intrus || []).map(e => {
        etat.cartes[e.id] = {
          id: e.id, texte: e.texte, court: e.court || texteBrut(e.texte).slice(0, 40),
          partie: p.id, intrus: true, rang: -1, requiert: [], explications: {}, pourquoi: e.pourquoi || '',
        };
        return e.id;
      });
      return { id: p.id, titre: p.titre || ('Partie ' + (ip + 1)), court: p.court || ('partie ' + (ip + 1)), etapes, intrus, numero: ip + 1 };
    });
    // Vérification de cohérence du fichier d'activité (aide à la rédaction).
    Object.values(etat.cartes).forEach(c => c.requiert.forEach(r => {
      if (!etat.cartes[r] || etat.cartes[r].intrus) console.warn('ordre.js : « ' + c.id + ' » requiert « ' + r + ' », inconnue ou intruse.');
    }));
  }

  function distribuer() {
    etat.listes = { ecartees: [] };
    if (etat.difficile) {
      const tout = etat.parties.flatMap(p => p.etapes.concat(p.intrus));
      etat.listes.tas = melanger(tout);
      etat.parties.forEach(p => { etat.listes['p:' + p.id] = []; });
    } else {
      etat.parties.forEach(p => {
        etat.listes['p:' + p.id] = melangerVraiment(p.etapes.concat(p.intrus), p.etapes);
      });
    }
    etat.verrous = {};
  }

  function partieDe(id) { return etat.parties.find(p => p.id === etat.cartes[id].partie); }
  function listeDe(id) { return Object.keys(etat.listes).find(n => etat.listes[n].includes(id)) || null; }
  function positionDe(id) { const n = listeDe(id); return n ? etat.listes[n].indexOf(id) : -1; }
  function nomPartie(nomListe) { return nomListe.startsWith('p:') ? nomListe.slice(2) : null; }
  function indexPartie(pid) { return etat.parties.findIndex(p => p.id === pid); }

  /* ------------------------------------------------------------ Construction */
  function construire() {
    const a = etat.act;
    document.title = (a.titreCourt || texteBrut(a.titre)) + ' — Remise en ordre';
    $('#titre').innerHTML = rendreTexte(a.titre);
    $('#sous-titre').innerHTML = rendreTexte(a.sousTitre || 'MPU1054 · Analyse à une variable réelle II');
    $('#imp-cours').textContent = texteBrut(a.sousTitre || 'MPU1054');
    $('#imp-titre').innerHTML = rendreTexte(a.titre);

    const cons = $('#consignes');
    cons.innerHTML = '<h2>Consignes</h2>' + rendreTexte(a.consignes || '')
      + '<label class="interrupteur"><input type="checkbox" id="chk-difficile"> <span>Mode difficile : toutes les étapes sont mélangées dans un seul tas, à répartir dans les parties.</span></label>';
    $('#chk-difficile').checked = etat.difficile;
    $('#chk-difficile').addEventListener('change', ev => {
      const voulu = ev.target.checked;
      if (aBouge() && !confirm('Changer de mode mélange de nouveau toutes les cartes. Continuer ?')) { ev.target.checked = !voulu; return; }
      etat.difficile = voulu;
      recommencer(true);
    });

    const en = $('#enonce');
    en.innerHTML = (a.enonce && a.enonce.titre ? '<div class="bloc-titre">' + rendreTexte(a.enonce.titre) + '</div>' : '')
      + rendreTexte(a.enonce ? a.enonce.html : '');

    if (a.rappels && a.rappels.length) {
      $('#rappels').hidden = false;
      $('#rappels-contenu').innerHTML = a.rappels.map(x =>
        '<div class="rappel"><h3>' + rendreTexte(x.titre) + '</h3>' + rendreTexte(x.html) + '</div>').join('');
    }

    const lien = $('#lien-corrige');
    if (a.corrige && a.corrige.pdf) lien.href = a.corrige.pdf; else lien.remove();

    construireListes();
  }

  // (Re)construit les sections des parties (et le tas) et toutes les cartes.
  function construireListes() {
    const zone = $('#parties');
    zone.innerHTML = '';
    if (etat.difficile) {
      zone.insertAdjacentHTML('beforeend',
        '<section class="partie tas" data-partie=""><header class="partie-entete"><h3>Étapes à placer</h3><span class="partie-compte" id="compte-tas"></span></header>'
        + '<p class="partie-vide" id="tas-vide" hidden>Toutes les étapes sont placées.</p><ol class="etapes" data-liste="tas"></ol></section>');
    }
    etat.parties.forEach(p => {
      zone.insertAdjacentHTML('beforeend',
        '<section class="partie" data-partie="' + echapper(p.id) + '"><header class="partie-entete"><h3>' + rendreTexte(p.titre) + '</h3>'
        + '<span class="partie-compte" id="compte-' + echapper(p.id) + '"></span></header>'
        + '<p class="partie-vide" hidden>Aucune étape pour l\'instant : déposez-en ici.</p>'
        + '<ol class="etapes" data-liste="p:' + echapper(p.id) + '"></ol></section>');
    });
    $('#zone-ecartees').hidden = false;
    Object.keys(etat.listes).forEach(nom => {
      const ol = document.querySelector('ol[data-liste="' + nom + '"]');
      if (!ol) return;
      etat.listes[nom].forEach(id => ol.appendChild(creerCarte(id)));
    });
    document.querySelectorAll('ol.etapes').forEach(ol => {
      ol.appendChild(creerFente(ol.dataset.liste));
    });
    rafraichir();
  }

  function creerCarte(id) {
    const c = etat.cartes[id];
    const li = document.createElement('li');
    li.className = 'carte';
    li.dataset.id = id;
    li.tabIndex = 0;
    li.innerHTML =
      '<button class="poignee" type="button" tabindex="-1" aria-label="Déplacer la carte (glisser)" title="Glisser pour déplacer">⋮⋮</button>'
      + '<span class="num" aria-hidden="true"></span>'
      + '<div class="texte">' + rendreTexte(c.texte) + '</div>'
      + '<div class="actions">'
      + '<button class="haut" type="button" title="Monter d\'un cran" aria-label="Monter">▲</button>'
      + '<button class="bas" type="button" title="Descendre d\'un cran" aria-label="Descendre">▼</button>'
      + '<button class="ecarter" type="button" title="Écarter : cette étape est intruse" aria-label="Écarter">⊘</button>'
      + '<button class="reprendre" type="button" title="Reprendre dans la démonstration" aria-label="Reprendre">↩</button>'
      + '</div>'
      + '<div class="verdict-texte" hidden></div>';
    li.querySelector('.haut').addEventListener('click', ev => { ev.stopPropagation(); decaler(id, -1); });
    li.querySelector('.bas').addEventListener('click', ev => { ev.stopPropagation(); decaler(id, +1); });
    li.querySelector('.ecarter').addEventListener('click', ev => { ev.stopPropagation(); deplacer(id, 'ecartees', etat.listes.ecartees.length); });
    li.querySelector('.reprendre').addEventListener('click', ev => { ev.stopPropagation(); reprendre(id); });
    li.addEventListener('click', ev => {
      if (ev.target.closest('button')) return;
      clicCarte(id);
    });
    li.addEventListener('keydown', ev => clavierCarte(ev, id));
    brancherGlisser(li, id);
    return li;
  }

  // Fente « placer à la fin » (visible lorsqu'une carte est sélectionnée).
  function creerFente(nomListe) {
    const f = document.createElement('li');
    f.className = 'fente';
    f.innerHTML = '<button type="button" class="fente-bouton">Placer ici</button>';
    f.querySelector('button').addEventListener('click', () => {
      if (!etat.selection) return;
      const id = etat.selection;
      const cible = etat.listes[nomListe];
      const dansCette = listeDe(id) === nomListe;
      deplacer(id, nomListe, cible.length - (dansCette ? 1 : 0));
      selectionner(null);
    });
    return f;
  }

  /* ------------------------------------------------------------ Déplacements */
  function aBouge() { return etat.essais > 0 || Object.keys(etat.verrous).length > 0; }

  // Déplace la carte id dans la liste nom, à l'index voulu (après retrait).
  function deplacer(id, nom, index, options) {
    if (etat.verrous[id] && !(options && options.force)) return false;
    const source = listeDe(id);
    if (!source) return false;
    const nouvelles = {};
    Object.keys(etat.listes).forEach(n => { nouvelles[n] = etat.listes[n].filter(x => x !== id); });
    const cible = nouvelles[nom];
    if (!cible) return false;
    const k = Math.max(0, Math.min(index, cible.length));
    cible.splice(k, 0, id);
    animer(() => {
      etat.listes = nouvelles;
      const ol = document.querySelector('ol[data-liste="' + nom + '"]');
      const li = document.querySelector('li.carte[data-id="' + id + '"]');
      const autres = Array.from(ol.querySelectorAll('li.carte')).filter(x => x !== li);
      ol.insertBefore(li, autres[k] || ol.querySelector('li.fente'));
      neutraliser(id);
      rafraichir();
    });
    sauver();
    return true;
  }

  function decaler(id, delta) {
    const nom = listeDe(id);
    const i = etat.listes[nom].indexOf(id);
    const j = i + delta;
    if (j < 0 || j >= etat.listes[nom].length) return;
    deplacer(id, nom, j);
  }

  function reprendre(id) {
    const c = etat.cartes[id];
    const nom = etat.difficile ? 'tas' : 'p:' + c.partie;
    deplacer(id, nom, etat.listes[nom].length);
  }

  // Sélection (déplacement « touche, puis touche l'endroit »).
  function selectionner(id) {
    etat.selection = id;
    document.querySelectorAll('li.carte').forEach(li => li.classList.toggle('selectionnee', li.dataset.id === id));
    document.body.classList.toggle('selection-active', !!id);
  }
  function clicCarte(id) {
    if (etat.verrous[id] && !etat.selection) return;
    if (!etat.selection) { selectionner(id); return; }
    if (etat.selection === id) { selectionner(null); return; }
    // Une carte est sélectionnée : on la place juste avant la carte touchée.
    const sel = etat.selection;
    const nom = listeDe(id);
    let k = etat.listes[nom].indexOf(id);
    if (listeDe(sel) === nom && etat.listes[nom].indexOf(sel) < k) k -= 1;
    deplacer(sel, nom, k);
    selectionner(null);
  }
  function clavierCarte(ev, id) {
    if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); clicCarte(id); }
    else if (ev.key === 'Escape') { selectionner(null); }
    else if ((ev.key === 'ArrowUp' || ev.key === 'ArrowDown') && etat.selection === id) {
      ev.preventDefault();
      decaler(id, ev.key === 'ArrowUp' ? -1 : 1);
      const li = document.querySelector('li.carte[data-id="' + id + '"]');
      if (li) li.focus();
    }
  }

  /* ------------------------------------------------------------ Glisser-déposer (pointeur : souris et toucher) */
  const glisse = { actif: false, id: null, li: null, fantome: null, dx: 0, dy: 0, cible: null, index: 0, depart: null, defilement: 0 };

  function brancherGlisser(li, id) {
    const poignee = li.querySelector('.poignee');
    poignee.addEventListener('pointerdown', ev => {
      if (etat.verrous[id] || ev.button === 2) return;
      ev.preventDefault();
      poignee.setPointerCapture(ev.pointerId);
      glisse.depart = { x: ev.clientX, y: ev.clientY, pointerId: ev.pointerId };
      glisse.id = id; glisse.li = li; glisse.actif = false;
    });
    poignee.addEventListener('pointermove', ev => {
      if (!glisse.depart || glisse.id !== id) return;
      if (!glisse.actif) {
        if (Math.hypot(ev.clientX - glisse.depart.x, ev.clientY - glisse.depart.y) < 5) return;
        commencerGlisse(ev);
      }
      suivreGlisse(ev);
    });
    const fin = ev => {
      if (glisse.id !== id) return;
      if (glisse.actif) terminerGlisse();
      glisse.depart = null; glisse.id = null; glisse.li = null;
    };
    poignee.addEventListener('pointerup', fin);
    poignee.addEventListener('pointercancel', fin);
  }

  function commencerGlisse(ev) {
    glisse.actif = true;
    selectionner(null);
    const li = glisse.li;
    const r = li.getBoundingClientRect();
    const f = $('#fantome');
    f.innerHTML = li.querySelector('.texte').innerHTML;
    f.style.width = r.width + 'px';
    f.hidden = false;
    glisse.fantome = f;
    glisse.dx = ev.clientX - r.left; glisse.dy = ev.clientY - r.top;
    li.classList.add('en-deplacement');
    document.body.classList.add('glisse-en-cours');
    // Repère d'insertion
    const rep = document.createElement('li');
    rep.className = 'repere';
    rep.style.height = Math.min(r.height, 120) + 'px';
    glisse.repere = rep;
    li.parentNode.insertBefore(rep, li);
    boucleDefilement();
  }

  function suivreGlisse(ev) {
    const f = glisse.fantome;
    f.style.transform = 'translate(' + (ev.clientX - glisse.dx) + 'px, ' + (ev.clientY - glisse.dy) + 'px)';
    glisse.y = ev.clientY;
    // Défilement automatique près des bords de la fenêtre.
    const marge = 70;
    glisse.defilement = ev.clientY < marge ? -(marge - ev.clientY) / 4 : (ev.clientY > innerHeight - marge ? (ev.clientY - (innerHeight - marge)) / 4 : 0);
    placerRepere(ev.clientX, ev.clientY);
  }

  function boucleDefilement() {
    if (!glisse.actif) return;
    if (glisse.defilement) {
      window.scrollBy(0, glisse.defilement);
      if (glisse.y != null) placerRepere(innerWidth / 2, glisse.y);
    }
    requestAnimationFrame(boucleDefilement);
  }

  // Trouve la liste et la position d'insertion sous le pointeur, et y place le repère.
  function placerRepere(x, y) {
    const f = glisse.fantome;
    f.style.pointerEvents = 'none';
    let el = document.elementFromPoint(x, y);
    f.style.pointerEvents = '';
    let ol = el ? el.closest('ol.etapes') : null;
    if (!ol) {
      // Entre deux listes : on prend la liste la plus proche verticalement (sections des parties).
      const sec = el ? el.closest('section.partie') : null;
      if (sec) ol = sec.querySelector('ol.etapes');
    }
    if (!ol) return;
    const cartes = Array.from(ol.querySelectorAll('li.carte')).filter(c => c !== glisse.li);
    let index = cartes.length;
    for (let i = 0; i < cartes.length; i++) {
      const r = cartes[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) { index = i; break; }
    }
    glisse.cible = ol.dataset.liste; glisse.index = index;
    const suivant = cartes[index] || ol.querySelector('li.fente');
    if (glisse.repere.nextSibling !== suivant || glisse.repere.parentNode !== ol) ol.insertBefore(glisse.repere, suivant);
  }

  function terminerGlisse() {
    const { id, cible, index, li, fantome, repere } = glisse;
    glisse.actif = false; glisse.defilement = 0; glisse.y = null;
    fantome.hidden = true; fantome.style.transform = '';
    li.classList.remove('en-deplacement');
    document.body.classList.remove('glisse-en-cours');
    if (repere && repere.parentNode) repere.parentNode.removeChild(repere);
    glisse.repere = null;
    if (cible) deplacer(id, cible, index);
    glisse.cible = null;
  }

  /* ------------------------------------------------------------ Animation (FLIP) */
  function animer(changement) {
    const avant = {};
    document.querySelectorAll('li.carte').forEach(li => { avant[li.dataset.id] = li.getBoundingClientRect(); });
    changement();
    if (glisse.actif) return;
    document.querySelectorAll('li.carte').forEach(li => {
      const a = avant[li.dataset.id], b = li.getBoundingClientRect();
      if (!a) return;
      const dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      li.style.transition = 'none';
      li.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
      li.getBoundingClientRect();
      li.style.transition = 'transform 260ms cubic-bezier(.2,.7,.2,1)';
      li.style.transform = '';
      li.addEventListener('transitionend', () => { li.style.transition = ''; }, { once: true });
    });
  }

  /* ------------------------------------------------------------ Affichage */
  function rafraichir() {
    // Numéros, compteurs, boutons de chaque carte.
    Object.keys(etat.listes).forEach(nom => {
      const ol = document.querySelector('ol[data-liste="' + nom + '"]');
      if (!ol) return;
      const ids = etat.listes[nom];
      ids.forEach((id, i) => {
        const li = ol.querySelector('li.carte[data-id="' + id + '"]');
        if (!li) return;
        const num = li.querySelector('.num');
        num.textContent = nom === 'ecartees' ? '⊘' : (nom === 'tas' ? '?' : String(i + 1));
        li.classList.toggle('verrouillee', !!etat.verrous[id]);
        li.classList.toggle('dans-ecartees', nom === 'ecartees');
        li.querySelector('.haut').disabled = i === 0 || !!etat.verrous[id];
        li.querySelector('.bas').disabled = i === ids.length - 1 || !!etat.verrous[id];
        li.querySelector('.ecarter').hidden = nom === 'ecartees';
        li.querySelector('.reprendre').hidden = nom !== 'ecartees';
        li.querySelector('.ecarter').disabled = !!etat.verrous[id];
        li.querySelector('.reprendre').disabled = !!etat.verrous[id];
        li.setAttribute('aria-label', (nom === 'ecartees' ? 'Étape écartée' : 'Étape ' + (i + 1)) + (etat.verrous[id] ? ' (verrouillée)' : ''));
      });
      const vide = ol.parentNode.querySelector('.partie-vide');
      if (vide) vide.hidden = ids.length > 0;
    });
    etat.parties.forEach(p => {
      const n = etat.listes['p:' + p.id].length;
      const el = $('#compte-' + p.id);
      if (el) el.textContent = n + (n > 1 ? ' cartes' : ' carte');
    });
    const ne = etat.listes.ecartees.length;
    $('#compte-ecartees').textContent = ne ? ne + (ne > 1 ? ' cartes' : ' carte') : '';
    if (etat.difficile) { const t = etat.listes.tas.length; $('#compte-tas').textContent = t ? t + ' à placer' : ''; }
    majProgression();
    majBoutons();
  }

  function majProgression() {
    const total = etat.parties.reduce((s, p) => s + p.etapes.length, 0);
    const nbIntrus = etat.parties.reduce((s, p) => s + p.intrus.length, 0);
    let t;
    if (etat.verdicts && Object.keys(etat.verdicts).length) {
      const ok = Object.values(etat.verdicts).filter(v => v.verdict === 'ok' && !v.intrus).length;
      const intrusOk = Object.values(etat.verdicts).filter(v => v.verdict === 'ok' && v.intrus).length;
      t = ok + ' étape' + (ok > 1 ? 's' : '') + ' bien placée' + (ok > 1 ? 's' : '') + ' sur ' + total
        + (nbIntrus ? ' · ' + intrusOk + ' intruse' + (intrusOk > 1 ? 's' : '') + ' écartée' + (intrusOk > 1 ? 's' : '') + ' sur ' + nbIntrus : '')
        + ' · essai ' + etat.essais;
    } else {
      t = total + ' étapes à ordonner' + (nbIntrus ? ' · ' + nbIntrus + ' intruse' + (nbIntrus > 1 ? 's' : '') + ' à écarter' : '')
        + (etat.essais ? ' · essais : ' + etat.essais : '');
    }
    $('#progression').textContent = t;
  }

  function majBoutons() {
    const a = etat.act;
    const seuil = a.solutionApres == null ? 3 : a.solutionApres;
    $('#btn-solution').hidden = !(etat.modeProf || etat.essais >= seuil || etat.solution);
    const peutImprimer = etat.complet || etat.solution || etat.modeProf;
    const bImp = $('#btn-imprimer');
    bImp.disabled = !peutImprimer;
    bImp.title = peutImprimer ? 'Mettre en page la démonstration (enregistrer en PDF ou imprimer)' : 'Disponible lorsque la démonstration est en ordre';
    const lien = $('#lien-corrige');
    if (lien) lien.hidden = !(etat.complet || etat.solution || etat.modeProf);
    $('#btn-indice').disabled = etat.solution;
  }

  // Une carte déplacée perd son verdict (les autres gardent le leur jusqu'à la prochaine vérification).
  function neutraliser(id) {
    delete etat.verdicts[id];
    etat.complet = false;
    etat.solution = false;
    document.body.classList.remove('solution-affichee');
    const li = document.querySelector('li.carte[data-id="' + id + '"]');
    if (li) {
      li.classList.remove('ok', 'ordre', 'faux', 'vide', 'solution', 'fete');
      const z = li.querySelector('.verdict-texte'); z.hidden = true; z.innerHTML = '';
    }
    if (Object.keys(etat.verdicts).length === 0) $('#retro').hidden = true;
  }

  function effacerVerdicts() {
    etat.verdicts = {};
    etat.complet = false;
    document.querySelectorAll('li.carte').forEach(li => {
      li.classList.remove('ok', 'ordre', 'faux', 'vide', 'solution', 'fete');
      const v = li.querySelector('.verdict-texte');
      v.hidden = true; v.innerHTML = '';
    });
    $('#retro').hidden = true;
    document.body.classList.remove('solution-affichee');
  }

  /* ------------------------------------------------------------ Vérification */
  // Position « logique » d'une carte : (indice de partie, position dans la liste),
  // ou null si elle est dans le tas ou dans les écartées.
  function place(id) {
    const nom = listeDe(id);
    const pid = nomPartie(nom);
    if (pid == null) return null;
    return { partie: indexPartie(pid), pid, pos: etat.listes[nom].indexOf(id) };
  }
  function avant(p, q) { return p.partie < q.partie || (p.partie === q.partie && p.pos < q.pos); }
  function etiquette(id) {
    const c = etat.cartes[id];
    const p = place(id);
    const nom = listeDe(id);
    const ou = p ? ' (étape ' + (p.pos + 1) + (etat.parties.length > 1 ? ', ' + etat.parties[p.partie].court : '') + ')'
      : (nom === 'ecartees' ? ' (écartée)' : ' (à placer)');
    return '« ' + rendreTexte(c.court) + ' »' + ou;
  }

  function verifier() {
    etat.essais += 1;
    const verdicts = {};
    const titrePartie = pid => texteBrut(etat.parties.find(p => p.id === pid).titre);
    Object.keys(etat.listes).forEach(nom => {
      etat.listes[nom].forEach(id => {
        const c = etat.cartes[id];
        const messages = [];
        let verdict = 'ok';
        if (nom === 'ecartees') {
          if (!c.intrus) { verdict = 'faux'; messages.push('Cette étape fait bien partie de la démonstration (' + titrePartie(c.partie) + ') : à replacer.'); }
        } else if (nom === 'tas') {
          verdict = 'vide'; messages.push('Étape à placer dans une partie.');
        } else {
          const pid = nomPartie(nom);
          if (c.intrus) {
            verdict = 'faux';
            messages.push(rendreTexte(c.pourquoi || 'Cette étape est intruse : elle ne fait pas partie de la démonstration.'));
          } else if (c.partie !== pid) {
            verdict = 'faux';
            messages.push('Cette étape appartient à une autre partie : ' + titrePartie(c.partie) + '.');
          } else {
            const moi = place(id);
            // Prérequis manquants ou placés après.
            c.requiert.forEach(r => {
              if (!etat.cartes[r] || verdict === 'faux') return;
              const pr = place(r);
              if (pr && avant(pr, moi)) return;
              verdict = 'ordre';
              const expl = c.explications[r];
              const ou = !pr ? ' Elle est pour l\'instant ' + (listeDe(r) === 'ecartees' ? 'écartée' : 'dans le tas') + '.' : (pr.partie > moi.partie ? ' Elle est placée dans une partie ultérieure.' : ' Elle vient après.');
              messages.push((expl ? rendreTexte(expl) + ' — ' : '') + 'Il faut d\'abord ' + etiquette(r) + '.' + ou);
            });
            // Étapes qui l'utilisent, placées avant elle.
            if (verdict === 'ok') {
              const dep = Object.values(etat.cartes).filter(d => !d.intrus && d.requiert.includes(id));
              const trop = dep.filter(d => { const pd = place(d.id); return pd && avant(pd, moi); });
              if (trop.length) {
                verdict = 'ordre';
                messages.push('Cette étape est utilisée par ' + trop.map(d => etiquette(d.id)).join(' et ') + ', placée' + (trop.length > 1 ? 's' : '') + ' avant elle : à remonter.');
              }
            }
          }
        }
        verdicts[id] = { verdict, messages: messages.slice(0, 2), intrus: c.intrus };
      });
    });
    etat.verdicts = verdicts;
    etat.complet = Object.values(verdicts).every(v => v.verdict === 'ok');
    etat.solution = false;
    afficherVerdicts();
    sauver();
    rafraichir();
    $('#retro').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function afficherVerdicts() {
    document.querySelectorAll('li.carte').forEach(li => {
      const v = etat.verdicts[li.dataset.id];
      li.classList.remove('ok', 'ordre', 'faux', 'vide', 'solution', 'fete');
      const zone = li.querySelector('.verdict-texte');
      if (!v) { zone.hidden = true; return; }
      li.classList.add(v.verdict);
      if (v.messages.length) { zone.hidden = false; zone.innerHTML = v.messages.map(m => '<p>' + m + '</p>').join(''); }
      else { zone.hidden = true; zone.innerHTML = ''; }
    });
    const retro = $('#retro');
    const n = Object.values(etat.verdicts);
    const nbFaux = n.filter(v => v.verdict === 'faux').length;
    const nbOrdre = n.filter(v => v.verdict === 'ordre').length;
    const nbVide = n.filter(v => v.verdict === 'vide').length;
    let html = '';
    if (etat.complet) {
      html = '<p class="bilan succes">✓ Démonstration remise en ordre en ' + etat.essais + ' essai' + (etat.essais > 1 ? 's' : '') + ' !'
        + (etat.solutionVue ? ' (solution consultée)' : '') + ' Vous pouvez maintenant l\'imprimer ou la capturer pour votre cahier.</p>'
        + (etat.act.noteOrdres ? '<p class="note">' + rendreTexte(etat.act.noteOrdres) + '</p>' : '');
      document.querySelectorAll('li.carte').forEach((li, i) => { setTimeout(() => li.classList.add('fete'), i * 40); });
    } else {
      const morceaux = [];
      if (nbOrdre) morceaux.push('<span class="pastille ordre">' + nbOrdre + '</span> à déplacer');
      if (nbFaux) morceaux.push('<span class="pastille faux">' + nbFaux + '</span> à écarter ou à replacer');
      if (nbVide) morceaux.push('<span class="pastille vide">' + nbVide + '</span> à placer');
      html = '<p class="bilan">Essai ' + etat.essais + ' : ' + morceaux.join(', ') + '. Les explications sont sous chaque carte concernée.</p>';
    }
    retro.innerHTML = html;
    retro.hidden = false;
  }

  /* ------------------------------------------------------------ Indice et solution */
  // Place la prochaine étape canonique (partie après partie) et la verrouille ;
  // puis, lorsque les étapes d'une partie sont toutes en place, en écarte les intruses.
  function indice() {
    if (etat.solution) return;
    let fait = null;
    for (const p of etat.parties) {
      const nom = 'p:' + p.id;
      const L = etat.listes[nom];
      for (let k = 0; k < p.etapes.length; k++) {
        if (L[k] !== p.etapes[k]) { fait = { id: p.etapes[k], nom, k }; break; }
      }
      if (fait) break;
      const reste = L.slice(p.etapes.length);
      if (reste.length) { fait = { id: reste[0], nom: 'ecartees', k: etat.listes.ecartees.length }; break; }
    }
    if (!fait) {
      $('#retro').innerHTML = '<p class="bilan">Tout est en place : appuyez sur Vérifier.</p>';
      $('#retro').hidden = false;
      return;
    }
    etat.essais += 1;
    const c = etat.cartes[fait.id];
    deplacer(fait.id, fait.nom, fait.k, { force: true });
    etat.verrous[fait.id] = true;
    rafraichir();
    sauver();
    const li = document.querySelector('li.carte[data-id="' + fait.id + '"]');
    if (li) { li.classList.add('indice'); setTimeout(() => li.classList.remove('indice'), 1500); li.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    $('#retro').innerHTML = '<p class="bilan">Indice : ' + (fait.nom === 'ecartees'
      ? 'l\'étape « ' + rendreTexte(c.court) + ' » est intruse, elle a été écartée.'
      : 'l\'étape « ' + rendreTexte(c.court) + ' » est l\'étape ' + (fait.k + 1) + (etat.parties.length > 1 ? ' (' + etat.parties.find(p => 'p:' + p.id === fait.nom).court + ')' : '') + ' ; elle est verrouillée.')
      + ' (Compte pour un essai.)</p>';
    $('#retro').hidden = false;
  }

  function montrerSolution() {
    animer(() => {
      const nouvelles = { ecartees: [] };
      etat.parties.forEach(p => { nouvelles['p:' + p.id] = p.etapes.slice(); nouvelles.ecartees.push(...p.intrus); });
      if (etat.difficile) nouvelles.tas = [];
      etat.listes = nouvelles;
      Object.keys(etat.listes).forEach(nom => {
        const ol = document.querySelector('ol[data-liste="' + nom + '"]');
        if (!ol) return;
        const fente = ol.querySelector('li.fente');
        etat.listes[nom].forEach(id => ol.insertBefore(document.querySelector('li.carte[data-id="' + id + '"]'), fente));
      });
      etat.solution = true;
      etat.solutionVue = true;
      etat.verrous = {};
      etat.verdicts = {};
      etat.complet = false;
      document.querySelectorAll('li.carte').forEach(li => {
        li.classList.remove('ok', 'ordre', 'faux', 'vide', 'fete');
        li.classList.add('solution');
        const zone = li.querySelector('.verdict-texte');
        const c = etat.cartes[li.dataset.id];
        if (c.intrus) { zone.hidden = false; zone.innerHTML = '<p>' + rendreTexte(c.pourquoi || 'Étape intruse.') + '</p>'; }
        else { zone.hidden = true; zone.innerHTML = ''; }
      });
      document.body.classList.add('solution-affichee');
      rafraichir();
    });
    sauver();
    const retro = $('#retro');
    retro.innerHTML = '<p class="bilan">Solution : l\'ordre des notes de cours, les étapes intruses étant écartées (leur explication est sous chacune).'
      + (etat.act.noteOrdres ? ' ' + rendreTexte(etat.act.noteOrdres) : '') + '</p>';
    retro.hidden = false;
    selectionner(null);
  }

  function recommencer(garderMode) {
    etat.essais = 0; etat.solution = false; etat.solutionVue = false; etat.complet = false;
    etat.verrous = {}; etat.verdicts = {};
    selectionner(null);
    distribuer();
    construireListes();
    $('#retro').hidden = true;
    document.body.classList.remove('solution-affichee');
    if (!garderMode) oublier();
    sauver();
  }

  /* ------------------------------------------------------------ Impression */
  function preparerImpression() {
    const d = new Date();
    $('#imp-date').textContent = d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
    const mention = $('#imp-mention');
    // Feuille vierge (mode prof, cartes jamais vérifiées) : cartes lettrées et cases pour l'ordre.
    const vierge = etat.essais === 0 && !etat.solution && !etat.complet;
    document.body.classList.toggle('vierge', vierge);
    document.querySelectorAll('ol.etapes').forEach(ol => {
      const cartes = ol.querySelectorAll('li.carte');
      cartes.forEach((li, i) => { li.querySelector('.num').dataset.lettre = LETTRES[i] || String(i + 1); });
      let grille = ol.parentNode.querySelector('.grille-ordre');
      if (vierge && ol.dataset.liste !== 'ecartees' && cartes.length) {
        if (!grille) { grille = document.createElement('div'); grille.className = 'grille-ordre impression-seulement'; ol.parentNode.appendChild(grille); }
        grille.innerHTML = 'Ordre : ' + Array.from(cartes).map(() => '<span class="case"></span>').join('') + ' &nbsp; Intruses : <span class="case longue"></span>';
      } else if (grille) grille.remove();
    });
    if (etat.solution) { mention.hidden = false; mention.textContent = 'Solution.'; }
    else if (etat.complet && etat.solutionVue) { mention.hidden = false; mention.textContent = 'Démonstration remise en ordre après consultation de la solution.'; }
    else if (etat.complet) { mention.hidden = false; mention.textContent = 'Démonstration remise en ordre en ' + etat.essais + ' essai' + (etat.essais > 1 ? 's' : '') + '.'; }
    else mention.hidden = true;
  }

  /* ------------------------------------------------------------ Démarrage */
  function brancher() {
    $('#btn-verifier').addEventListener('click', verifier);
    $('#btn-indice').addEventListener('click', indice);
    $('#btn-recommencer').addEventListener('click', () => {
      if (!aBouge() && Object.keys(etat.verdicts).length === 0 || confirm('Mélanger de nouveau toutes les cartes et recommencer ?')) recommencer(true);
    });
    $('#btn-solution').addEventListener('click', montrerSolution);
    $('#btn-imprimer').addEventListener('click', () => { preparerImpression(); window.print(); });
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape') selectionner(null); });
    document.addEventListener('click', ev => {
      // Clic hors des cartes et des fentes : on annule la sélection.
      if (etat.selection && !ev.target.closest('li.carte, li.fente, .barre')) selectionner(null);
    });
    window.addEventListener('beforeprint', preparerImpression);
    C.brancherAide();
  }

  function demarrer() {
    C.brancherBarre();
    C.brancherProf(() => { if (etat.act) majBoutons(); });
    C.demarrer('ordre').then(a => {
      etat.act = a;
      preparerCartes();
      if (!restaurer()) distribuer();
      construire();
      brancher();
      sauver();
    }).catch(err => {
      $('#parties').innerHTML = '<p>' + echapper(err.message) + '</p>';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
