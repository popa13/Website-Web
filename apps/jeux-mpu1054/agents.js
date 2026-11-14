/* =============================================================================
   Agents ε — MPU1054 (UQTR) : jeu d'équipes sur les notions du cours,
   inspiré de Codenames (Vlaada Chvátil).

   Une partie est entièrement déterminée par son code (10 caractères) :
     empreinte de la banque (5 bits) | taille de la grille (2 bits) |
     sections choisies (25 bits, rang dans SECTIONS) | graine (18 bits).
   Le plateau (ordinateur projeté) et la clé des chefs (téléphones) recalculent la
   même grille à partir du code : aucun serveur n'est nécessaire.
   Dépend de notions.js, commun.js et qr.js.
   ============================================================================= */
(function () {
  'use strict';

  const J = window.Jeux, B = J.B, $ = J.$, $$ = J.$$;

  const TAILLES = [
    { n: 25, cols: 5, a: 9, b: 8, neutres: 7, nom: '5 × 5' },
    { n: 20, cols: 5, a: 8, b: 7, neutres: 4, nom: '4 × 5' },
    { n: 16, cols: 4, a: 6, b: 5, neutres: 4, nom: '4 × 4' },
    { n: 12, cols: 4, a: 5, b: 4, neutres: 2, nom: '3 × 4' },
  ];
  const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const VERSION = J.empreinte() % 32;
  const autre = (e) => e === 'vert' ? 'or' : 'vert';

  /* ------------------------------------------------------------ code de partie */
  function encoder(taille, sections, graine) {
    let masque = 0;
    sections.forEach(s => { const i = B.SECTIONS.findIndex(x => x.s === s); if (i >= 0) masque += Math.pow(2, i); });
    let v = ((VERSION * 4 + taille) * Math.pow(2, 25) + masque) * Math.pow(2, 18) + graine;
    let txt = '';
    for (let i = 0; i < 10; i++) { txt = ALPHA[v % 32] + txt; v = Math.floor(v / 32); }
    return txt.slice(0, 5) + '-' + txt.slice(5);
  }
  function decoder(code) {
    const t = String(code || '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V').replace(/[^0-9A-Z]/g, '');
    if (t.length !== 10) return null;
    let v = 0;
    for (const c of t) { const k = ALPHA.indexOf(c); if (k < 0) return null; v = v * 32 + k; }
    const graine = v % Math.pow(2, 18); v = Math.floor(v / Math.pow(2, 18));
    const masque = v % Math.pow(2, 25); v = Math.floor(v / Math.pow(2, 25));
    const taille = v % 4, version = Math.floor(v / 4);
    const sections = B.SECTIONS.filter((x, i) => Math.floor(masque / Math.pow(2, i)) % 2 === 1).map(x => x.s);
    if (!sections.length || masque >= Math.pow(2, B.SECTIONS.length)) return null;
    return { taille, sections, graine, version, code: t.slice(0, 5) + '-' + t.slice(5) };
  }

  /* ------------------------------------------------------------ grille */
  // tous les mots des sections choisies, dans l'ordre de la banque, sans doublon
  function reserve(sections) {
    const vus = new Set(), mots = [];
    J.notions({ sections }).forEach(n => n.mots.forEach(m => {
      const cle = J.brut(m).toLowerCase();
      if (vus.has(cle)) return;
      vus.add(cle); mots.push({ mot: m, id: n.id });
    }));
    return mots;
  }
  function taillesPossibles(sections) {
    const nb = reserve(sections).length;
    return TAILLES.map((t, i) => ({ ...t, i, ok: nb >= t.n }));
  }
  function grille(info) {
    const T = TAILLES[info.taille];
    const alea = J.generateur((info.graine * 2654435761) ^ 0x5bd1e995);
    const mots = J.melanger(reserve(info.sections), alea).slice(0, T.n);
    if (mots.length < T.n) return null;
    const debut = alea() < 0.5 ? 'vert' : 'or';
    const couleurs = J.melanger([].concat(
      Array(T.a).fill(debut), Array(T.b).fill(autre(debut)), Array(T.neutres).fill('neutre'), ['piege']), alea);
    return { debut, cols: T.cols, cartes: mots.map((m, i) => ({ mot: m.mot, id: m.id, couleur: couleurs[i], revele: false })) };
  }
  const notion = (id) => B.NOTIONS.find(n => n.id === id);

  /* ------------------------------------------------------------ préparation */
  const matiere = J.selecteurMatiere($('#matiere'), {
    cle: 'agents:matiere',
    compter: (secs) => { const n = reserve(secs).length; return n + (n > 1 ? ' cartes possibles' : ' carte possible'); },
    auChangement: () => majPrep(),
  });
  let tailleChoisie = J.stock.lire('agents:taille', 0);

  function majPrep() {
    const secs = matiere.sections();
    const poss = taillesPossibles(secs);
    if (!poss[tailleChoisie] || !poss[tailleChoisie].ok) {
      const k = poss.findIndex(t => t.ok);
      tailleChoisie = k < 0 ? 0 : k;
    }
    $('#tailles').innerHTML = poss.map(t => `<label title="${t.ok ? '' : 'Pas assez de notions dans la matière choisie'}">
      <input type="radio" name="taille" value="${t.i}" ${t.i === tailleChoisie ? 'checked' : ''} ${t.ok ? '' : 'disabled'}>
      <span${t.ok ? '' : ' style="opacity:.4"'}>${t.nom} <small>(${t.a}/${t.b}/${t.neutres}/1)</small></span></label>`).join('');
    const ok = poss.some(t => t.ok);
    $('#btn-creer').disabled = !ok;
    $('#note-creer').innerHTML = ok
      ? `${TAILLES[tailleChoisie].n} cartes tirées parmi ${reserve(secs).length}, ${J.resumeSections(secs)}.`
      : '<span class="avertissement">Il faut au moins 12 notions : ajoutez des sections.</span>';
  }
  $('#tailles').addEventListener('change', (e) => { tailleChoisie = parseInt(e.target.value, 10); J.stock.ecrire('agents:taille', tailleChoisie); majPrep(); });
  ['nom-vert', 'nom-or'].forEach(id => {
    const memo = J.stock.lire('agents:' + id, null);
    if (memo) $('#' + id).value = memo;
    $('#' + id).addEventListener('change', (e) => J.stock.ecrire('agents:' + id, e.target.value.trim()));
  });
  const sablierMemo = J.stock.lire('agents:sablier', '0');
  const radioSablier = $(`input[name=sablier][value="${sablierMemo}"]`);
  if (radioSablier) radioSablier.checked = true;
  $$('input[name=sablier]').forEach(i => i.addEventListener('change', () => J.stock.ecrire('agents:sablier', i.value)));

  /* ------------------------------------------------------------ partie (plateau) */
  let P = null;          // la partie en cours
  let annulation = null; // état d'avant la dernière carte révélée
  let aAnimer = null;    // carte qui vient d'être révélée (animation de retournement)

  function nouvellePartie(sections, taille) {
    const graine = Math.floor(Math.random() * Math.pow(2, 18));
    const info = { taille, sections, graine };
    const g = grille(info);
    if (!g) return;
    P = {
      code: encoder(taille, sections, graine), sections, taille, cols: g.cols, cartes: g.cartes,
      debut: g.debut, tour: g.debut, essais: null, indice: null, historique: [], fin: null,
      noms: { vert: $('#nom-vert').value.trim() || 'Équipe verte', or: $('#nom-or').value.trim() || 'Équipe or' },
      sablier: parseInt($('input[name=sablier]:checked').value, 10), rappel: $('#opt-rappel').checked,
      dernier: null, cree: Date.now(), cleVue: false,
    };
    sauver();
    ouvrirPlateau();
    setTimeout(() => ouvrirCle(), 350);
  }

  function sauver() { if (P) J.stock.ecrire('agents:partie', P); }
  const restantes = (e) => P.cartes.filter(c => c.couleur === e && !c.revele).length;

  function ouvrirPlateau() {
    afficher('ecran-jeu');
    $('#jeu').classList.toggle('sans-rappel', !P.rappel);
    $('#rappel').hidden = !P.rappel;
    dessinerPlateau();
    majTour();
    majHistorique();
    majRappel(P.dernier != null ? P.cartes[P.dernier] : null);
    demarrerSablier(true);
  }

  // hauteur des cartes : la grille tient dans la fenêtre (projecteur, plein écran)
  function ajusterHauteur() {
    const pl = $('#plateau');
    if (!P || $('#ecran-jeu').hidden || !pl.clientWidth) return;
    const lignes = Math.ceil(P.cartes.length / P.cols), ecart = parseFloat(getComputedStyle(pl).rowGap) || 8;
    const dispo = window.innerHeight - (pl.getBoundingClientRect().top + window.scrollY) - 64;
    const largeur = (pl.clientWidth - ecart * (P.cols - 1)) / P.cols;
    const h = Math.max(54, Math.min((dispo - ecart * (lignes - 1)) / lignes, largeur * 0.8, 150));
    pl.style.setProperty('--h-mot', Math.round(h) + 'px');
  }
  window.addEventListener('resize', ajusterHauteur);

  function dessinerPlateau() {
    const pl = $('#plateau');
    pl.style.setProperty('--cols', P.cols);
    pl.classList.toggle('fin', !!P.fin);
    pl.innerHTML = P.cartes.map((c, i) => {
      const classes = ['mot'];
      if (c.revele) classes.push('revele', c.couleur);
      if (i === aAnimer) classes.push('anime');
      else if (P.fin && P.fin.cleVisible) classes.push('cle-' + c.couleur);
      if (i === P.dernier) classes.push('dernier');
      const sceau = c.revele ? `<span class="sceau" aria-hidden="true">${{ vert: 'V', or: 'O', neutre: '', piege: '⊥' }[c.couleur]}</span>` : '';
      const lbl = c.revele ? `${J.brut(c.mot)} : ${libelleCouleur(c.couleur)}` : `${J.brut(c.mot)}, carte cachée`;
      return `<button class="${classes.join(' ')}" type="button" data-i="${i}" aria-label="${J.echapper(lbl)}" ${c.revele || P.fin ? 'aria-disabled="true"' : ''}>${sceau}<span>${J.rendre(c.mot)}</span></button>`;
    }).join('');
    requestAnimationFrame(ajusterHauteur);
  }
  function libelleCouleur(c) {
    return { vert: P.noms.vert, or: P.noms.or, neutre: 'neutre', piege: 'contre-exemple' }[c];
  }

  function majTour() {
    ['vert', 'or'].forEach(e => {
      const el = $('#cpt-' + e);
      el.querySelector('b').textContent = restantes(e);
      el.querySelector('span').textContent = P.noms[e];
      el.title = `${P.noms[e]} : ${restantes(e)} carte(s) à trouver`;
      el.classList.toggle('actif', !P.fin && P.tour === e);
    });
    const t = $('#tour');
    if (P.fin) {
      t.className = 'tour ' + P.fin.gagnant;
      t.innerHTML = `<span class="pastille"></span><span>Partie terminée</span>`;
    } else {
      t.className = 'tour ' + P.tour;
      const essais = P.essais == null ? (P.indice ? 'essais illimités' : 'en attente de l’indice') : `${P.essais} essai${P.essais > 1 ? 's' : ''} restant${P.essais > 1 ? 's' : ''}`;
      t.innerHTML = `<span class="pastille"></span><span>Tour : <strong>${J.echapper(P.noms[P.tour])}</strong></span>` +
        (P.indice ? `<span class="indice-actuel">· <q>${J.echapper(P.indice.mot)}</q>${P.indice.nombre === 'inf' ? ', ∞' : ', ' + P.indice.nombre}</span>` : '') +
        `<span class="essais">${essais}</span>`;
    }
    $('#btn-fin-tour').disabled = !!P.fin;
    $('#form-indice').hidden = !!P.fin;
    const bann = $('#banniere');
    if (P.fin) {
      bann.hidden = false;
      bann.className = 'banniere ' + P.fin.gagnant;
      bann.innerHTML = `<div><h2>${J.echapper(P.noms[P.fin.gagnant])} gagne&nbsp;!</h2><p>${J.echapper(P.fin.raison)}</p></div>
        <div class="boutons">
          ${P.fin.cleVisible ? '' : '<button class="btn" data-act="cle" type="button">Dévoiler toute la grille</button>'}
          <button class="btn" data-act="notions" type="button">Revoir les notions</button>
          <button class="btn" data-act="rejouer" type="button">Nouvelle partie</button>
        </div>`;
    } else bann.hidden = true;
  }

  function majHistorique() {
    $('#histo').innerHTML = P.historique.map(h => {
      if (h.type === 'indice') return `<li><span class="pt ${h.equipe}"></span><span><strong>${J.echapper(P.noms[h.equipe])}</strong> : « ${J.echapper(h.mot)} », ${h.nombre === 'inf' ? '∞' : h.nombre}</span></li>`;
      if (h.type === 'fin-tour') return `<li><span class="pt ${h.equipe}"></span><span class="aide-texte" style="margin:0">Fin du tour de ${J.echapper(P.noms[h.equipe])}${h.raison ? ' (' + h.raison + ')' : ''}</span></li>`;
      const c = P.cartes[h.i];
      return `<li><span class="pt ${c.couleur}"></span><span>${J.rendre(c.mot)} <span class="aide-texte">— ${libelleCouleur(c.couleur)}</span></span></li>`;
    }).join('') || '<li class="aide-texte">La partie commence : ' + J.echapper(P.noms[P.debut]) + ' a une carte de plus.</li>';
    const h = $('#historique'); h.scrollTop = h.scrollHeight;
  }

  function majRappel(c) {
    const z = $('#rappel');
    if (!c) { z.innerHTML = '<h3>Rappel du cours</h3><p class="vide">Quand une carte est révélée, son énoncé s’affiche ici.</p>'; return; }
    const n = notion(c.id);
    z.innerHTML = `<h3>Rappel du cours</h3>
      <div class="badges"><span class="badge">Section ${n.s}</span><span class="badge type">${J.etiquette(n)}</span>${n.annexe ? '<span class="badge annexe">Annexe</span>' : ''}</div>
      <p class="nom-petit">${J.rendre(n.nom)}</p>
      <div class="texte-enonce">${J.rendre(n.enonce)}</div>`;
    z.scrollTop = 0;
  }

  function reveler(i) {
    if (!P || P.fin) return;
    const c = P.cartes[i];
    if (!c || c.revele) return;
    annulation = JSON.stringify(P);
    c.revele = true;
    P.dernier = i;
    const equipe = P.tour;
    P.historique.push({ type: 'carte', i, equipe });
    let finTour = false, raison = '';
    if (c.couleur === 'piege') {
      P.fin = { gagnant: autre(equipe), raison: `${P.noms[equipe]} a touché le contre-exemple « ${J.brut(c.mot)} ».` };
    } else if (c.couleur === equipe) {
      if (!restantes(equipe)) P.fin = { gagnant: equipe, raison: `Toutes ses cartes ont été trouvées.` };
      else if (P.essais != null && --P.essais <= 0) { finTour = true; raison = 'plus d’essais'; }
    } else if (c.couleur === autre(equipe)) {
      if (!restantes(autre(equipe))) P.fin = { gagnant: autre(equipe), raison: `${P.noms[equipe]} a révélé sa dernière carte.` };
      else { finTour = true; raison = 'carte adverse'; }
    } else { finTour = true; raison = 'carte neutre'; }
    if (finTour) passerTour(raison, true);
    sauver();
    aAnimer = i;
    dessinerPlateau(); majTour(); majHistorique();
    aAnimer = null;
    if (P.rappel) majRappel(c);
    annoncer(`${J.brut(c.mot)} : ${libelleCouleur(c.couleur)}.` + (P.fin ? ` ${P.noms[P.fin.gagnant]} gagne.` : finTour ? ` Tour : ${P.noms[P.tour]}.` : ''));
    if (P.fin) { arreterSablier(); J.confettis(3200); toast(null); }
    else toast(`<span>${J.rendre(c.mot)} : <strong>${J.echapper(libelleCouleur(c.couleur))}</strong></span>`, true);
  }

  function passerTour(raison, silencieux) {
    if (!P || P.fin) return;
    P.historique.push({ type: 'fin-tour', equipe: P.tour, raison });
    P.tour = autre(P.tour);
    P.essais = null; P.indice = null;
    demarrerSablier(true);
    if (!silencieux) { sauver(); majTour(); majHistorique(); annoncer(`Tour : ${P.noms[P.tour]}.`); }
  }

  function annoncerIndice(mot, nombre) {
    if (!P || P.fin || !mot) return;
    P.indice = { mot, nombre };
    P.essais = nombre === 'inf' || nombre === '0' ? null : parseInt(nombre, 10) + 1;
    P.historique.push({ type: 'indice', equipe: P.tour, mot, nombre });
    sauver(); majTour(); majHistorique();
  }

  function annuler() {
    if (!annulation) return;
    P = JSON.parse(annulation);
    annulation = null;
    sauver();
    toast(null);
    dessinerPlateau(); majTour(); majHistorique();
    majRappel(P.dernier != null ? P.cartes[P.dernier] : null);
    if (!P.fin) demarrerSablier(false);
  }

  /* ------------------------------------------------------------ sablier */
  let sab = { reste: 0, fin: 0, pause: false, id: null };
  function demarrerSablier(remettre) {
    arreterSablier();
    const el = $('#sablier');
    if (!P || !P.sablier || P.fin) { el.hidden = true; return; }
    el.hidden = false;
    if (remettre || !sab.reste) sab.reste = P.sablier * 1000;
    sab.pause = false;
    sab.fin = Date.now() + sab.reste;
    tic();
    sab.id = setInterval(tic, 250);
  }
  function arreterSablier() { if (sab.id) clearInterval(sab.id); sab.id = null; }
  function tic() {
    const el = $('#sablier');
    if (!sab.pause) sab.reste = Math.max(0, sab.fin - Date.now());
    const s = Math.ceil(sab.reste / 1000);
    el.textContent = (sab.pause ? '⏸ ' : '⏳ ') + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    el.classList.toggle('urgent', !sab.pause && s <= 10);
    if (!sab.pause && sab.reste <= 0) {
      arreterSablier();
      passerTour('temps écoulé');
      toast('<span>Temps écoulé. Tour : <strong>' + J.echapper(P.noms[P.tour]) + '</strong>.</span>');
    }
  }
  $('#sablier').addEventListener('click', () => {
    if (sab.pause) { sab.pause = false; sab.fin = Date.now() + sab.reste; } else sab.pause = true;
    tic();
  });

  /* ------------------------------------------------------------ toast, annonces */
  let toastId = null;
  function toast(html, avecAnnuler) {
    const t = $('#toast');
    clearTimeout(toastId);
    if (!html) { t.hidden = true; return; }
    t.innerHTML = html + (avecAnnuler ? '<button class="btn petit" type="button" data-annuler>Annuler</button>' : '');
    t.hidden = false;
    toastId = setTimeout(() => { t.hidden = true; annulation = null; }, avecAnnuler ? 6000 : 3500);
  }
  $('#toast').addEventListener('click', (e) => { if (e.target.closest('[data-annuler]')) annuler(); });
  function annoncer(txt) { $('#annonce').textContent = txt; }

  /* ------------------------------------------------------------ clé des chefs (QR) */
  const boiteCle = J.boite('boite-cle');
  function lienChef(code) {
    const base = location.href.split('#')[0].split('?')[0];
    return base + '?chef=' + code;
  }
  function ouvrirCle() {
    if (!P) return;
    const lien = lienChef(P.code);
    $('#qr').innerHTML = window.QR.svg(lien);
    $('#cle-code').textContent = P.code;
    $('#cle-lien').href = lien; $('#cle-lien').textContent = lien.replace(/^https?:\/\//, '');
    $('#cle-onglet').href = lien;
    $('#cle-qr').classList.add('cache-qr');
    $('#cle-note').textContent = location.protocol === 'file:'
      ? 'Page ouverte depuis un fichier : le code QR ne fonctionne pas sur un téléphone. Utilisez la page du site, ou entrez le code de la partie.'
      : 'Le code est flouté : les autres joueurs détournent les yeux pendant que les chefs le scannent.';
    boiteCle.ouvrir();
  }
  let flouId = null;
  $('#btn-montrer-qr').addEventListener('click', () => {
    clearTimeout(flouId);
    $('#cle-qr').classList.remove('cache-qr');
    flouId = setTimeout(() => $('#cle-qr').classList.add('cache-qr'), 10000);
  });

  /* ------------------------------------------------------------ notions de la partie */
  const boiteNotions = J.boite('boite-notions');
  function ouvrirNotions() {
    if (!P) return;
    $('#notions-info').textContent = `${P.cartes.length} cartes, ${J.resumeSections(P.sections)}. Cliquez sur une notion pour revoir son énoncé.`;
    const voir = (c) => c.revele || P.fin;
    $('#liste-notions').innerHTML = P.cartes.map(c => {
      const n = notion(c.id);
      const pastille = voir(c) ? `<span class="pt ${c.couleur}" style="width:.8em;height:.8em;border-radius:50%;flex:none;display:inline-block"></span>` : '<span class="marque">·</span>';
      return `<li><details><summary>${pastille}<span>${J.rendre(c.mot)}</span><span class="meta">${J.etiquette(n)} · section ${n.s}</span></summary>
        <div class="corps"><p class="nom-petit" style="margin:0 0 4px;font-weight:700">${J.rendre(n.nom)}</p><div class="texte-enonce">${J.rendre(n.enonce)}</div></div></details></li>`;
    }).join('');
    boiteNotions.ouvrir();
  }

  /* ------------------------------------------------------------ clé des chefs : écran */
  function ouvrirChef(info) {
    const g = grille(info);
    if (!g) { erreurRejoindre('Ce code ne correspond à aucune grille.'); return; }
    afficher('ecran-chef');
    const marques = new Set(J.stock.lire('agents:chef:' + info.code, []));
    const T = TAILLES[info.taille];
    $('#chef-info').innerHTML = `Partie <strong>${info.code}</strong> · ${J.resumeSections(info.sections)} · ` +
      `<strong>${g.debut === 'vert' ? 'L’équipe verte' : 'L’équipe or'} commence</strong> (${T.a} cartes contre ${T.b}).` +
      (info.version !== VERSION ? ' <span class="avertissement">Attention : la banque de notions de cette page diffère de celle du plateau ; rechargez les deux pages.</span>' : '');
    const pl = $('#plateau-chef');
    pl.style.setProperty('--cols', g.cols);
    function dessiner() {
      pl.innerHTML = g.cartes.map((c, i) => `<button type="button" class="mot k-${c.couleur}${marques.has(i) ? ' trouve' : ''}" data-i="${i}"
        aria-label="${J.echapper(J.brut(c.mot))} : ${{ vert: 'équipe verte', or: 'équipe or', neutre: 'neutre', piege: 'contre-exemple' }[c.couleur]}${marques.has(i) ? ', révélée' : ''}">
        ${c.couleur === 'piege' ? '<span class="sceau">⊥</span>' : ''}<span>${J.rendre(c.mot)}</span></button>`).join('');
      const reste = (k) => g.cartes.filter((c, i) => c.couleur === k && !marques.has(i)).length;
      $('#legende-chef').innerHTML = `<span><span class="pt vert" style="display:inline-block;width:.8em;height:.8em;border-radius:50%"></span> Verte : ${reste('vert')} à trouver</span>
        <span><span class="pt or" style="display:inline-block;width:.8em;height:.8em;border-radius:50%"></span> Or : ${reste('or')} à trouver</span>
        <span><span class="pt piege" style="display:inline-block;width:.8em;height:.8em;border-radius:50%"></span> Contre-exemple</span>`;
      const liste = (k, titre) => `<div><h4>${titre}</h4><ul>${g.cartes.map((c, i) => c.couleur === k ? `<li${marques.has(i) ? ' style="text-decoration:line-through;opacity:.5"' : ''}>${J.rendre(c.mot)}</li>` : '').join('')}</ul></div>`;
      $('#listes-chef').innerHTML = liste('vert', 'Équipe verte') + liste('or', 'Équipe or') + liste('piege', 'Contre-exemple');
    }
    pl.onclick = (e) => {
      const b = e.target.closest('[data-i]');
      if (!b) return;
      const i = parseInt(b.dataset.i, 10);
      if (marques.has(i)) marques.delete(i); else marques.add(i);
      J.stock.ecrire('agents:chef:' + info.code, Array.from(marques));
      dessiner();
    };
    dessiner();
  }
  $('#btn-masquer-cle').addEventListener('click', (e) => {
    const v = $('#ecran-chef').classList.toggle('cachee');
    e.target.textContent = v ? 'Afficher' : 'Masquer';
  });
  $('#btn-chef-quitter').addEventListener('click', () => {
    history.replaceState(null, '', location.pathname + (J.INTEGRE ? '?embed=1' : ''));
    afficher('ecran-prep'); majPrep(); majReprise();
  });
  function erreurRejoindre(msg) { const e = $('#erreur-rejoindre'); e.textContent = msg; e.hidden = !msg; }
  $('#form-rejoindre').addEventListener('submit', (e) => {
    e.preventDefault();
    const info = decoder($('#code-rejoindre').value);
    if (!info) { erreurRejoindre('Code invalide : il compte 10 caractères, par exemple 4K7QX-9M2AB.'); return; }
    erreurRejoindre('');
    ouvrirChef(info);
  });

  /* ------------------------------------------------------------ navigation */
  function afficher(id) {
    ['ecran-prep', 'ecran-jeu', 'ecran-chef'].forEach(e => { $('#' + e).hidden = e !== id; });
    if (id !== 'ecran-jeu') { arreterSablier(); toast(null); }
    window.scrollTo(0, 0);
  }
  function majReprise() {
    const p = J.stock.lire('agents:partie', null);
    const ok = p && p.cartes && !p.fin;
    $('#reprise').hidden = !ok;
    if (ok) {
      const vus = p.cartes.filter(c => c.revele).length;
      $('#reprise-info').textContent = `Partie ${p.code} · ${vus} carte${vus > 1 ? 's' : ''} révélée${vus > 1 ? 's' : ''} · tour : ${p.noms[p.tour]}.`;
    }
  }

  $('#btn-creer').addEventListener('click', () => nouvellePartie(matiere.sections(), tailleChoisie));
  $('#btn-reprendre').addEventListener('click', () => { P = J.stock.lire('agents:partie', null); if (P) ouvrirPlateau(); });
  $('#btn-abandonner').addEventListener('click', () => { J.stock.effacer('agents:partie'); majReprise(); });
  $('#plateau').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) reveler(parseInt(b.dataset.i, 10)); });
  $('#btn-fin-tour').addEventListener('click', () => passerTour('arrêt volontaire'));
  $('#form-indice').addEventListener('submit', (e) => {
    e.preventDefault();
    const mot = $('#indice-mot').value.trim();
    if (!mot) { $('#indice-mot').focus(); return; }
    annoncerIndice(mot, $('#indice-nb').value);
    $('#indice-mot').value = '';
  });
  $('#btn-cle').addEventListener('click', ouvrirCle);
  $('#btn-notions').addEventListener('click', ouvrirNotions);
  $('#btn-nouvelle').addEventListener('click', () => {
    if (P && !P.fin && P.cartes.some(c => c.revele) && !confirm('Commencer une nouvelle partie avec la même matière ? La partie en cours sera perdue.')) return;
    nouvellePartie(P.sections, P.taille);
  });
  $('#btn-menu').addEventListener('click', () => { afficher('ecran-prep'); majPrep(); majReprise(); });
  $('#banniere').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'cle') { P.fin.cleVisible = true; sauver(); dessinerPlateau(); majTour(); }
    else if (b.dataset.act === 'notions') ouvrirNotions();
    else nouvellePartie(P.sections, P.taille);
  });

  const aide = J.boite('aide');
  $('#btn-aide').addEventListener('click', aide.ouvrir);
  $('#btn-aide-2').addEventListener('click', aide.ouvrir);
  J.pleinEcran($('#btn-plein-ecran'));
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '?') { aide.ouvrir(); e.preventDefault(); }
    else if ((e.key === 'z' || e.key === 'Z') && annulation && !$('#ecran-jeu').hidden) annuler();
  });

  /* ------------------------------------------------------------ démarrage */
  majPrep();
  majReprise();
  const codeChef = J.PARAMS.get('chef');
  if (codeChef) {
    const info = decoder(codeChef);
    if (info) ouvrirChef(info);
    else erreurRejoindre('Le code de la clé dans l’adresse est invalide.');
  }

  // pour les tests : window.AgentsEpsilon
  window.AgentsEpsilon = { encoder, decoder, grille, reserve, TAILLES, VERSION };
})();
