/* =============================================================================
   Verdelune dans la page verdelune.html de mathopo.ca : bouton « Son » de la page.

   build.py insère <script src="son.js"></script> au début de la copie du jeu
   (public/apps/verdelune/index.html) ; le fichier du jeu lui-même (apps/verdelune/
   index.html, remplacé par update-verdelune.sh) n'est pas modifié.

   Le jeu fait tout son son avec un AudioContext. Ce script fait passer ce son par un
   gain que la page peut mettre à 0 (son coupé) ou à 1 : la page envoie
   { type: 'mathopo:son', son: true | false } par postMessage. Le choix est gardé dans
   localStorage ('verdelune-son'), et n'est appliqué que dans la page du site.
   ============================================================================= */
(function () {
  'use strict';
  if (window.parent === window) return;              // le jeu seul, hors de la page : rien à faire
  var Base = window.AudioContext || window.webkitAudioContext;
  if (!Base) return;

  var gains = [];
  var actif = true;
  try { actif = localStorage.getItem('verdelune-son') !== 'off'; } catch (e) { /* stockage indisponible */ }

  function appliquer(g, ctx) {
    try { g.gain.setValueAtTime(actif ? 1 : 0, ctx.currentTime); } catch (e) { g.gain.value = actif ? 1 : 0; }
  }

  // Même constructeur pour le jeu, mais ctx.destination est un gain branché sur la vraie sortie.
  function ContexteAvecSon(options) {
    var ctx = options === undefined ? new Base() : new Base(options);
    try {
      var g = ctx.createGain();
      g.connect(ctx.destination);
      appliquer(g, ctx);
      Object.defineProperty(ctx, 'destination', { configurable: true, get: function () { return g; } });
      gains.push({ g: g, ctx: ctx });
    } catch (e) { /* en cas de problème, le son reste normal */ }
    return ctx;
  }
  ContexteAvecSon.prototype = Base.prototype;
  window.AudioContext = ContexteAvecSon;
  if (window.webkitAudioContext) window.webkitAudioContext = ContexteAvecSon;

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (e.source !== window.parent || !d || d.type !== 'mathopo:son') return;
    actif = !!d.son;
    gains.forEach(function (x) { appliquer(x.g, x.ctx); });
  });
})();
