/* =============================================================================
   Preuves à trous — MPU1054 (UQTR)
   Moteur générique : une démonstration dont certains morceaux sont des blancs,
   chaque blanc étant un menu d'options (vraies et fausses). Les preuves sont
   décrites dans preuves/<id>.js (voir README.md) et listées dans
   preuves/catalogue.js. Mathématiques rendues par KaTeX (vendor/katex).

   Adresse : index.html?preuve=<id>. Le rendu KaTeX, le mode professeur (mot de
   passe, prof.js), la boîte d'aide, l'icône ☰ de la barre et le chargement des
   fichiers d'activités sont dans commun.js (window.PreuvesCommun), partagé avec
   ordre.js (démonstrations à remettre en ordre).
   ============================================================================= */
(function () {
  'use strict';

  const C = window.PreuvesCommun;
  const { rendreTexte, echapper } = C;

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
    get modeProf() { return C.prof.actif; },
    menuBlanc: null,     // blanc dont le menu est ouvert
  };

  const $ = (sel) => document.querySelector(sel);

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
    C.brancherAide();
    document.addEventListener('keydown', clavierMenu);
    window.addEventListener('beforeprint', preparerImpression);
  }

  function demarrer() {
    C.brancherBarre();
    C.brancherProf(() => { if (etat.preuve) majBoutons(); });
    C.demarrer('trous').then(p => {
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
