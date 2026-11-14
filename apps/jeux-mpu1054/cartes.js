/* =============================================================================
   Cartes mémoire — MPU1054 (UQTR)

   Préparation (matière, types de cartes, mode), séance de révision (cartes à
   retourner, auto-évaluation en trois niveaux, niveaux de maîtrise mémorisés dans
   le navigateur) et défi éclair (un énoncé, quatre noms, chrono, séries, record).
   Dépend de notions.js et commun.js.
   ============================================================================= */
(function () {
  'use strict';

  const J = window.Jeux, B = J.B, $ = J.$, $$ = J.$$;
  const NIVEAU_MAITRISE = 3, NIVEAU_MAX = 5;

  /* ------------------------------------------------------------ niveaux mémorisés */
  let niveaux = J.stock.lire('cartes:niveaux', {}) || {};
  const niveau = (id) => niveaux[id] || 0;
  function fixerNiveau(id, n) {
    niveaux[id] = Math.max(0, Math.min(NIVEAU_MAX, n));
    J.stock.ecrire('cartes:niveaux', niveaux);
  }
  let records = J.stock.lire('cartes:records', {}) || {};

  /* ------------------------------------------------------------ préparation */
  const choix = {
    mode: () => $('input[name=mode]:checked').value,
    sens: () => $('input[name=sens]:checked').value,
    ordre: () => $('input[name=ordre]:checked').value,
    nbq: () => parseInt($('input[name=nbq]:checked').value, 10),
    temps: () => parseInt($('input[name=temps]:checked').value, 10),
    categories: () => $$('#types input:checked').map(i => i.value),
    annexe: () => $('#opt-annexe').checked,
  };

  const matiere = J.selecteurMatiere($('#matiere'), {
    cle: 'cartes:matiere',
    compter: (secs) => {
      const n = J.notions({ sections: secs, categories: choix.categories(), annexe: choix.annexe() }).length;
      return n + (n > 1 ? ' cartes' : ' carte');
    },
    auChangement: () => majPrep(),
  });

  function selection() {
    return J.notions({ sections: matiere.sections(), categories: choix.categories(), annexe: choix.annexe() });
  }

  function majPrep() {
    const secs = matiere.sections();
    // nombres par type
    ['def', 'res', 'ex'].forEach(c => {
      const n = J.notions({ sections: secs, categories: [c], annexe: choix.annexe() }).length;
      $(`[data-n=${c}]`).textContent = `(${n})`;
    });
    $('#matiere .matiere-compte').textContent = (() => {
      const n = selection().length;
      return n + (n > 1 ? ' cartes' : ' carte');
    })();
    const mode = choix.mode();
    $('#options-revision').hidden = mode !== 'revision';
    $('#options-defi').hidden = mode !== 'defi';
    const n = selection().length;
    const bouton = $('#btn-commencer'), note = $('#note-depart');
    if (!n) {
      bouton.disabled = true;
      note.innerHTML = '<span class="avertissement">Choisissez au moins une section et un type de cartes.</span>';
    } else if (mode === 'defi' && n < 4) {
      bouton.disabled = true;
      note.innerHTML = '<span class="avertissement">Le défi éclair demande au moins 4 cartes.</span>';
    } else {
      bouton.disabled = false;
      const nb = mode === 'defi' ? Math.min(choix.nbq() || n, n) : n;
      note.textContent = mode === 'defi'
        ? `${nb} question${nb > 1 ? 's' : ''} sur ${J.resumeSections(secs)}.`
        : `${n} carte${n > 1 ? 's' : ''} : ${J.resumeSections(secs)}.`;
    }
    majProgres();
  }

  function majProgres() {
    const secs = matiere.sections();
    const liste = $('#progres');
    const lignes = B.SECTIONS.filter(x => secs.includes(x.s)).map(x => {
      const cartes = J.notions({ sections: [x.s], categories: choix.categories(), annexe: choix.annexe() });
      if (!cartes.length) return '';
      const sues = cartes.filter(c => niveau(c.id) >= NIVEAU_MAITRISE).length;
      const cours = cartes.filter(c => niveau(c.id) > 0 && niveau(c.id) < NIVEAU_MAITRISE).length;
      const p = (k) => (100 * k / cartes.length).toFixed(1) + '%';
      return `<li title="${J.echapper(x.titre)} : ${sues} maîtrisée(s), ${cours} en cours, sur ${cartes.length}">
        <span class="num">${x.s}</span>
        <span class="jauge"><i class="j-sue" style="width:${p(sues)}"></i><i class="j-cours" style="width:${p(cours)}"></i></span>
        <span class="pct">${sues}/${cartes.length}</span></li>`;
    }).join('');
    liste.innerHTML = lignes || '<li><span></span><span class="aide-texte">Aucune section choisie.</span></li>';
    const r = records[cleRecord()];
    $('#record').textContent = r ? `Record du défi éclair pour ce choix : ${r.toLocaleString('fr-CA')} points.` : '';
  }

  function cleRecord() {
    return [matiere.sections().join(','), choix.categories().join(','), choix.annexe() ? 'a' : '', choix.nbq(), choix.temps()].join('|');
  }

  $$('#types input, #opt-annexe, input[name=mode], input[name=nbq], input[name=temps]').forEach(i => i.addEventListener('change', majPrep));
  $('#btn-reinit').addEventListener('click', () => {
    if (!confirm('Effacer les niveaux de maîtrise de toutes les cartes et les records du défi ?')) return;
    niveaux = {}; records = {};
    J.stock.effacer('cartes:niveaux'); J.stock.effacer('cartes:records');
    majPrep();
  });
  $('#btn-commencer').addEventListener('click', () => {
    const cartes = selection();
    if (choix.mode() === 'defi') demarrerDefi(cartes);
    else demarrerRevision(cartes);
  });

  // mode demandé dans l'adresse
  if (J.PARAMS.get('mode') === 'defi') $('input[name=mode][value=defi]').checked = true;

  function afficher(id) {
    ['ecran-prep', 'ecran-revision', 'ecran-defi', 'ecran-bilan'].forEach(e => { $('#' + e).hidden = e !== id; });
    window.scrollTo(0, 0);
    if (id !== 'ecran-defi') arreterChrono();
  }

  /* ------------------------------------------------------------ rendu des faces */
  function classeType(n) { return 't-' + ({ def: 'definition', res: 'resultat', ex: 'exemple' }[J.CATEGORIE[n.type]]); }
  function badges(n, avecNumero) {
    const sec = J.section(n.s);
    const pts = Array.from({ length: NIVEAU_MAITRISE }, (_, k) => `<i class="${niveau(n.id) > k ? 'on' : ''}"></i>`).join('');
    return `<div class="badges">
      <span class="badge" title="${J.echapper(sec.titre)}">Section ${n.s}</span>
      <span class="badge type">${avecNumero ? J.etiquette(n) : J.NOM_TYPE[n.type]}</span>
      ${n.annexe ? '<span class="badge annexe">Annexe</span>' : ''}
      <span class="badge niveau" title="Niveau de maîtrise : ${Math.min(niveau(n.id), NIVEAU_MAITRISE)} sur ${NIVEAU_MAITRISE}">${pts}</span>
    </div>`;
  }
  function consigne(n) {
    return { definition: 'Énoncez la définition.', exemple: 'Que montre cet exemple ?' }[n.type] ||
      `Énoncez ${n.type === 'lemme' ? 'le lemme' : n.type === 'corollaire' ? 'le corollaire' : 'le théorème'}.`;
  }
  function question(n) {
    return n.type === 'exemple' ? 'Quel est cet exemple ?' : n.type === 'definition' ? 'Quelle notion cette définition introduit-elle ?' : 'De quel résultat s’agit-il ?';
  }

  /* ------------------------------------------------------------ séance de révision */
  let seance = null;

  function demarrerRevision(cartes, opts) {
    opts = opts || {};
    let ordre = cartes.slice();
    const o = opts.ordre || choix.ordre();
    if (o === 'melange') ordre = J.melanger(ordre);
    else if (o === 'faibles') ordre = J.melanger(ordre).sort((a, b) => niveau(a.id) - niveau(b.id));
    seance = {
      file: ordre.map(c => c.id), cartes: new Map(cartes.map(c => [c.id, c])),
      total: cartes.length, sues: 0, notes: {}, debut: Date.now(), retournees: 0,
      sens: opts.sens || choix.sens(), sensCarte: {}, courante: null, retournee: false,
      sections: matiere.sections(),
    };
    afficher('ecran-revision');
    montrerCarte();
  }

  function montrerCarte() {
    const s = seance;
    if (!s.file.length) { bilanRevision(); return; }
    const id = s.file[0], n = s.cartes.get(id);
    s.courante = n; s.retournee = false;
    if (!(id in s.sensCarte)) s.sensCarte[id] = s.sens === 'hasard' ? (Math.random() < 0.5 ? 'nom' : 'enonce') : s.sens;
    const sens = s.sensCarte[id];
    const carte = $('#carte');
    carte.classList.remove('retournee');
    carte.className = 'carte3d ' + classeType(n);
    void carte.offsetWidth;
    carte.classList.add('entree');
    const recto = $('#recto'), verso = $('#verso');
    if (sens === 'nom') {
      recto.innerHTML = `${badges(n, true)}
        <div class="milieu"><p class="nom-grand">${J.rendre(n.nom)}</p><p class="consigne">${consigne(n)}</p></div>
        <p class="indice-tourner">Touchez la carte ou appuyez sur Espace pour la retourner.</p>`;
    } else {
      recto.innerHTML = `${badges(n, false)}
        <div class="enonce-question"><p class="question-titre">${question(n)}</p>
        <div class="enonce">${J.rendre(n.enonce, { masquer: true })}</div></div>
        <p class="indice-tourner">Touchez la carte ou appuyez sur Espace pour la retourner.</p>`;
    }
    verso.innerHTML = `${badges(n, true)}<p class="nom-petit">${J.rendre(n.nom)}</p><div class="enonce">${J.rendre(n.enonce)}</div>`;
    recto.setAttribute('aria-hidden', 'false'); verso.setAttribute('aria-hidden', 'true');
    $('#act-retourner').hidden = false; $('#act-noter').hidden = true;
    const fait = s.total - s.file.length;
    $('#rev-info').innerHTML = `Carte ${Math.min(fait + 1, s.total)} sur ${s.total} <small>· ${s.file.length} restante${s.file.length > 1 ? 's' : ''} · ${J.resumeSections(s.sections)}</small>`;
    $('#rev-prog').style.width = (100 * s.sues / s.total) + '%';
  }

  function retourner(vers) {
    const s = seance;
    if (!s || !s.courante) return;
    const r = vers === undefined ? !s.retournee : vers;
    s.retournee = r;
    $('#carte').classList.remove('entree');
    $('#carte').classList.toggle('retournee', r);
    $('#recto').setAttribute('aria-hidden', r ? 'true' : 'false');
    $('#verso').setAttribute('aria-hidden', r ? 'false' : 'true');
    if (r) {
      s.retournees++;
      $('#act-retourner').hidden = true; $('#act-noter').hidden = false;
      $('#carte').setAttribute('aria-label', 'Revenir au recto de la carte');
    } else {
      $('#carte').setAttribute('aria-label', 'Retourner la carte');
    }
  }

  function noter(note) {
    const s = seance;
    if (!s || !s.retournee) return;
    const id = s.file.shift();
    (s.notes[id] = s.notes[id] || []).push(note);
    if (note === 3) {
      fixerNiveau(id, niveau(id) + 1);
      s.sues++;
    } else if (note === 2) {
      fixerNiveau(id, niveau(id) - 1);
      s.file.push(id);
    } else {
      fixerNiveau(id, niveau(id) - 2);
      s.file.splice(Math.min(3, s.file.length), 0, id);
    }
    montrerCarte();
  }

  function bilanRevision() {
    const s = seance;
    const ids = Object.keys(s.notes);
    const premierCoup = ids.filter(id => s.notes[id][0] === 3).length;
    const resistantes = ids.filter(id => s.notes[id].some(x => x < 3));
    const finie = !s.file.length;
    if (finie && s.total >= 5) J.confettis();
    const liste = resistantes.map(id => {
      const n = s.cartes.get(id), nb = s.notes[id].filter(x => x < 3).length;
      return `<li><details><summary><span class="marque ko">↺</span><span>${J.rendre(n.nom)}</span>
        <span class="meta">${J.etiquette(n)} · ${nb} fois à revoir</span></summary>
        <div class="corps texte-enonce">${J.rendre(n.enonce)}</div></details></li>`;
    }).join('');
    $('#bilan').innerHTML = `
      <h2>${finie ? 'Séance terminée, bravo !' : 'Séance interrompue'}</h2>
      <p>${J.resumeSections(s.sections).replace(/^./, c => c.toUpperCase())}.</p>
      <div class="stats">
        <div class="stat"><b>${s.sues}/${s.total}</b><span>cartes sues</span></div>
        <div class="stat"><b>${ids.length ? Math.round(100 * premierCoup / ids.length) : 0}&nbsp;%</b><span>sues du premier coup</span></div>
        <div class="stat"><b>${resistantes.length}</b><span>cartes à retravailler</span></div>
        <div class="stat"><b>${J.duree(Date.now() - s.debut)}</b><span>durée de la séance</span></div>
      </div>
      ${resistantes.length ? `<h3>Les cartes qui vous ont résisté</h3><ul class="liste-revue">${liste}</ul>` : ''}
      <div class="boutons">
        ${resistantes.length ? '<button class="btn primaire" data-act="resistantes" type="button">Réviser ces cartes</button>' : ''}
        ${!finie ? '<button class="btn primaire" data-act="reprendre" type="button">Reprendre la séance</button>' : ''}
        <button class="btn" data-act="defi" type="button">Défi éclair sur cette matière</button>
        <button class="btn" data-act="prep" type="button">Changer la matière</button>
      </div>`;
    $('#bilan').onclick = (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'resistantes') demarrerRevision(resistantes.map(id => s.cartes.get(id)), { ordre: 'melange', sens: s.sens });
      else if (act === 'reprendre') { afficher('ecran-revision'); montrerCarte(); }
      else if (act === 'defi') {
        const cartes = selection();
        if (cartes.length >= 4) demarrerDefi(cartes); else { afficher('ecran-prep'); majPrep(); }
      } else { afficher('ecran-prep'); majPrep(); }
    };
    afficher('ecran-bilan');
  }

  $('#carte').addEventListener('click', (e) => { if (!e.target.closest('a, summary')) retourner(); });
  $('#btn-retourner').addEventListener('click', () => retourner(true));
  $$('.note-btn').forEach(b => b.addEventListener('click', () => noter(parseInt(b.dataset.note, 10))));
  $('#rev-quitter').addEventListener('click', () => bilanRevision());
  $('#rev-melanger').addEventListener('click', () => {
    if (!seance || seance.file.length < 2) return;
    const [premier, ...reste] = seance.file;
    seance.file = [premier, ...J.melanger(reste)];
  });

  /* ------------------------------------------------------------ défi éclair */
  let defi = null, chrono = null;

  function demarrerDefi(cartes) {
    const nb = choix.nbq() ? Math.min(choix.nbq(), cartes.length) : cartes.length;
    const questions = J.melanger(cartes).slice(0, nb).map(n => ({ n, options: options(n, cartes) }));
    defi = {
      questions, k: 0, score: 0, serie: 0, meilleureSerie: 0, reponses: [], temps: choix.temps(),
      sections: matiere.sections(), cle: cleRecord(), debut: Date.now(), cartes,
    };
    afficher('ecran-defi');
    poserQuestion();
  }

  // trois noms différents du bon, de préférence du même type, puis du même chapitre
  function options(n, pool) {
    const nomBrut = (x) => J.brut(x.nom).toLowerCase();
    const deja = new Set([nomBrut(n)]);
    const choisis = [];
    const essayer = (liste) => {
      J.melanger(liste).forEach(x => {
        if (choisis.length >= 3 || x.id === n.id || deja.has(nomBrut(x))) return;
        deja.add(nomBrut(x)); choisis.push(x);
      });
    };
    const cat = J.CATEGORIE[n.type], ch = n.s.split('.')[0];
    essayer(pool.filter(x => J.CATEGORIE[x.type] === cat));
    essayer(pool);
    essayer(B.NOTIONS.filter(x => x.s.split('.')[0] === ch && J.CATEGORIE[x.type] === cat));
    essayer(B.NOTIONS);
    return J.melanger([n, ...choisis]);
  }

  function poserQuestion() {
    const d = defi, q = d.questions[d.k];
    d.repondu = false;
    $('#defi-q').textContent = `Question ${d.k + 1} sur ${d.questions.length}`;
    $('#defi-score').textContent = d.score.toLocaleString('fr-CA') + ' pts';
    majSerie();
    const zone = $('#defi-question');
    zone.className = 'defi-question ' + classeType(q.n);
    zone.innerHTML = `<p class="question-titre">${q.n.type === 'exemple' ? 'Quel est cet exemple ?' : 'Quel est le nom de cet énoncé ?'}
      <span class="badge type" style="margin-left:.4em">${J.NOM_TYPE[q.n.type]}</span></p>
      <div class="texte-enonce">${J.rendre(q.n.enonce, { masquer: true })}</div>`;
    zone.scrollTop = 0;
    $('#defi-choix').innerHTML = q.options.map((o, i) =>
      `<button type="button" data-i="${i}"><span class="lettre">${'ABCD'[i]}</span><span>${J.rendre(o.nom)}</span></button>`).join('');
    $('#defi-retro').textContent = ''; $('#defi-retro').className = 'retro';
    $('#defi-suivante').hidden = true;
    demarrerChrono();
  }

  function majSerie() {
    const s = $('#defi-serie'), d = defi;
    s.hidden = d.serie < 2;
    s.textContent = `Série de ${d.serie}` + (multiplicateur() > 1 ? ` · ×${String(multiplicateur()).replace('.', ',')}` : '');
    s.classList.toggle('chaude', d.serie >= 3);
  }
  const multiplicateur = () => defi.serie >= 5 ? 2 : defi.serie >= 3 ? 1.5 : 1;

  function demarrerChrono() {
    arreterChrono();
    const d = defi, barre = $('#defi-chrono-barre'), boite = $('#defi-chrono');
    boite.hidden = !d.temps;
    if (!d.temps) { d.t0 = performance.now(); return; }
    d.t0 = performance.now();
    const T = d.temps * 1000;
    (function image(t) {
      const reste = Math.max(0, 1 - (t - d.t0) / T);
      barre.style.transform = `scaleX(${reste})`;
      boite.classList.toggle('urgent', reste < 0.25);
      if (reste <= 0) { repondre(-1); return; }
      chrono = requestAnimationFrame(image);
    })(d.t0);
  }
  function arreterChrono() { if (chrono) cancelAnimationFrame(chrono); chrono = null; }

  function repondre(i) {
    const d = defi;
    if (!d || d.repondu) return;
    d.repondu = true;
    arreterChrono();
    const q = d.questions[d.k], ecoule = performance.now() - d.t0;
    const bonne = q.options.findIndex(o => o.id === q.n.id);
    const juste = i === bonne;
    const boutons = $$('#defi-choix button');
    boutons.forEach(b => { b.disabled = true; });
    boutons[bonne].classList.add('juste');
    let gain = 0;
    if (juste) {
      d.serie++; d.meilleureSerie = Math.max(d.meilleureSerie, d.serie);
      const bonus = d.temps ? Math.round(100 * Math.max(0, 1 - ecoule / (d.temps * 1000))) : 50;
      gain = Math.round((100 + bonus) * multiplicateur());
      d.score += gain;
      volPoints('+' + gain, boutons[bonne]);
      $('#defi-retro').textContent = ['Bravo !', 'Exact !', 'Bien vu !', 'Parfait !'][d.k % 4];
      $('#defi-retro').className = 'retro ok';
    } else {
      d.serie = 0;
      if (i >= 0) boutons[i].classList.add('faux');
      $('#defi-retro').innerHTML = (i < 0 ? 'Temps écoulé ! ' : 'Pas tout à fait. ') + 'La bonne réponse est en vert.';
      $('#defi-retro').className = 'retro ko';
    }
    d.reponses.push({ n: q.n, juste, choisi: i >= 0 ? q.options[i] : null, gain, temps: ecoule });
    // l'énoncé complet (termes définis visibles) une fois la réponse donnée
    $('#defi-question .texte-enonce').innerHTML = J.rendre(q.n.enonce);
    $('#defi-score').textContent = d.score.toLocaleString('fr-CA') + ' pts';
    majSerie();
    $('#defi-suivante').hidden = false;
    $('#defi-suivante').textContent = d.k + 1 < d.questions.length ? 'Question suivante' : 'Voir le résultat';
    $('#defi-suivante').focus({ preventScroll: true });
  }

  function volPoints(texte, pres) {
    const r = pres.getBoundingClientRect(), el = document.createElement('div');
    el.className = 'points-vol'; el.textContent = texte;
    el.style.left = (r.left + r.width / 2 - 20) + 'px'; el.style.top = (r.top - 10) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  function suivante() {
    const d = defi;
    if (!d || !d.repondu) return;
    d.k++;
    if (d.k < d.questions.length) poserQuestion(); else bilanDefi();
  }

  function bilanDefi() {
    const d = defi;
    arreterChrono();
    const justes = d.reponses.filter(r => r.juste).length;
    const ancien = records[d.cle] || 0, nouveau = d.reponses.length === d.questions.length && d.score > ancien;
    if (nouveau) { records[d.cle] = d.score; J.stock.ecrire('cartes:records', records); }
    if (nouveau || justes === d.questions.length) J.confettis();
    const erreurs = d.reponses.filter(r => !r.juste);
    const liste = d.reponses.map(r => `<li><details><summary>
        <span class="marque ${r.juste ? 'ok' : 'ko'}">${r.juste ? '✓' : '✗'}</span><span>${J.rendre(r.n.nom)}</span>
        <span class="meta">${r.juste ? '+' + r.gain : r.choisi ? 'vous : ' + J.rendre(r.choisi.nom) : 'temps écoulé'}</span></summary>
        <div class="corps"><p class="aide-texte" style="margin-top:0">${J.etiquette(r.n)} · section ${r.n.s}</p><div class="texte-enonce">${J.rendre(r.n.enonce)}</div></div></details></li>`).join('');
    const tm = d.reponses.length ? d.reponses.reduce((t, r) => t + r.temps, 0) / d.reponses.length : 0;
    $('#bilan').innerHTML = `
      <h2>${nouveau ? 'Nouveau record !' : justes === d.questions.length ? 'Sans faute !' : 'Défi terminé'}</h2>
      <p>${J.resumeSections(d.sections).replace(/^./, c => c.toUpperCase())}.</p>
      <div class="grand-chiffre">${d.score.toLocaleString('fr-CA')} pts</div>
      <p class="aide-texte">${ancien && !nouveau ? `Record pour ce choix : ${ancien.toLocaleString('fr-CA')} points.` : nouveau && ancien ? `Ancien record : ${ancien.toLocaleString('fr-CA')} points.` : ''}</p>
      <div class="stats">
        <div class="stat"><b>${justes}/${d.questions.length}</b><span>bonnes réponses</span></div>
        <div class="stat"><b>${d.meilleureSerie}</b><span>meilleure série</span></div>
        <div class="stat"><b>${(tm / 1000).toFixed(1).replace('.', ',')}&nbsp;s</b><span>temps moyen par question</span></div>
      </div>
      <h3>Les questions</h3>
      <ul class="liste-revue">${liste}</ul>
      <div class="boutons">
        <button class="btn primaire" data-act="rejouer" type="button">Rejouer</button>
        ${erreurs.length ? '<button class="btn" data-act="erreurs" type="button">Réviser mes erreurs</button>' : ''}
        <button class="btn" data-act="prep" type="button">Changer la matière</button>
      </div>`;
    $('#bilan').onclick = (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'rejouer') demarrerDefi(d.cartes);
      else if (b.dataset.act === 'erreurs') demarrerRevision(erreurs.map(r => r.n), { ordre: 'melange', sens: 'nom' });
      else { afficher('ecran-prep'); majPrep(); }
    };
    afficher('ecran-bilan');
  }

  $('#defi-choix').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]');
    if (b) repondre(parseInt(b.dataset.i, 10));
  });
  $('#defi-suivante').addEventListener('click', suivante);
  $('#defi-quitter').addEventListener('click', () => {
    if (defi && defi.reponses.length) bilanDefi(); else { afficher('ecran-prep'); majPrep(); }
  });

  /* ------------------------------------------------------------ clavier, aide */
  const aide = J.boite('aide');
  $('#btn-aide').addEventListener('click', aide.ouvrir);
  $('#btn-aide-2').addEventListener('click', aide.ouvrir);
  J.pleinEcran($('#btn-plein-ecran'));

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (aide.ouverte) return;
    if (e.key === '?') { aide.ouvrir(); e.preventDefault(); return; }
    if (!$('#ecran-revision').hidden && seance) {
      if (e.key === ' ' || (e.key === 'Enter' && document.activeElement === $('#carte'))) {
        if (!e.target.matches('button') || e.target === $('#btn-retourner')) { retourner(); e.preventDefault(); }
      } else if (e.key === 'ArrowLeft' && seance.retournee) retourner(false);
      else if (['1', '2', '3'].includes(e.key) && seance.retournee) noter(parseInt(e.key, 10));
    } else if (!$('#ecran-defi').hidden && defi) {
      const k = e.key.toUpperCase();
      const i = ['1', '2', '3', '4'].indexOf(k) >= 0 ? parseInt(k, 10) - 1 : 'ABCD'.indexOf(k);
      if (i >= 0 && !defi.repondu) { repondre(i); e.preventDefault(); }
      else if (e.key === 'Enter' && defi.repondu) { suivante(); e.preventDefault(); }
    }
  });

  majPrep();
})();
