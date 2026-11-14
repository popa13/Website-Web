/* =============================================================================
   Jeux d'étude MPU1054 — utilitaires communs (Cartes mémoire et Agents ε)

   - rendu des énoncés : KaTeX avec les macros du cours, termes définis ⟦...⟧ ;
   - choix de la matière : sélecteur de sections par chapitre (« Toute la matière ») ;
   - hasard reproductible (graine), mélange, stockage local, confettis ;
   - intégration dans une page de mathopo.ca (?embed=1).

   Chargé après vendor/katex/katex.min.js et notions.js ; expose window.Jeux.
   ============================================================================= */
(function () {
  'use strict';

  const B = window.MPU1054;

  /* ------------------------------------------------------------ intégration */
  const PARAMS = new URLSearchParams(location.search);
  const INTEGRE = PARAMS.get('embed') === '1';
  if (INTEGRE) document.documentElement.classList.add('integre');

  /* ------------------------------------------------------------ KaTeX */
  // Macros des fichiers integrale-commands.tex, math-commands.tex et suites-commands.tex,
  // pour que le LaTeX des diapositives s'affiche tel quel.
  const MACROS = {
    '\\Rab': '\\mathcal{R}[a, b]',
    '\\eps': '\\varepsilon',
    '\\bR': '\\mathbb{R}', '\\bN': '\\mathbb{N}', '\\bZ': '\\mathbb{Z}', '\\bQ': '\\mathbb{Q}',
    '\\cP': '\\mathcal{P}', '\\cQ': '\\mathcal{Q}', '\\cR': '\\mathcal{R}',
    '\\pP': '\\dot{\\mathcal{P}}',
    '\\ra': '\\to', '\\rra': '\\to', '\\Ra': '\\Rightarrow',
    '\\nra': '\\nrightarrow', '\\cvu': '\\rightrightarrows',
    '\\oc': '\\left[', '\\fc': '\\right]', '\\op': '\\left(', '\\fp': '\\right)',
    '\\oa': '\\left\\{', '\\fa': '\\right\\}',
    '\\pas': '\\lVert #1 \\rVert',
    '\\SDi': 'L\\!\\left(#1 ; #2\\right)', '\\SDs': 'U\\!\\left(#1 ; #2\\right)',
    '\\SR': 'S\\!\\left(#1 ; #2\\right)',
    '\\Dx': '\\left(x_{#1} - x_{#1 - 1}\\right)',
  };

  function echapper(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function rendreMath(tex, affichage) {
    try {
      return katex.renderToString(tex, {
        displayMode: !!affichage, throwOnError: false, strict: 'ignore',
        macros: Object.assign({}, MACROS), output: 'html',
      });
    } catch (e) {
      return '<code>' + echapper(tex) + '</code>';
    }
  }

  // Typographie française hors des formules : espaces insécables avant « : ; ? ! » ».
  function typo(t) {
    return t.replace(/ ([:;?!»])/g, ' $1').replace(/« /g, '« ');
  }

  // Texte HTML avec formules $...$ / $$...$$ et termes définis ⟦...⟧.
  // masquer : remplace les termes définis par un blanc (défi éclair).
  function rendre(str, opts) {
    if (str == null) return '';
    let s = String(str);
    const masquer = opts && opts.masquer;
    s = s.replace(/⟦([^⟧]*)⟧/g, (m, x) => masquer
      ? '<span class="terme masque" title="terme masqué">   </span>'
      : '<span class="terme">' + x + '</span>');
    const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
    let sortie = '', dernier = 0, m;
    while ((m = re.exec(s))) {
      sortie += typo(s.slice(dernier, m.index));
      sortie += m[1] !== undefined ? rendreMath(m[1], true) : rendreMath(m[2], false);
      dernier = re.lastIndex;
    }
    return sortie + typo(s.slice(dernier));
  }

  // Texte brut (titres d'onglet, attributs) : formules et balises retirées.
  function brut(str) {
    return String(str == null ? '' : str).replace(/⟦|⟧/g, '').replace(/\$\$?([^$]+)\$\$?/g, '$1')
      .replace(/<[^>]+>/g, '').replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '');
  }

  /* ------------------------------------------------------------ banque */
  const NOM_TYPE = {
    definition: 'Définition', theoreme: 'Théorème', corollaire: 'Corollaire',
    lemme: 'Lemme', proposition: 'Proposition', exemple: 'Exemple',
  };
  // catégories des filtres : définitions, résultats (théorèmes, corollaires, lemmes), exemples
  const CATEGORIE = { definition: 'def', theoreme: 'res', corollaire: 'res', lemme: 'res', proposition: 'res', exemple: 'ex' };

  function etiquette(n) {
    return NOM_TYPE[n.type] + (n.num ? ' ' + n.num : '');
  }
  function section(s) { return B.SECTIONS.find(x => x.s === s); }
  function chapitre(s) { return B.CHAPITRES.find(c => c.n === String(s).split('.')[0]); }

  function notions(opts) {
    const sections = new Set(opts.sections || []);
    const cats = opts.categories ? new Set(opts.categories) : null;
    return B.NOTIONS.filter(n => sections.has(n.s) && (!cats || cats.has(CATEGORIE[n.type])) &&
      (opts.annexe !== false || !n.annexe));
  }

  // Empreinte de la banque (mots par section) : un téléphone qui aurait une version
  // différente du fichier le signale au lieu d'afficher une mauvaise clé.
  function empreinte() {
    let h = 2166136261;
    const txt = B.NOTIONS.map(n => n.s + ':' + n.id + ':' + n.mots.join('|')).join(';');
    for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h;
  }

  /* ------------------------------------------------------------ hasard */
  function generateur(graine) {
    let a = graine >>> 0;
    return function () {   // mulberry32
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function melanger(tab, alea) {
    alea = alea || Math.random;
    const t = tab.slice();
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(alea() * (i + 1));
      [t[i], t[j]] = [t[j], t[i]];
    }
    return t;
  }

  /* ------------------------------------------------------------ stockage */
  const stock = {
    lire(cle, defaut) {
      try { const v = localStorage.getItem('jeux-mpu1054:' + cle); return v == null ? defaut : JSON.parse(v); }
      catch (e) { return defaut; }
    },
    ecrire(cle, val) {
      try { localStorage.setItem('jeux-mpu1054:' + cle, JSON.stringify(val)); } catch (e) { /* stockage indisponible */ }
    },
    effacer(cle) { try { localStorage.removeItem('jeux-mpu1054:' + cle); } catch (e) { /* rien */ } },
  };

  /* ------------------------------------------------------------ sélecteur de matière */
  // conteneur : élément vide ; opts.compter(sections) -> texte du compteur ;
  // opts.auChangement(sections) ; opts.cle : clé de mémorisation du choix.
  function selecteurMatiere(conteneur, opts) {
    const choisies = new Set();
    const depuisAdresse = (PARAMS.get('s') || '').split(',').filter(s => section(s));
    const memo = stock.lire(opts.cle || 'matiere', null);
    (depuisAdresse.length ? depuisAdresse : (memo || B.SECTIONS.map(x => x.s))).forEach(s => { if (section(s)) choisies.add(s); });

    conteneur.classList.add('matiere');
    conteneur.innerHTML = `
      <div class="matiere-outils">
        <button type="button" class="puce-action" data-tout>Toute la matière</button>
        <button type="button" class="puce-action" data-rien>Effacer</button>
        <span class="matiere-compte" aria-live="polite"></span>
      </div>
      <div class="matiere-chapitres">
        ${B.CHAPITRES.map(c => `
          <fieldset class="chapitre" data-ch="${c.n}">
            <legend>
              <label class="case-chapitre"><input type="checkbox" data-ch="${c.n}">
                <span>Chapitre ${c.n}</span> <span class="chapitre-titre">${echapper(c.titre)}</span></label>
            </legend>
            <div class="puces">
              ${B.SECTIONS.filter(x => x.s.split('.')[0] === c.n).map(x => `
                <label class="puce" title="${echapper(x.titre)}">
                  <input type="checkbox" value="${x.s}">
                  <span class="puce-num">${x.s}</span><span class="puce-titre">${echapper(x.titre)}</span>
                </label>`).join('')}
            </div>
          </fieldset>`).join('')}
      </div>`;

    function maj(notifier) {
      conteneur.querySelectorAll('.puce input').forEach(i => { i.checked = choisies.has(i.value); });
      conteneur.querySelectorAll('.case-chapitre input').forEach(i => {
        const secs = B.SECTIONS.filter(x => x.s.split('.')[0] === i.dataset.ch).map(x => x.s);
        const n = secs.filter(s => choisies.has(s)).length;
        i.checked = n === secs.length;
        i.indeterminate = n > 0 && n < secs.length;
      });
      const liste = liste_();
      conteneur.querySelector('.matiere-compte').textContent = opts.compter ? opts.compter(liste) : '';
      stock.ecrire(opts.cle || 'matiere', liste);
      if (notifier && opts.auChangement) opts.auChangement(liste);
    }
    function liste_() { return B.SECTIONS.map(x => x.s).filter(s => choisies.has(s)); }

    conteneur.addEventListener('change', (e) => {
      const i = e.target;
      if (i.matches('.puce input')) { if (i.checked) choisies.add(i.value); else choisies.delete(i.value); }
      else if (i.matches('.case-chapitre input')) {
        B.SECTIONS.filter(x => x.s.split('.')[0] === i.dataset.ch).forEach(x => { if (i.checked) choisies.add(x.s); else choisies.delete(x.s); });
      }
      maj(true);
    });
    conteneur.querySelector('[data-tout]').addEventListener('click', () => { B.SECTIONS.forEach(x => choisies.add(x.s)); maj(true); });
    conteneur.querySelector('[data-rien]').addEventListener('click', () => { choisies.clear(); maj(true); });
    maj(false);

    return {
      sections: liste_,
      fixer(liste) { choisies.clear(); liste.forEach(s => choisies.add(s)); maj(true); },
      rafraichir() { maj(false); },
    };
  }

  // Résumé lisible d'une liste de sections : « toute la matière », « chapitre 1 et sections 2.1, 2.2 »,
  // « sections 1.2 à 1.5 ».
  function resumeSections(liste) {
    const tout = B.SECTIONS.map(x => x.s);
    if (!liste.length) return 'aucune section';
    if (liste.length === tout.length) return 'toute la matière';
    const chap = [], runs = [];
    B.CHAPITRES.forEach(c => {
      const secs = tout.filter(s => s.split('.')[0] === c.n);
      const pris = secs.filter(s => liste.includes(s));
      if (pris.length && pris.length === secs.length) { chap.push(c.n); return; }
      let run = [];
      secs.forEach(s => {
        if (liste.includes(s)) run.push(s);
        else { if (run.length) runs.push(run); run = []; }
      });
      if (run.length) runs.push(run);
    });
    const morceaux = runs.map(r => r.length === 1 ? r[0] : r.length === 2 ? r[0] + ', ' + r[1] : r[0] + ' à ' + r[r.length - 1]);
    const nbSec = runs.reduce((t, r) => t + r.length, 0);
    const partChap = chap.length ? (chap.length === 1 ? 'chapitre ' : 'chapitres ') + chap.join(' et ') : '';
    const partSec = morceaux.length ? (nbSec === 1 ? 'section ' : 'sections ') + morceaux.join(', ') : '';
    return [partChap, partSec].filter(Boolean).join(' et ');
  }

  /* ------------------------------------------------------------ confettis */
  function confettis(duree) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('canvas');
    c.className = 'confettis';
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = c.width = innerWidth * dpr, H = c.height = innerHeight * dpr;
    const couleurs = ['#0b7a57', '#DBA326', '#1d2b3a', '#87C4AA', '#E9C87D'];
    const parts = Array.from({ length: 160 }, () => ({
      x: W * (0.2 + 0.6 * Math.random()), y: H * 0.35 + (Math.random() - 0.5) * H * 0.1,
      vx: (Math.random() - 0.5) * 14 * dpr, vy: (-6 - Math.random() * 12) * dpr,
      r: (3 + Math.random() * 4) * dpr, a: Math.random() * Math.PI, va: (Math.random() - 0.5) * 0.3,
      c: couleurs[Math.floor(Math.random() * couleurs.length)],
    }));
    const t0 = performance.now(), T = duree || 2600;
    (function image(t) {
      const p = (t - t0) / T;
      ctx.clearRect(0, 0, W, H);
      parts.forEach(q => {
        q.vy += 0.35 * dpr; q.vx *= 0.99; q.x += q.vx; q.y += q.vy; q.a += q.va;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - p * p);
        ctx.translate(q.x, q.y); ctx.rotate(q.a); ctx.fillStyle = q.c;
        ctx.fillRect(-q.r, -q.r / 2, 2 * q.r, q.r); ctx.restore();
      });
      if (p < 1) requestAnimationFrame(image); else c.remove();
    })(t0);
  }

  /* ------------------------------------------------------------ divers */
  function $(sel, racine) { return (racine || document).querySelector(sel); }
  function $$(sel, racine) { return Array.from((racine || document).querySelectorAll(sel)); }

  function boite(id) {
    // fenêtre modale : <div class="boite" id="..." hidden> avec [data-fermer]
    const el = document.getElementById(id);
    let precedent = null;
    function fermer() { el.hidden = true; document.removeEventListener('keydown', clavier); if (precedent) precedent.focus(); }
    function clavier(e) { if (e.key === 'Escape') fermer(); }
    el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('[data-fermer]')) fermer(); });
    return {
      ouvrir() {
        precedent = document.activeElement;
        el.hidden = false;
        document.addEventListener('keydown', clavier);
        const f = el.querySelector('[autofocus], button, input');
        if (f) f.focus();
      },
      fermer,
      get ouverte() { return !el.hidden; },
    };
  }

  function pleinEcran(bouton) {
    if (!bouton) return;
    const el = document.documentElement;
    const demander = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!demander || INTEGRE) { bouton.hidden = true; return; }
    bouton.addEventListener('click', () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else demander.call(el);
    });
  }

  function duree(ms) {
    const s = Math.round(ms / 1000), m = Math.floor(s / 60);
    return m ? `${m} min ${String(s % 60).padStart(2, '0')} s` : `${s} s`;
  }

  window.Jeux = {
    B, PARAMS, INTEGRE, MACROS, rendre, rendreMath, brut, echapper, typo,
    NOM_TYPE, CATEGORIE, etiquette, section, chapitre, notions, empreinte,
    generateur, melanger, stock, selecteurMatiere, resumeSections, confettis,
    $, $$, boite, pleinEcran, duree,
  };
})();
