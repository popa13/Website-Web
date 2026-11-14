/* =============================================================================
   Pages d'application (Sommes de Riemann et de Darboux, Réarranger une série,
   Convergence simple et uniforme…) : l'application est intégrée dans la page,
   dans un <div class="app-cadre"><iframe …?embed=1></iframe></div>.

   - « Mode d'emploi » (<details class="app-aide">) se déroule au lieu d'apparaître d'un coup ;
   - le bouton « Plein écran » (data-plein-ecran="<id de l'iframe>") met l'application en plein écran ;
   - les applications qui défilent comme une page (cadre « contenu ») annoncent leur
     hauteur par postMessage ({ type: 'mathopo:hauteur', hauteur }) et le cadre la suit.
   Chargé par templates/base-v3.html sur les pages « wide: true ».
   ============================================================================= */
(function () {
  'use strict';

  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Mode d'emploi qui se déroule
  document.querySelectorAll('details.app-aide').forEach(function (details) {
    var sommaire = details.querySelector('summary');
    var contenu = details.querySelector('.app-aide-contenu');
    if (!sommaire || !contenu || reduit || !contenu.animate) return;
    var anim = null, ouvert = details.open;     // ouvert : l'état affiché ou vers lequel on anime
    sommaire.addEventListener('click', function (e) {
      e.preventDefault();
      // hauteur affichée en ce moment (une animation peut être en cours)
      var depart = details.open ? contenu.getBoundingClientRect().height : 0;
      if (anim) anim.cancel();
      ouvert = !ouvert;
      if (ouvert) {
        details.open = true;
        anim = contenu.animate([{ height: depart + 'px', opacity: depart ? 1 : 0 }, { height: contenu.scrollHeight + 'px', opacity: 1 }],
                               { duration: 280, easing: 'ease-out' });
        anim.onfinish = function () { anim = null; };
      } else {
        anim = contenu.animate([{ height: depart + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
                               { duration: 200, easing: 'ease-in' });
        anim.onfinish = function () { details.open = false; anim = null; };
      }
    });
  });

  // 2. Plein écran (absent sur les téléphones qui ne le permettent pas pour un cadre)
  document.querySelectorAll('[data-plein-ecran]').forEach(function (bouton) {
    var cadre = document.getElementById(bouton.getAttribute('data-plein-ecran'));
    var demander = cadre && (cadre.requestFullscreen || cadre.webkitRequestFullscreen);
    if (!demander) return;
    bouton.hidden = false;
    bouton.addEventListener('click', function () {
      demander.call(cadre);
      try { cadre.contentWindow.focus(); } catch (_) { /* autre origine */ }
    });
  });

  // 3. Hauteur des applications qui défilent comme une page : toujours pour un cadre
  //    « contenu » ; pour un cadre « ecran » marqué data-hauteur-etroit, seulement quand
  //    le cadre est étroit (l'application passe alors en une colonne qui défile).
  var ETROIT = 900;
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.type !== 'mathopo:hauteur' || !(d.hauteur > 0)) return;
    document.querySelectorAll('.app-cadre iframe').forEach(function (f) {
      if (f.contentWindow !== e.source) return;
      var cadre = f.parentElement;
      if (cadre.classList.contains('contenu')) {
        f.style.height = Math.ceil(d.hauteur) + 'px';
      } else if (cadre.hasAttribute('data-hauteur-etroit')) {
        f.style.height = f.clientWidth <= ETROIT ? Math.ceil(d.hauteur) + 'px' : '';
      }
    });
  });
})();
