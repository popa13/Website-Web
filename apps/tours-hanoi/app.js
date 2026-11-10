/* =============================================================================
   Les tours de Hanoï — application interactive (UQTR)
   Application autonome (HTML/CSS/JS), sans dépendance externe : il suffit
   d'ouvrir index.html dans un navigateur. Le calcul est dans hanoi-core.js.

   Paramètres d'adresse : ?lang=fr|en  ?n=1..15 (disques)  ?p=3..10 (tiges)
                          ?theme=caisses  ?test=1 (tests automatiques)
                          ?reponses=1 (mode enseignant : affiche les nombres
                          minimaux de coups ; sinon, les élèves remplissent
                          eux-mêmes le tableau « Combien de coups ? »)
   ============================================================================= */
'use strict';

(function () {
  const H = window.HanoiNoyau;
  const MODE_TEST = /[?&]test=1\b/.test(location.search);
  const MODE_REPONSES = /[?&]reponses=1\b/.test(location.search);
  document.body.classList.toggle('reponses', MODE_REPONSES);
  if (MODE_TEST) {
    window.addEventListener('error', (e) => {
      const pre = document.getElementById('tests') || document.body.appendChild(Object.assign(document.createElement('pre'), { id: 'tests' }));
      pre.textContent += '\nERREUR : ' + e.message + ' (ligne ' + e.lineno + ')';
    });
  }

  // ===========================================================================
  //  Couleurs de l'UQTR et constantes
  // ===========================================================================
  const C = {
    vert: '#0E8954', vertFonce: '#0B6E43', vertMoyen: '#87C4AA', vertClair: '#B7DCCC',
    or: '#DBA326', orFonce: '#9C7310', orMoyen: '#E9C87D', orClair: '#F2DFB3',
    rouge: '#B23B2A', texte: '#1C1C1A', texte2: '#63625B', bord: '#E3E1D8',
    fantome: '#DCDAD1', bois: '#CC9034', boisFonce: '#734D26', chariot: '#4D4D4D',
  };
  const POLICE_UI = '"Carlito","Calibri","Segoe UI","Helvetica Neue",Arial,sans-serif';
  const POLICE_MATH = '"Latin Modern Roman","STIX Two Text","Cambria","Georgia","Times New Roman",serif';
  const LETTRES = 'ABCDEFGHIJ';
  const VITESSES = [0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1000];   // coups par seconde
  const PENTATONIQUE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24, 27, 29, 31, 34];
  const REDUIT = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const CLE_RECORDS = 'tours-hanoi.records.v1';
  const CLE_ESSAIS = 'tours-hanoi.essais.v1';
  const ESSAIS_SOLUTION = 5;   // essais terminés avant que le bouton « Solution » se débloque
  const CADENAS = '<svg class="cadenas" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 7.5V5.2a3 3 0 0 1 6 0v2.3" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="3" y="7.2" width="10" height="7.3" rx="1.6" fill="currentColor"/></svg>';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ===========================================================================
  //  Langue (fr par défaut ; ?lang=en ou bouton EN/FR)
  //  Le français est le texte du HTML (capturé au démarrage) ; l'anglais est
  //  donné ici avec les mêmes clés (data-i18n, data-i18n-title, data-i18n-aria).
  //  MSG contient les chaînes produites par le code, dans les deux langues.
  // ===========================================================================
  const TRAD = {
    fr: {},
    en: {
      titre: 'The Tower of Hanoi',
      sousTitre: 'Move the whole tower to the last peg: one disk at a time, never onto a smaller disk.',
      btnAide: '?&nbsp;Help', 'title:btnAide': 'Help (key ?)',
      btnPanneau: 'Panel', 'title:btnPanneau': 'Show or hide the panel (key P)',
      btnPleinEcran: '⛶<span class="libelle">&nbsp;Full screen</span>', 'title:btnPleinEcran': 'Full screen',
      'aria:zoneJeu': 'Game board',
      'aria:plateauAria': 'Tower of Hanoi board. Keys 1 to 9 and 0: choose the starting peg, then the destination peg. Arrows and Space: move a disk.',
      hudMin: 'min.',
      btnFermer: 'Close', 'title:btnFermer': 'Close', 'aria:btnFermer': 'Close',
      btnRejouer: 'Play again',
      btnAnnuler: '↶&nbsp;Undo', 'title:btnAnnuler': 'Undo the last move (U or Ctrl+Z)',
      btnRetablir: '↷&nbsp;Redo', 'title:btnRetablir': 'Redo the undone move (Y)',
      btnIndice: 'Hint', 'title:btnIndice': 'Show the next optimal move (key H)',
      'title:btnSolution': 'Play the optimal solution (key S)',
      etiqVitesse: 'Speed',
      bandeTitre: 'Which disk moves at each move?',
      cartePartie: 'Game',
      etiqDisques: 'Disks',
      etiqTiges: 'Pegs',
      'aria:apparence': 'Look',
      themeDisques: 'Disks',
      themeCaisses: 'Crates',
      optSon: 'Sound',
      btnRecommencer: '↺&nbsp;Restart', 'title:btnRecommencer': 'Put the tower back at the start (key R)',
      noteCaisses: 'The warehouse from the talk: a forklift moves one crate at a time, and a crate is never set down on a smaller crate.',
      carteScore: 'Score',
      etiqCoups: 'Moves made',
      etiqMinimum: 'Minimum',
      etiqTemps: 'Time',
      etiqRecord: 'Your best',
      etiqEssais: 'Attempts',
      noteAide: 'Assisted game (hint or solution): it does not count in the table.',
      carteRecursivite: 'Recursion',
      carteTable: 'How many moves?',
      hudRecord: 'best',
      teaserTable: '<b>Did you know?</b> With 4 pegs, the best strategy was only proved in 2014; with 5 pegs or more, nobody knows it yet: it is an open problem!',
      faitsTable: '<li><b>3 pegs:</b> 2<sup><i>n</i></sup> − 1 moves, and one cannot do better (Lucas, 1883).</li>'
        + '<li><b>4 pegs:</b> the strategy of Frame and Stewart (1941), proved optimal by Thierry Bousch in 2014.</li>'
        + '<li><b>5 pegs or more:</b> is the same strategy optimal? This is the Frame–Stewart conjecture, still an <b>open problem</b>.</li>',
      pied: 'The Tower of Hanoi · UQTR · P.-O. Parisé · 2026',
      aide: '<h2>The Tower of Hanoi</h2>'
        + '<p>The puzzle published by Édouard Lucas in 1883. A tower of disks is stacked on peg A, from the largest to the smallest. Rebuild it on the <b>last peg</b> following two rules:</p>'
        + '<ul><li>move <b>only one disk at a time</b>, the top disk of a peg;</li>'
        + '<li><b>never place a disk on a smaller disk</b>.</li></ul>'
        + '<h3>Playing</h3><ul>'
        + '<li><b>Drag and drop</b> a disk from one peg to another (mouse or finger), or <b>click</b> the starting peg, then the destination peg.</li>'
        + '<li><b>Keyboard:</b> <kbd>1</kbd> to <kbd>9</kbd> and <kbd>0</kbd> (peg 10): the starting peg, then the destination peg; or <kbd>←</kbd> <kbd>→</kbd> to choose a peg and <kbd>Space</kbd> to pick up or drop the disk; <kbd>Esc</kbd>: put the disk back.</li>'
        + '<li><kbd>U</kbd> or <kbd>Ctrl</kbd>+<kbd>Z</kbd>: undo · <kbd>Y</kbd>: redo · <kbd>R</kbd>: restart · <kbd>H</kbd>: hint · <kbd>S</kbd>: solution (play or pause) · <kbd>+</kbd> <kbd>−</kbd>: speed · <kbd>P</kbd>: panel · <kbd>?</kbd>: this help.</li></ul>'
        + '<h3>Exploring</h3><ul>'
        + '<li><b>How many moves?</b> Each tower solved without a hint or the solution writes your best result in the table, and a <span class="coche">✓</span> appears when you reach the minimum. Fill in the column for 3 pegs, look for the pattern… and guess the formula!</li>'
        + '<li><b>Hint and solution:</b> “Hint” shows the next optimal move. “Solution” unlocks after 5 attempts with the same number of disks and pegs (an attempt counts when the tower is solved, or when you restart after playing at least one move); it then plays the optimal solution move by move, from 0.5 to 1000 moves per second, and the “Recursion” panel shows how it is built. An assisted game does not count in the table.</li>'
        + '<li><b>Which disk moves?</b> One bar per move, as tall as the number of the disk. Click or drag on the strip to go back to any move. With the optimal solution, a surprising pattern appears…</li>'
        + '<li><b>More pegs:</b> up to 10 pegs. The best strategy with 4 pegs has only been known since 2014 (Thierry Bousch); for 5 pegs or more, it is an open problem.</li></ul>'
        + '<h3>The legend</h3>'
        + '<p>Lucas told of priests moving a tower of 64 golden disks: when they finish, the world will end. How many moves do they need? Find the formula with your table, then work out how long it would take them at one move per second.</p>',
    },
  };

  const MSG = {
    fr: {
      titrePage: 'Les tours de Hanoï — UQTR',
      btnLangue: 'EN', btnLangueTitre: 'English version',
      configHud: '{n} {disques} · {p} tiges',
      solution: '▶&nbsp;Solution', pause: '❚❚&nbsp;Pause', reprendre: '▶&nbsp;Reprendre',
      depart: 'Départ', arrivee: 'Arrivée', attente: 'Attente',
      quaiDepart: 'Quai de départ', quaiArrivee: 'Quai d’arrivée',
      interditDisques: 'Impossible : le disque {d} ne peut pas aller sur le disque {e}, plus petit.',
      interditCaisses: 'Impossible : la caisse {d} écraserait la caisse {e}, plus petite.',
      tigeVide: 'La tige {t} est vide.',
      zoneVide: 'La zone {t} est vide.',
      indiceDisque: '<b>Indice :</b> déplacez le disque {d} de {de} vers {vers}.',
      indiceCaisse: '<b>Indice :</b> déplacez la caisse {d} de {de} vers {vers}.',
      resteMin: 'Il reste {r} {coups} au minimum.',
      resteFS: 'Il reste {r} {coups} avec la stratégie de Frame–Stewart.',
      dejaResolu: 'La tour est déjà sur la tige d’arrivée !',
      recherche: 'Recherche exhaustive : {pc} % des {total} configurations…',
      rechercheFinie: 'Recherche exhaustive : {total} configurations explorées.',
      indiceImpossible: 'Pas d’indice depuis cette position : il faudrait explorer {p}<sup>{n}</sup> = {total} configurations. Annulez vos derniers coups pour revenir sur le chemin de la solution, ou recommencez.',
      solutionDepart: 'Depuis cette position, la recherche serait trop longue ({total} configurations) : la solution repart du début.',
      solutionCalculee: 'Plus court chemin depuis la position actuelle : {r} {coups}.',
      solutionCalculeeD: 'Plus court chemin calculé depuis la position actuelle.',
      victoireMinD: 'Tour déplacée en <b>{c}</b> {coups} : c’est le minimum ! <span class="coche">✓</span>',
      victoireMinConjD: 'Tour déplacée en <b>{c}</b> {coups} : c’est le meilleur résultat connu (conjecture de Frame–Stewart) ! <span class="coche">✓</span>',
      victoirePlusD: 'Tour déplacée en <b>{c}</b> {coups}. Pouvez-vous faire mieux ?',
      noteTableD: 'Votre meilleur nombre de coups pour <i>n</i> disques et <i>p</i> tiges : chaque tour réussie sans indice ni solution remplit une case, et un <span class="coche">✓</span> apparaît quand vous atteignez le minimum. Cliquez sur une case pour jouer cette partie.',
      noteTableR: 'Nombre minimal de coups pour <i>n</i> disques et <i>p</i> tiges. Cliquez sur une case pour jouer cette partie. <span class="coche">✓</span> : réussi au minimum, sans aide. En <i>italique</i> : valeur conjecturée.',
      caseVide: '{n} {disques}, {p} tiges : pas encore réussi',
      caseRecord: '{n} {disques}, {p} tiges : votre record est de {r} {coups}',
      caseRecordMin: '{n} {disques}, {p} tiges : votre record, {r} {coups}, est le minimum',
      defiDebut: 'Réussissez une tour pour remplir votre première case. Commencez petit : 1 disque, puis 2, puis 3…',
      defiSuite: 'Continuez avec 3 tiges : réussissez la tour de <b>{k}</b> {disques} pour remplir la case suivante.',
      defiAmeliorer: 'Avec 3 tiges, vous avez trouvé : <b>{liste}</b>. Les cases sans <span class="coche">✓</span> peuvent encore être améliorées : rejouez-les !',
      defiRegularite: 'Avec 3 tiges, vous avez trouvé : <b>{liste}</b>. Voyez-vous une régularité ? Prédisez le nombre de coups pour <b>{k}</b> disques, puis vérifiez !',
      defiTiges: ' Ajoutez ensuite une tige : combien de coups gagnez-vous ?',
      effacer: 'Effacer mes résultats',
      effacerConfirmer: 'Cliquer encore pour tout effacer',
      resultatsEffaces: 'Tableau vidé : à vous de le remplir !',
      pileDecouverte1: 'Avec un seul disque, c’est facile ! Essayez ensuite avec 2, puis 3 disques.',
      pileDecouverte3: 'Pour déplacer une tour de <b>{n}</b> disques de A vers {Z}, le grand disque du dessous doit bouger au moins une fois. Où doivent se trouver les <b>{m}</b> autres disques à ce moment-là ? {suite}',
      pileDecouverteFS: 'Avec {p} tiges, on peut aller bien plus vite qu’avec 3. Mais comment ? {suite}',
      suite3: 'Lancez la solution pour voir la récursivité en action.',
      suite3V: 'Après {k} essais, le bouton « Solution » vous montrera la récursivité en action.',
      suiteFS: 'Lancez la solution pour voir la stratégie de Frame et Stewart en action.',
      suiteFSV: 'Après {k} essais, le bouton « Solution » vous montrera la stratégie de Frame et Stewart en action.',
      solutionVerrou: 'Solution <span class="compte">{c}/{k}</span>',
      titreSolutionVerrou: 'La solution se débloque après {k} essais avec ce nombre de disques et de tiges ({c} sur {k} pour l’instant).',
      explicationVerrou: 'La solution sera disponible après <b>{k} essais</b> avec {n} {disques} et {p} tiges (encore {r}). Un essai compte quand vous réussissez la tour, ou quand vous recommencez après avoir joué au moins un coup.',
      solutionDebloquee: '<b>Solution débloquée !</b> Vous avez fait {k} essais avec {n} {disques} et {p} tiges : le bouton « Solution » est maintenant disponible.',
      victoireDeblocage: '<span class="deblocage">C’était votre {k}<sup>e</sup> essai : le bouton « Solution » est maintenant disponible.</span>',
      essaisVal: '{c} / {k}',
      pileCalculee: 'Cette solution part de la position actuelle : ce n’est pas la solution récursive, il n’y a donc pas de pile d’appels à montrer.',
      bravo: 'Bravo !',
      victoireMin: 'Tour déplacée en <b>{c}</b> {coups} : c’est le minimum !',
      victoireMinConj: 'Tour déplacée en <b>{c}</b> {coups} : c’est le minimum connu (conjecture de Frame–Stewart).',
      victoirePlus: 'Tour déplacée en <b>{c}</b> {coups}. Le minimum est {m} : pouvez-vous faire mieux ?',
      victoireAide: 'Tour déplacée en <b>{c}</b> {coups}, avec de l’aide. À vous de jouer, maintenant !',
      victoireMoins: 'Tour déplacée en <b>{c}</b> {coups}, moins que la stratégie de Frame–Stewart ({m}) ! Vous venez peut-être de réfuter une conjecture de 1941 : notez votre partie.',
      essayerDisques: 'Essayer avec {n} disques',
      essayerTiges: 'Essayer avec {p} tiges',
      badgeDemontre: 'démontré', badgeConjecture: 'conjecture',
      titreDemontre: 'Ce minimum est démontré.',
      titreConjecture: 'Nombre de coups de la stratégie de Frame–Stewart : on conjecture que c’est le minimum.',
      appel3: '{k} {objets} : {de} → {vers}',
      appelFS: '{k} {objets} : {de} → {vers} · {q} tiges · ℓ = {l}',
      feuilleDisque: 'disque {d} : {de} → {vers}',
      feuilleCaisse: 'caisse {d} : {de} → {vers}',
      niveauxCaches: '⋯ {k} niveaux',
      explication1: 'Un seul disque : un seul coup, de A vers {Z}.',
      explication3: 'Pour déplacer <b>{n}</b> disques de A vers {Z}, on déplace les <b>{m}</b> plus petits vers B, puis le grand disque vers {Z}, puis à nouveau les <b>{m}</b> petits. Et pour déplacer {m} disques ? On recommence avec {m2}… Lancez la solution (ou jouez parfaitement) pour voir ces appels imbriqués.',
      explicationFS: 'Stratégie de Frame–Stewart : on met de côté les <b>ℓ = {l}</b> plus petits disques sur B (avec les {p} tiges), on déplace les <b>{k}</b> autres vers {Z} avec {q} tiges (sans toucher à B), puis on ramène les {l} petits disques sur {Z}. Lancez la solution pour voir ces appels imbriqués.',
      horsChemin3: 'Cette position n’est pas sur le chemin de la solution optimale : la pile d’appels réapparaîtra si vous y revenez (Annuler) ou si vous lancez la solution.',
      horsCheminFS: 'Cette position n’est pas sur le chemin de la solution récursive (il peut exister d’autres chemins optimaux) : la pile d’appels réapparaîtra si vous y revenez (Annuler) ou si vous lancez la solution.',
      termine: 'Terminé : la solution compte {m} {coups}.',
      resumePile: 'Prochain coup : {i} sur {m}',
      bandeVide: 'Chaque coup ajoutera ici une barre, de hauteur égale au numéro du disque déplacé.',
      bandeInfo: '{c} / {t} {coups}',
      bandeInfo1: '{c} {coups}',
      bulleBande: 'Coup {i} : disque {d}, {de} → {vers}',
      bulleBandeFutur: 'Coup {i} (à venir) : disque {d}, {de} → {vers}',
      annonceCoup: 'Disque {d} de {de} vers {vers}. {c} {coups}.',
      annoncePris: 'Disque {d} pris sur la tige {t}.',
      annonceVictoire: 'Bravo ! Tour déplacée en {c} {coups}.',
      vitesse: '{v} {coups}/s',
      coinTable: '<i>n</i> \\ <i>p</i>',
      titreCase: '{n} {disques}, {p} tiges : {m} {coups}',
    },
    en: {
      titrePage: 'The Tower of Hanoi — UQTR',
      btnLangue: 'FR', btnLangueTitre: 'Version française',
      configHud: '{n} {disques} · {p} pegs',
      solution: '▶&nbsp;Solution', pause: '❚❚&nbsp;Pause', reprendre: '▶&nbsp;Resume',
      depart: 'Start', arrivee: 'Goal', attente: 'Waiting',
      quaiDepart: 'Start dock', quaiArrivee: 'Goal dock',
      interditDisques: 'Not allowed: disk {d} cannot go on disk {e}, which is smaller.',
      interditCaisses: 'Not allowed: crate {d} would crush crate {e}, which is smaller.',
      tigeVide: 'Peg {t} is empty.',
      zoneVide: 'Zone {t} is empty.',
      indiceDisque: '<b>Hint:</b> move disk {d} from {de} to {vers}.',
      indiceCaisse: '<b>Hint:</b> move crate {d} from {de} to {vers}.',
      resteMin: 'At least {r} {coups} to go.',
      resteFS: '{r} {coups} to go with the Frame–Stewart strategy.',
      dejaResolu: 'The tower is already on the goal peg!',
      recherche: 'Exhaustive search: {pc}% of {total} configurations…',
      rechercheFinie: 'Exhaustive search: {total} configurations explored.',
      indiceImpossible: 'No hint from this position: it would take exploring {p}<sup>{n}</sup> = {total} configurations. Undo your last moves to get back on the path of the solution, or restart.',
      solutionDepart: 'From this position, the search would take too long ({total} configurations): the solution starts over from the beginning.',
      solutionCalculee: 'Shortest path from the current position: {r} {coups}.',
      solutionCalculeeD: 'Shortest path computed from the current position.',
      victoireMinD: 'Tower moved in <b>{c}</b> {coups}: that is the minimum! <span class="coche">✓</span>',
      victoireMinConjD: 'Tower moved in <b>{c}</b> {coups}: that is the best known (Frame–Stewart conjecture)! <span class="coche">✓</span>',
      victoirePlusD: 'Tower moved in <b>{c}</b> {coups}. Can you do better?',
      noteTableD: 'Your best number of moves for <i>n</i> disks and <i>p</i> pegs: each tower solved without a hint or the solution fills a cell, and a <span class="coche">✓</span> appears when you reach the minimum. Click a cell to play that game.',
      noteTableR: 'Minimum number of moves for <i>n</i> disks and <i>p</i> pegs. Click a cell to play that game. <span class="coche">✓</span>: solved in the minimum, without help. In <i>italics</i>: conjectured value.',
      caseVide: '{n} {disques}, {p} pegs: not solved yet',
      caseRecord: '{n} {disques}, {p} pegs: your best is {r} {coups}',
      caseRecordMin: '{n} {disques}, {p} pegs: your best, {r} {coups}, is the minimum',
      defiDebut: 'Solve a tower to fill your first cell. Start small: 1 disk, then 2, then 3…',
      defiSuite: 'Keep going with 3 pegs: solve the tower of <b>{k}</b> {disques} to fill the next cell.',
      defiAmeliorer: 'With 3 pegs, you found: <b>{liste}</b>. The cells without a <span class="coche">✓</span> can still be improved: play them again!',
      defiRegularite: 'With 3 pegs, you found: <b>{liste}</b>. Do you see a pattern? Predict the number of moves for <b>{k}</b> disks, then check!',
      defiTiges: ' Then add a peg: how many moves do you save?',
      effacer: 'Clear my results',
      effacerConfirmer: 'Click again to clear everything',
      resultatsEffaces: 'Table cleared: it is yours to fill!',
      pileDecouverte1: 'With a single disk, it is easy! Then try 2, then 3 disks.',
      pileDecouverte3: 'To move a tower of <b>{n}</b> disks from A to {Z}, the large disk at the bottom must move at least once. Where must the <b>{m}</b> other disks be at that moment? {suite}',
      pileDecouverteFS: 'With {p} pegs, you can go much faster than with 3. But how? {suite}',
      suite3: 'Play the solution to see recursion in action.',
      suite3V: 'After {k} attempts, the “Solution” button will show you recursion in action.',
      suiteFS: 'Play the solution to see the Frame–Stewart strategy in action.',
      suiteFSV: 'After {k} attempts, the “Solution” button will show you the Frame–Stewart strategy in action.',
      solutionVerrou: 'Solution <span class="compte">{c}/{k}</span>',
      titreSolutionVerrou: 'The solution unlocks after {k} attempts with this number of disks and pegs ({c} of {k} so far).',
      explicationVerrou: 'The solution will be available after <b>{k} attempts</b> with {n} {disques} and {p} pegs ({r} to go). An attempt counts when you solve the tower, or when you restart after playing at least one move.',
      solutionDebloquee: '<b>Solution unlocked!</b> You made {k} attempts with {n} {disques} and {p} pegs: the “Solution” button is now available.',
      victoireDeblocage: '<span class="deblocage">That was your attempt number {k}: the “Solution” button is now available.</span>',
      essaisVal: '{c} / {k}',
      pileCalculee: 'This solution starts from the current position: it is not the recursive solution, so there is no call stack to show.',
      bravo: 'Well done!',
      victoireMin: 'Tower moved in <b>{c}</b> {coups}: that is the minimum!',
      victoireMinConj: 'Tower moved in <b>{c}</b> {coups}: that is the best known (Frame–Stewart conjecture).',
      victoirePlus: 'Tower moved in <b>{c}</b> {coups}. The minimum is {m}: can you do better?',
      victoireAide: 'Tower moved in <b>{c}</b> {coups}, with some help. Your turn now!',
      victoireMoins: 'Tower moved in <b>{c}</b> {coups}, fewer than the Frame–Stewart strategy ({m})! You may have just disproved a conjecture from 1941: write down your game.',
      essayerDisques: 'Try with {n} disks',
      essayerTiges: 'Try with {p} pegs',
      badgeDemontre: 'proved', badgeConjecture: 'conjecture',
      titreDemontre: 'This minimum is proved.',
      titreConjecture: 'Number of moves of the Frame–Stewart strategy: it is conjectured to be the minimum.',
      appel3: '{k} {objets}: {de} → {vers}',
      appelFS: '{k} {objets}: {de} → {vers} · {q} pegs · ℓ = {l}',
      feuilleDisque: 'disk {d}: {de} → {vers}',
      feuilleCaisse: 'crate {d}: {de} → {vers}',
      niveauxCaches: '⋯ {k} levels',
      explication1: 'A single disk: a single move, from A to {Z}.',
      explication3: 'To move <b>{n}</b> disks from A to {Z}, move the <b>{m}</b> smallest ones to B, then the large disk to {Z}, then the <b>{m}</b> small ones again. And to move {m} disks? Start over with {m2}… Play the solution (or play perfectly) to see these nested calls.',
      explicationFS: 'Frame–Stewart strategy: set aside the <b>ℓ = {l}</b> smallest disks on B (with all {p} pegs), move the <b>{k}</b> others to {Z} with {q} pegs (without touching B), then bring the {l} small disks back onto {Z}. Play the solution to see these nested calls.',
      horsChemin3: 'This position is not on the path of the optimal solution: the call stack will come back if you return to it (Undo) or play the solution.',
      horsCheminFS: 'This position is not on the path of the recursive solution (there may be other optimal paths): the call stack will come back if you return to it (Undo) or play the solution.',
      termine: 'Done: the solution takes {m} {coups}.',
      resumePile: 'Next move: {i} of {m}',
      bandeVide: 'Each move will add a bar here, as tall as the number of the disk moved.',
      bandeInfo: '{c} / {t} {coups}',
      bandeInfo1: '{c} {coups}',
      bulleBande: 'Move {i}: disk {d}, {de} → {vers}',
      bulleBandeFutur: 'Move {i} (to come): disk {d}, {de} → {vers}',
      annonceCoup: 'Disk {d} from {de} to {vers}. {c} {coups}.',
      annoncePris: 'Disk {d} picked up from peg {t}.',
      annonceVictoire: 'Well done! Tower moved in {c} {coups}.',
      vitesse: '{v} {coups}/s',
      coinTable: '<i>n</i> \\ <i>p</i>',
      titreCase: '{n} {disques}, {p} pegs: {m} {coups}',
    },
  };

  // ===========================================================================
  //  Éléments et état
  // ===========================================================================
  const $ = (id) => document.getElementById(id);
  const el = {
    plateau: $('plateau'), plateauConteneur: $('plateau-conteneur'),
    hudCoups: $('hud-coups'), hudCoupsMot: $('hud-coups-mot'), hudMin: $('hud-min'), hudTemps: $('hud-temps'),
    hudConfig: $('hud-config'), hudGauche: document.querySelector('.hud-gauche'),
    hudRecordZone: $('hud-record-zone'), hudRecord: $('hud-record'),
    defi: $('defi'), noteTable: $('note-table'), btnEffacer: $('btn-effacer'), valEssais: $('val-essais'),
    bulle: $('bulle'), victoire: $('victoire'), victoireTitre: $('victoire-titre'), victoireTexte: $('victoire-texte'),
    btnRejouer: $('btn-rejouer'), btnPlus: $('btn-plus'), btnFermerVictoire: $('btn-fermer-victoire'),
    btnAnnuler: $('btn-annuler'), btnRetablir: $('btn-retablir'), btnIndice: $('btn-indice'), btnSolution: $('btn-solution'),
    vitesse: $('champ-vitesse'), valVitesse: $('val-vitesse'),
    bande: $('bande'), bandeConteneur: $('bande-conteneur'), bandeInfo: $('bande-info'), bulleBande: $('bulle-bande'),
    champN: $('champ-n'), valN: $('val-n'), champP: $('champ-p'), valP: $('val-p'),
    apparence: $('apparence'), optSon: $('opt-son'), btnRecommencer: $('btn-recommencer'), noteCaisses: $('note-caisses'),
    valCoups: $('val-coups'), valMin: $('val-min'), badgeMin: $('badge-min'), valTemps: $('val-temps'), valRecord: $('val-record'),
    formuleMin: $('formule-min'), noteAide: $('note-aide'),
    pile: $('pile'),
    table: $('table-min'),
    aide: $('aide'), btnAide: $('btn-aide'), btnFermerAide: $('btn-fermer-aide'),
    btnPanneau: $('btn-panneau'), btnPleinEcran: $('btn-plein-ecran'), btnLangue: $('btn-langue'),
    annonce: $('annonce'),
  };

  const etat = {
    langue: 'fr',
    n: 4, p: 3,
    theme: 'disques',
    son: false,
    pos: null,          // pos[d] : tige du disque d
    chemin: [],         // coups depuis la configuration de départ
    curseur: 0,         // nombre de coups joués (position dans le chemin)
    planValide: false,  // la suite du chemin est une solution calculée
    aide: false,        // indice ou solution utilisés pendant la partie
    celebre: false,
    chrono: { debut: null, fin: null },
    selection: null,    // { d, de, x } : disque soulevé (clic ou clavier)
    survol: -1,         // tige survolée (souris) ou choisie (clavier)
    clavier: false,
    souris: false,
    appui: null,
    glisse: null,       // glisser-déposer en cours
    anim: null,         // déplacement animé en cours
    indice: null,       // { d, de, vers }
    conflit: null,      // disque qui bloque un coup interdit (halo rouge)
    lecture: { active: false, vitesse: 2, auto: true, prochain: 0, reste: 0, dernier: 0 },
    sol: null, indexCanon: null,
    couleurs: null, couleursCaisses: null,
    recherche: null,
    confettis: [],
    records: {},
    essais: {},           // nombre d'essais commencés par configuration "n,p"
    essaiCompte: false,   // la partie en cours est-elle déjà comptée comme un essai ?
    victoireDeblocage: false,
  };
  const tables = new Map();       // distances exactes (p ≥ 4) : "n,p" → { dist, explorees }
  let G = null;                   // géométrie du plateau

  // ===========================================================================
  //  Traductions
  // ===========================================================================
  function t(cle, params) {
    let s = MSG[etat.langue][cle];
    if (s === undefined) s = MSG.fr[cle];
    if (s === undefined) return cle;
    if (params) for (const k in params) s = s.split('{' + k + '}').join(String(params[k]));
    return s;
  }
  const formats = { fr: new Intl.NumberFormat('fr-CA'), en: new Intl.NumberFormat('en-CA') };
  const fmt = (v) => formats[etat.langue].format(v).replace(/[\u00A0\u202F ]/g, '\u202F');
  const motCoups = (c) => etat.langue === 'fr' ? (Math.abs(c) >= 2 ? 'coups' : 'coup') : (c === 1 ? 'move' : 'moves');
  const motDisques = (n) => etat.langue === 'fr' ? (n >= 2 ? 'disques' : 'disque') : (n === 1 ? 'disk' : 'disks');

  function capturerFrancais() {
    document.querySelectorAll('[data-i18n]').forEach((e) => { TRAD.fr[e.dataset.i18n] = e.innerHTML; });
    document.querySelectorAll('[data-i18n-title]').forEach((e) => { TRAD.fr['title:' + e.dataset.i18nTitle] = e.title; });
    document.querySelectorAll('[data-i18n-aria]').forEach((e) => { TRAD.fr['aria:' + e.dataset.i18nAria] = e.getAttribute('aria-label') || ''; });
  }

  function appliquerLangue(lang) {
    etat.langue = TRAD[lang] ? lang : 'fr';
    document.documentElement.lang = etat.langue;
    const d = Object.assign({}, TRAD.fr, TRAD[etat.langue]);
    document.querySelectorAll('[data-i18n]').forEach((e) => { const v = d[e.dataset.i18n]; if (v !== undefined) e.innerHTML = v; });
    document.querySelectorAll('[data-i18n-title]').forEach((e) => { const v = d['title:' + e.dataset.i18nTitle]; if (v !== undefined) e.title = v; });
    document.querySelectorAll('[data-i18n-aria]').forEach((e) => { const v = d['aria:' + e.dataset.i18nAria]; if (v !== undefined) e.setAttribute('aria-label', v); });
    document.title = t('titrePage');
    el.btnLangue.textContent = t('btnLangue');
    el.btnLangue.title = t('btnLangueTitre');
    el.victoireTitre.textContent = t('bravo');
    majBoutonEffacer(false);
    construireTable();
    majVitesse();
    if (!el.victoire.hidden && etat.celebre) remplirVictoire();
    marquerInterface();
  }

  function changerLangue(lang) {
    appliquerLangue(lang);
    majURL();
  }

  function majURL() {
    const q = new URLSearchParams();
    q.set('lang', etat.langue);
    q.set('n', etat.n);
    q.set('p', etat.p);
    if (etat.theme === 'caisses') q.set('theme', 'caisses');
    if (MODE_REPONSES) q.set('reponses', '1');
    if (MODE_TEST) q.set('test', '1');
    try { history.replaceState(null, '', location.pathname + '?' + q.toString() + location.hash); } catch (_) { /* file:// */ }
  }

  // ===========================================================================
  //  Couleurs : dégradé or → vert → vert foncé (comme les disques des diapositives),
  //  interpolé dans l'espace OKLab pour des pas réguliers de luminosité.
  // ===========================================================================
  function hexRgb(h) { const v = parseInt(h.slice(1), 16); return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255]; }
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const delin = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  function rgbOklab(rgb) {
    const r = lin(rgb[0]), g = lin(rgb[1]), b = lin(rgb[2]);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  }
  function oklabHex(lab) {
    const L = lab[0], a = lab[1], b = lab[2];
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
    const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
    return '#' + rgb.map((c) => Math.round(clamp(delin(clamp(c, 0, 1)), 0, 1) * 255).toString(16).padStart(2, '0')).join('');
  }
  function teintes(lab, texteSombre) {
    return {
      base: oklabHex(lab),
      clair: oklabHex([lab[0] + 0.075, lab[1] * 0.9, lab[2] * 0.9]),
      fonce: oklabHex([lab[0] - 0.07, lab[1], lab[2]]),
      bord: oklabHex([lab[0] - 0.17, lab[1], lab[2]]),
      texte: texteSombre ? C.texte : '#FFFFFF',
    };
  }
  function paletteDisques(n) {
    const arrets = [[0, '#DBA326'], [0.42, '#0E8954'], [1, '#084B2E']].map((a) => [a[0], rgbOklab(hexRgb(a[1]))]);
    const res = [null];
    for (let d = 1; d <= n; d++) {
      const x = n === 1 ? 0 : (d - 1) / (n - 1);
      let k = 0;
      while (k < arrets.length - 2 && x > arrets[k + 1][0]) k++;
      const a = arrets[k], b = arrets[k + 1];
      const u = (x - a[0]) / (b[0] - a[0]);
      const lab = [0, 1, 2].map((i) => a[1][i] + (b[1][i] - a[1][i]) * u);
      res.push(teintes(lab, lab[0] > 0.66));
    }
    return res;
  }
  function paletteCaisses(n) {
    const bois = rgbOklab(hexRgb(C.bois));
    const res = [null];
    for (let d = 1; d <= n; d++) {
      const v = (((d * 7) % 5) - 2) * 0.02;
      res.push(teintes([bois[0] + v, bois[1], bois[2]], true));
    }
    return res;
  }

  // ===========================================================================
  //  Surfaces de dessin
  // ===========================================================================
  const surfaces = {};
  function ajuster(nom, canvas) {
    const r = canvas.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = Math.round(r.width), h = Math.round(r.height);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    surfaces[nom] = { canvas, ctx, w, h, dpr };
    return true;
  }

  function rectArrondi(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // ===========================================================================
  //  Géométrie du plateau
  // ===========================================================================
  function geometrie() {
    const S = surfaces.plateau;
    if (!S) return null;
    const W = S.w, Hh = S.h, n = etat.n, p = etat.p;
    const margeX = Math.max(10, W * 0.025);
    const cw = (W - 2 * margeX) / p;
    const bas = 40, haut = 48;
    const epSocle = clamp(Hh * 0.022, 9, 15);
    const dispo = Hh - haut - bas - epSocle;
    const dh = Math.max(4, Math.min(38, dispo / (n + 3), cw * 0.32));
    const assemblage = (n + 3) * dh;
    const yBase = haut + assemblage + Math.max(0, dispo - assemblage) * 0.7;
    const yTige = yBase - (n + 1.4) * dh;
    const yLevage = yTige - 0.85 * dh;
    let wMax, wMin;
    if (etat.theme === 'caisses') {     // des caisses plutôt que des planches
      wMax = Math.min(cw * 0.74, dh * 5.4);
      wMin = Math.min(wMax, Math.max(dh * 1.5, wMax * 0.3));
    } else {
      wMax = Math.min(cw * 0.9, 300);
      wMin = Math.max(6, wMax * 0.26);
    }
    return {
      W, H: Hh, margeX, cw, dh, yBase, yTige, yLevage, epSocle, wMax, wMin,
      hPiece: dh - Math.max(1.5, dh * 0.1),
      largeur: (d) => (n === 1 ? wMax * 0.62 : wMin + (wMax - wMin) * (d - 1) / (n - 1)),
      xTige: (i) => margeX + cw * (i + 0.5),
      yNiveau: (k) => yBase - (k + 0.5) * dh,
    };
  }

  function tigeSous(x) {
    if (!G) return -1;
    if (x < 0 || x > G.W) return -1;
    return clamp(Math.floor((x - G.margeX) / G.cw), 0, etat.p - 1);
  }
  function compter(i) {
    let c = 0;
    for (let d = 1; d <= etat.n; d++) if (etat.pos[d] === i) c++;
    return c;
  }
  const sommet = (i) => H.dessus(etat.pos, etat.n, etat.p)[i];

  // ===========================================================================
  //  Dessin du plateau
  // ===========================================================================
  function dessinerPlateau(t) {
    const S = surfaces.plateau;
    if (!S || !G) return;
    const ctx = S.ctx;
    ctx.clearRect(0, 0, S.w, S.h);
    const caisses = etat.theme === 'caisses';
    if (caisses) dessinerEntrepot(ctx); else dessinerFond(ctx);
    dessinerColonnes(ctx);
    if (!caisses) dessinerTiges(ctx);
    dessinerEtiquettes(ctx);

    const volant = pieceVolante(t);
    const cache = volant ? volant.d : 0;
    const piles = H.piles(etat.pos, etat.n, etat.p);
    for (let i = 0; i < etat.p; i++) {
      const pile = piles[i];
      for (let k = 0; k < pile.length; k++) {
        const d = pile[k];
        if (d === cache) continue;
        let halo = null;
        if (etat.conflit && etat.conflit.d === d) halo = 'erreur';
        else if (etat.indice && etat.indice.d === d) halo = 'indice';
        dessinerPiece(ctx, d, G.xTige(i), G.yNiveau(k), { halo, t });
      }
    }
    if (etat.indice && !volant) dessinerFlecheIndice(ctx, t, piles);
    if (volant) {
      if (caisses) dessinerChariot(ctx, volant.x, volant.y, volant.d);
      dessinerPiece(ctx, volant.d, volant.x, volant.y, { volant: true, halo: volant.halo, t });
    }
    dessinerConfettis(ctx, t);
  }

  function dessinerFond(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, G.H);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(1, '#F7F6F1');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, G.W, G.H);
  }

  function dessinerEntrepot(ctx) {
    const mur = ctx.createLinearGradient(0, 0, 0, G.yBase);
    mur.addColorStop(0, '#FBFAF6');
    mur.addColorStop(1, '#EEEBE2');
    ctx.fillStyle = mur;
    ctx.fillRect(0, 0, G.W, G.yBase);
    // poutres verticales discrètes entre les zones
    ctx.fillStyle = 'rgba(0, 0, 0, .035)';
    for (let i = 1; i < etat.p; i++) ctx.fillRect(Math.round(G.margeX + i * G.cw) - 1, 0, 2, G.yBase);
    const sol = ctx.createLinearGradient(0, G.yBase, 0, G.H);
    sol.addColorStop(0, '#DCD8CD');
    sol.addColorStop(1, '#CFCBBF');
    ctx.fillStyle = sol;
    ctx.fillRect(0, G.yBase, G.W, G.H - G.yBase);
    ctx.fillStyle = '#B9B5A8';
    ctx.fillRect(0, G.yBase, G.W, 2);
    // marquage des zones au sol
    for (let i = 0; i < etat.p; i++) {
      const w = Math.min(G.wMax + 12, G.cw - 6);
      const x = G.xTige(i) - w / 2, y = G.yBase + 4, h = Math.max(6, G.epSocle - 2);
      if (i === 0 || i === etat.p - 1) {
        ctx.fillStyle = i === 0 ? 'rgba(14, 137, 84, .16)' : 'rgba(219, 163, 38, .32)';
        rectArrondi(ctx, x, y, w, h, 3);
        ctx.fill();
      }
      ctx.save();
      ctx.setLineDash([7, 5]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.or;
      rectArrondi(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, 3);
      ctx.stroke();
      ctx.restore();
    }
  }

  function dessinerColonnes(ctx) {
    const tenu = (etat.glisse && etat.glisse.actif) ? etat.glisse : etat.selection;
    const haut = G.yLevage - G.dh * 0.95;
    const hauteur = G.yBase + G.epSocle + 4 - haut;
    for (let i = 0; i < etat.p; i++) {
      const x = G.margeX + i * G.cw + 3, w = G.cw - 6;
      let fond = null, bord = null, tirets = false;
      if (tenu) {
        if (i !== tenu.de) {
          const permis = H.coupPermis(etat.pos, etat.n, etat.p, tenu.de, i) !== 0;
          if (i === etat.survol) {
            fond = permis ? 'rgba(14, 137, 84, .10)' : 'rgba(178, 59, 42, .07)';
            bord = permis ? 'rgba(14, 137, 84, .50)' : 'rgba(178, 59, 42, .40)';
          } else if (permis) fond = 'rgba(14, 137, 84, .045)';
        }
      } else if (i === etat.survol) {
        if (etat.clavier) { bord = C.or; tirets = true; } else if (sommet(i)) fond = 'rgba(0, 0, 0, .025)';
      }
      if (fond) { ctx.fillStyle = fond; rectArrondi(ctx, x, haut, w, hauteur, 10); ctx.fill(); }
      if (bord) {
        ctx.save();
        if (tirets) ctx.setLineDash([6, 5]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = bord;
        rectArrondi(ctx, x + 0.75, haut + 0.75, w - 1.5, hauteur - 1.5, 10);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function dessinerTiges(ctx) {
    const rw = clamp(G.cw * 0.045, 4, 10);
    for (let i = 0; i < etat.p; i++) {
      const x = G.xTige(i);
      const g = ctx.createLinearGradient(x - rw / 2, 0, x + rw / 2, 0);
      g.addColorStop(0, '#8F8C83');
      g.addColorStop(0.45, '#C9C6BC');
      g.addColorStop(1, '#7B786F');
      ctx.fillStyle = g;
      rectArrondi(ctx, x - rw / 2, G.yTige, rw, G.yBase - G.yTige + 2, rw / 2);
      ctx.fill();
    }
    // fanion d'arrivée
    const xf = G.xTige(etat.p - 1) + rw / 2 - 0.5, yf = G.yTige + 2;
    const fs = clamp(G.dh * 0.72, 8, 16);
    ctx.beginPath();
    ctx.moveTo(xf, yf);
    ctx.lineTo(xf + fs * 1.35, yf + fs * 0.45);
    ctx.lineTo(xf, yf + fs * 0.9);
    ctx.closePath();
    ctx.fillStyle = C.or;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.orFonce;
    ctx.stroke();
    // socle
    const x0 = G.margeX * 0.4, x1 = G.W - G.margeX * 0.4;
    const s = ctx.createLinearGradient(0, G.yBase, 0, G.yBase + G.epSocle);
    s.addColorStop(0, '#706F68');
    s.addColorStop(1, '#4A4944');
    ctx.fillStyle = s;
    rectArrondi(ctx, x0, G.yBase, x1 - x0, G.epSocle, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, .18)';
    ctx.fillRect(x0 + 4, G.yBase + 1, x1 - x0 - 8, 1);
  }

  function dessinerEtiquettes(ctx) {
    const caisses = etat.theme === 'caisses';
    const y1 = G.yBase + G.epSocle + 16, y2 = y1 + 14;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (let i = 0; i < etat.p; i++) {
      const x = G.xTige(i);
      const premier = i === 0, dernier = i === etat.p - 1;
      ctx.font = '700 15px ' + POLICE_UI;
      ctx.fillStyle = premier ? C.vertFonce : dernier ? C.orFonce : C.texte;
      ctx.fillText(LETTRES[i], x, y1);
      let legende = '';
      if (premier) legende = caisses ? t('quaiDepart') : t('depart');
      else if (dernier) legende = caisses ? t('quaiArrivee') : t('arrivee');
      else if (caisses) legende = t('attente');
      if (!legende) continue;
      ctx.font = '12px ' + POLICE_UI;
      if (ctx.measureText(legende).width > G.cw - 4 && caisses && (premier || dernier)) legende = premier ? t('depart') : t('arrivee');
      if (ctx.measureText(legende).width > G.cw - 4) continue;
      ctx.fillStyle = premier ? C.vert : dernier ? C.orFonce : C.texte2;
      ctx.fillText(legende, x, y2);
    }
  }

  function dessinerPiece(ctx, d, x, y, o) {
    if (etat.theme === 'caisses') dessinerCaisse(ctx, d, x, y, o); else dessinerDisque(ctx, d, x, y, o);
  }

  function dessinerHalo(ctx, x, y, w, h, r, o) {
    if (!o.halo) return;
    let a = 1;
    if (o.halo === 'indice' && !REDUIT) a = 0.55 + 0.45 * Math.sin((o.t || 0) / 170);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = o.halo === 'erreur' ? C.rouge : C.or;
    rectArrondi(ctx, x - 3, y - 3, w + 6, h + 6, r + 3);
    ctx.stroke();
    ctx.restore();
  }

  function dessinerDisque(ctx, d, xc, yc, o) {
    const col = etat.couleurs[d];
    const w = G.largeur(d), h = G.hPiece;
    const x = xc - w / 2, y = yc - h / 2;
    const r = Math.min(h * 0.48, 10);
    ctx.save();
    if (o.volant) {
      ctx.shadowColor = 'rgba(0, 0, 0, .22)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
    }
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, col.clair);
    g.addColorStop(0.55, col.base);
    g.addColorStop(1, col.fonce);
    ctx.fillStyle = g;
    rectArrondi(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 1;
    ctx.strokeStyle = col.bord;
    rectArrondi(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
    ctx.stroke();
    if (h >= 9 && w > 2 * r + 4) {
      ctx.strokeStyle = 'rgba(255, 255, 255, .38)';
      ctx.beginPath();
      ctx.moveTo(x + r, y + 2);
      ctx.lineTo(x + w - r, y + 2);
      ctx.stroke();
    }
    dessinerHalo(ctx, x, y, w, h, r, o);
    if (w >= 18 && h >= 10) {
      ctx.fillStyle = col.texte;
      ctx.font = '700 ' + Math.round(Math.min(h * 0.64, 17)) + 'px ' + POLICE_UI;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(d), xc, yc + 0.5);
    }
  }

  function dessinerCaisse(ctx, d, xc, yc, o) {
    const col = etat.couleursCaisses[d];
    const w = G.largeur(d), h = G.hPiece;
    const x = xc - w / 2, y = yc - h / 2;
    ctx.save();
    if (o.volant) {
      ctx.shadowColor = 'rgba(0, 0, 0, .25)';
      ctx.shadowBlur = 9;
      ctx.shadowOffsetY = 4;
    }
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, col.clair);
    g.addColorStop(0.6, col.base);
    g.addColorStop(1, col.fonce);
    ctx.fillStyle = g;
    rectArrondi(ctx, x, y, w, h, 2);
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = C.boisFonce;
    rectArrondi(ctx, x + 0.6, y + 0.6, w - 1.2, h - 1.2, 2);
    ctx.stroke();
    const i = Math.max(2, Math.min(h * 0.16, 5));
    if (w > 26 && h > 12) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(115, 77, 38, .85)';
      ctx.strokeRect(x + i, y + i, w - 2 * i, h - 2 * i);
      ctx.beginPath();
      ctx.moveTo(x + i, y + h - i);
      ctx.lineTo(x + w - i, y + i);
      ctx.stroke();
    }
    dessinerHalo(ctx, x, y, w, h, 2, o);
    if (w >= 20 && h >= 10) {
      const taille = Math.round(Math.min(h * 0.58, 15));
      ctx.font = '700 ' + taille + 'px ' + POLICE_UI;
      const tw = ctx.measureText(String(d)).width;
      const pw = tw + 8, ph = taille + 3;
      ctx.fillStyle = C.orClair;
      rectArrondi(ctx, xc - pw / 2, yc - ph / 2, pw, ph, 2);
      ctx.fill();
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = C.boisFonce;
      ctx.stroke();
      ctx.fillStyle = C.boisFonce;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(d), xc, yc + 0.5);
    }
  }

  /** Chariot élévateur (comme dans la présentation) : mât, fourche sous la caisse, cabine. */
  function dessinerChariot(ctx, xc, yc, d) {
    const w = G.largeur(d), h = G.hPiece;
    const u = clamp(G.dh, 12, 26) / 24;
    const sol = G.yBase;
    const longueur = 50 * u;
    const inverse = xc + w / 2 + longueur > G.W - 4;
    ctx.save();
    if (inverse) { ctx.translate(2 * xc, 0); ctx.scale(-1, 1); }
    const xm = xc + w / 2 + 3 * u;
    const yf = yc + h / 2 + 1.5 * u;
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.chariot;
    ctx.lineWidth = 3.4 * u;
    ctx.beginPath();
    ctx.moveTo(xm, sol - 3 * u);
    ctx.lineTo(xm, Math.min(yf - 10 * u, sol - 44 * u));
    ctx.stroke();
    ctx.lineWidth = 2.6 * u;
    ctx.beginPath();
    ctx.moveTo(xm, yf);
    ctx.lineTo(xc - w * 0.32, yf);
    ctx.stroke();
    const bx = xm + 2.5 * u, bw = 44 * u, bh = 19 * u, by = sol - 8 * u - bh;
    ctx.fillStyle = C.or;
    rectArrondi(ctx, bx, by, bw, bh, 4 * u);
    ctx.fill();
    ctx.lineWidth = 2.1 * u;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(bx + 11 * u, by);
    ctx.lineTo(bx + 13 * u, by - 20 * u);
    ctx.lineTo(bx + bw - 6 * u, by - 20 * u);
    ctx.lineTo(bx + bw - 4 * u, by);
    ctx.stroke();
    ctx.fillStyle = C.chariot;
    for (const xr of [bx + 10 * u, bx + bw - 9 * u]) {
      ctx.beginPath(); ctx.arc(xr, sol - 7 * u, 7 * u, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.fillStyle = '#FFFFFF';
    for (const xr of [bx + 10 * u, bx + bw - 9 * u]) {
      ctx.beginPath(); ctx.arc(xr, sol - 7 * u, 2.4 * u, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.restore();
  }

  function dessinerFlecheIndice(ctx, t, piles) {
    const { de, vers } = etat.indice;
    if (!piles[de].length) return;
    const x0 = G.xTige(de), x1 = G.xTige(vers);
    const y0 = G.yNiveau(piles[de].length - 1) - G.hPiece / 2 - 7;
    const y1 = G.yNiveau(piles[vers].length) - G.hPiece / 2 + 2;
    const yh = G.yLevage - G.dh * 0.35;
    ctx.save();
    ctx.strokeStyle = C.or;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.setLineDash([9, 7]);
    ctx.lineDashOffset = REDUIT ? 0 : -((t / 35) % 16);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(x0, yh, x1, yh, x1, y1 - 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.or;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - 7, y1 - 12);
    ctx.lineTo(x1 + 7, y1 - 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ===========================================================================
  //  Animations : levée, translation, descente (coins arrondis)
  // ===========================================================================
  function quad(a, b, c, u) {
    const v = 1 - u;
    return [v * v * a[0] + 2 * v * u * b[0] + u * u * c[0], v * v * a[1] + 2 * v * u * b[1] + u * u * c[1]];
  }
  function construireVol(x0, y0, x1, y1) {
    const yh = Math.min(G.yLevage, y0, y1);
    const pts = [[x0, y0]];
    const dx = x1 - x0;
    if (Math.abs(dx) < 0.5) {
      if (y0 > yh + 0.5 && y1 > yh + 0.5) pts.push([x0, yh]);
      pts.push([x1, y1]);
    } else {
      const sx = Math.sign(dx);
      const r = Math.max(0, Math.min(G.dh * 1.5, y0 - yh, Math.abs(dx) / 2, y1 - yh));
      const a0 = [x0, yh + r], c0 = [x0, yh], b0 = [x0 + sx * r, yh];
      const a1 = [x1 - sx * r, yh], c1 = [x1, yh], b1 = [x1, yh + r];
      pts.push(a0);
      for (let k = 1; k <= 6; k++) pts.push(quad(a0, c0, b0, k / 6));
      pts.push(a1);
      for (let k = 1; k <= 6; k++) pts.push(quad(a1, c1, b1, k / 6));
      pts.push([x1, y1]);
    }
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, cum, L: cum[cum.length - 1] };
  }
  function pointVol(v, s) {
    if (v.L <= 0) return v.pts[v.pts.length - 1];
    let i = 1;
    while (i < v.cum.length - 1 && v.cum[i] < s) i++;
    const l = v.cum[i] - v.cum[i - 1];
    const u = l > 0 ? clamp((s - v.cum[i - 1]) / l, 0, 1) : 1;
    const a = v.pts[i - 1], b = v.pts[i];
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  }
  const adoucir = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const dureeVol = (L) => clamp(170 + L * 0.33, 190, 540) * (REDUIT ? 0.35 : 1);

  function animer(d, x0, y0, x1, y1, duree, fin) {
    if (etat.anim) finirAnim();
    const v = construireVol(x0, y0, x1, y1);
    etat.anim = { d, v, t0: performance.now(), duree: duree !== undefined ? duree : dureeVol(v.L), fin };
    demander();
  }
  function finirAnim() {
    const a = etat.anim;
    etat.anim = null;
    if (a && a.fin) a.fin();
  }

  function pieceVolante(t) {
    if (etat.anim) {
      const a = etat.anim;
      const u = clamp((t - a.t0) / a.duree, 0, 1);
      const q = pointVol(a.v, adoucir(u) * a.v.L);
      return { d: a.d, x: q[0], y: q[1], halo: null };
    }
    const g = etat.glisse;
    if (g && g.actif) return { d: g.d, x: g.x + g.ox, y: g.y + g.oy, halo: null };
    const s = etat.selection;
    if (s) {
      const bob = REDUIT ? 0 : Math.sin(t / 260) * Math.min(3, G.dh * 0.12);
      return { d: s.d, x: s.x, y: G.yLevage + bob, halo: 'selection' };
    }
    return null;
  }

  // ===========================================================================
  //  Confettis (victoire)
  // ===========================================================================
  function lancerConfettis() {
    if (REDUIT || !G) return;
    const couleurs = [C.vert, C.or, C.vertMoyen, C.orMoyen, C.vertClair, '#FFFFFF', C.vertFonce];
    const x = G.xTige(etat.p - 1), y = G.yNiveau(Math.max(0, etat.n - 1));
    const t0 = performance.now();
    for (let i = 0; i < 150; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.1;
      const v = 320 + Math.random() * 560;
      const depart = i % 3 === 0 ? G.W / 2 : x;
      etat.confettis.push({
        x: depart + (Math.random() - 0.5) * 40, y,
        vx: Math.cos(a) * v * (depart === x ? 1 : 0.8), vy: Math.sin(a) * v,
        r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 14,
        w: 5 + Math.random() * 5, h: 3 + Math.random() * 3,
        c: couleurs[i % couleurs.length], t0,
      });
    }
    demander();
  }
  let dernierConfetti = 0;
  function dessinerConfettis(ctx, t) {
    if (!etat.confettis.length) { dernierConfetti = 0; return; }
    const dt = dernierConfetti ? Math.min(0.05, (t - dernierConfetti) / 1000) : 0.016;
    dernierConfetti = t;
    const restants = [];
    for (const c of etat.confettis) {
      const age = (t - c.t0) / 1000;
      c.vy += 980 * dt;
      c.vx *= 0.992; c.vy *= 0.992;
      c.x += c.vx * dt; c.y += c.vy * dt; c.r += c.vr * dt;
      if (age > 3 || c.y > G.H + 20) continue;
      restants.push(c);
      ctx.save();
      ctx.globalAlpha = clamp(3 - age, 0, 1);
      ctx.translate(c.x, c.y);
      ctx.rotate(c.r);
      ctx.fillStyle = c.c;
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      if (c.c === '#FFFFFF') { ctx.strokeStyle = C.bord; ctx.lineWidth = 0.6; ctx.strokeRect(-c.w / 2, -c.h / 2, c.w, c.h); }
      ctx.restore();
    }
    etat.confettis = restants;
  }

  // ===========================================================================
  //  Son (WebAudio, désactivé par défaut) : chaque disque a sa note
  // ===========================================================================
  let audio = null, dernierSon = 0;
  function son(type, d) {
    if (!etat.son) return;
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const now = audio.currentTime;
      const note = (f, debut, duree, volume, forme) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.type = forme || 'triangle';
        o.frequency.setValueAtTime(f, debut);
        g.gain.setValueAtTime(0.0001, debut);
        g.gain.exponentialRampToValueAtTime(volume, debut + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, debut + duree);
        o.connect(g).connect(audio.destination);
        o.start(debut);
        o.stop(debut + duree + 0.02);
      };
      if (type === 'coup') {
        if (now - dernierSon < 0.04) return;
        dernierSon = now;
        note(1046.5 * Math.pow(2, -PENTATONIQUE[(d - 1) % PENTATONIQUE.length] / 12), now, 0.17, 0.16);
      } else if (type === 'erreur') {
        note(155, now, 0.16, 0.07, 'sawtooth');
      } else if (type === 'victoire') {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, now + i * 0.09, 0.32, 0.12));
      }
    } catch (_) { /* son indisponible */ }
  }

  // ===========================================================================
  //  Boucle d'animation
  // ===========================================================================
  let rafId = 0, dernierT = 0, interfaceSale = true;
  function demander() { if (!rafId) rafId = requestAnimationFrame(boucle); }
  function marquerInterface() { interfaceSale = true; demander(); }

  function boucle(t) {
    rafId = 0;
    const dt = dernierT ? Math.min(0.05, (t - dernierT) / 1000) : 0.016;
    dernierT = t;
    let continuer = false;
    if (etat.anim) {
      if (t - etat.anim.t0 >= etat.anim.duree) finirAnim(); else continuer = true;
    }
    if (etat.lecture.active) { avancerLecture(t); continuer = true; }
    if (etat.selection && G) {
      const cible = etat.survol >= 0 && (etat.clavier || etat.souris) ? G.xTige(etat.survol) : G.xTige(etat.selection.de);
      etat.selection.x += (cible - etat.selection.x) * Math.min(1, dt * 16);
      continuer = true;
    }
    if ((etat.glisse && etat.glisse.actif) || etat.indice || etat.confettis.length || etat.anim) continuer = true;
    if (etat.conflit) { if (t - etat.conflit.t0 < 750) continuer = true; else etat.conflit = null; }
    dessinerPlateau(t);
    if (interfaceSale) majInterface();
    if (continuer) rafId = requestAnimationFrame(boucle); else dernierT = 0;
  }

  // ===========================================================================
  //  Partie : coups, chemin, annuler / rétablir
  // ===========================================================================
  function nouvellePartie(n, p) {
    etat.n = clamp(n | 0, 1, H.NMAX);
    etat.p = clamp(p | 0, H.PMIN, H.PMAX);
    etat.recherche = null;
    etat.sol = H.solutionCanonique(etat.n, etat.p);
    etat.indexCanon = H.indexerChemin(etat.n, etat.p, etat.sol.coups);
    etat.couleurs = paletteDisques(etat.n);
    etat.couleursCaisses = paletteCaisses(etat.n);
    el.champN.value = etat.n; el.valN.textContent = etat.n;
    el.champP.value = etat.p; el.valP.textContent = etat.p;
    reinitialiser();
    G = geometrie();
    redimensionner();
    majTable();
    majURL();
  }

  function reinitialiser() {
    arreterLecture();
    etat.anim = null;
    etat.pos = H.etatInitial(etat.n);
    etat.chemin = [];
    etat.curseur = 0;
    etat.planValide = false;
    etat.aide = false;
    etat.celebre = false;
    etat.essaiCompte = false;
    etat.victoireDeblocage = false;
    etat.chrono = { debut: null, fin: null };
    etat.selection = null;
    etat.glisse = null;
    etat.indice = null;
    etat.conflit = null;
    etat.confettis = [];
    masquerVictoire();
    masquerBulle();
    marquerInterface();
  }

  function recommencer() {
    const verrouAvant = solutionVerrouillee();
    reinitialiser();
    if (verrouAvant && !solutionVerrouillee()) {
      bulle(t('solutionDebloquee', { k: ESSAIS_SOLUTION, n: etat.n, disques: motDisques(etat.n), p: etat.p }), 'indice', 5000);
    }
    el.plateau.focus({ preventScroll: true });
  }

  // ===========================================================================
  //  Essais : le bouton « Solution » se débloque après ESSAIS_SOLUTION essais
  //  terminés avec la même configuration. Un essai commence au premier coup
  //  joué ; il est terminé quand la tour est réussie ou quand on recommence.
  // ===========================================================================
  function compterEssai() {
    if (etat.essaiCompte) return;
    etat.essaiCompte = true;
    const k = etat.n + ',' + etat.p;
    etat.essais[k] = (etat.essais[k] || 0) + 1;
    try { localStorage.setItem(CLE_ESSAIS, JSON.stringify(etat.essais)); } catch (_) { /* stockage indisponible */ }
  }
  function essaisTermines() {
    const total = etat.essais[etat.n + ',' + etat.p] || 0;
    return total - (etat.essaiCompte && !etat.celebre ? 1 : 0);
  }
  function solutionVerrouillee() {
    return !MODE_REPONSES && essaisTermines() < ESSAIS_SOLUTION;
  }

  function demarrerChrono() { if (etat.chrono.debut === null) etat.chrono.debut = performance.now(); }
  function secondesEcoulees() {
    const c = etat.chrono;
    if (c.debut === null) return 0;
    return ((c.fin !== null ? c.fin : performance.now()) - c.debut) / 1000;
  }
  function formatTemps(s) {
    s = Math.floor(s);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(r).padStart(2, '0');
  }

  const estResolu = () => H.estResolu(etat.pos, etat.n, etat.p - 1);
  const indexCanonique = () => { const j = etat.indexCanon.get(H.cle(etat.pos, etat.n)); return j === undefined ? -1 : j; };

  /** Coup du joueur (glisser-déposer, clic ou clavier), animé depuis (x0, y0). */
  function coupJoueur(de, vers, x0, y0) {
    const d = H.coupPermis(etat.pos, etat.n, etat.p, de, vers);
    if (!d) return false;
    const suivant = etat.chemin[etat.curseur];
    if (!(suivant && suivant.d === d && suivant.de === de && suivant.vers === vers)) {
      etat.chemin.length = etat.curseur;
      etat.chemin.push({ d, de, vers });
      etat.planValide = false;
    }
    demarrerChrono();
    compterEssai();
    etat.pos[d] = vers;
    etat.curseur++;
    etat.indice = null;
    const k = compter(vers) - 1;
    animer(d, x0, y0, G.xTige(vers), G.yNiveau(k), undefined, () => {
      son('coup', d);
      if (estResolu()) resolution();
      marquerInterface();
    });
    annoncer(t('annonceCoup', { d, de: LETTRES[de], vers: LETTRES[vers], c: etat.curseur, coups: motCoups(etat.curseur) }));
    marquerInterface();
    return true;
  }

  /** Joue le coup suivant du chemin (solution ou rétablir). */
  function avancer(anime, duree, fin) {
    const c = etat.chemin[etat.curseur];
    if (!c || H.coupPermis(etat.pos, etat.n, etat.p, c.de, c.vers) !== c.d) { arreterLecture(); return false; }
    demarrerChrono();
    const k0 = compter(c.de) - 1;
    etat.pos[c.d] = c.vers;
    etat.curseur++;
    etat.indice = null;
    if (anime && G) {
      const k1 = compter(c.vers) - 1;
      animer(c.d, G.xTige(c.de), G.yNiveau(k0), G.xTige(c.vers), G.yNiveau(k1), duree, () => { son('coup', c.d); if (fin) fin(); });
    } else {
      son('coup', c.d);
      if (fin) fin();
    }
    marquerInterface();
    return true;
  }

  function reculer(anime) {
    if (etat.curseur <= 0) return;
    if (etat.anim) finirAnim();
    const c = etat.chemin[etat.curseur - 1];
    const k0 = compter(c.vers) - 1;
    etat.pos[c.d] = c.de;
    etat.curseur--;
    etat.indice = null;
    if (anime && G) {
      const k1 = compter(c.de) - 1;
      animer(c.d, G.xTige(c.vers), G.yNiveau(k0), G.xTige(c.de), G.yNiveau(k1), undefined, () => son('coup', c.d));
    }
    marquerInterface();
  }

  function preparerAction() {
    if (etat.lecture.active) pauseLecture();
    if (etat.anim) finirAnim();
    if (etat.selection) { etat.selection = null; }
    masquerVictoire();
  }

  function annuler() {
    preparerAction();
    if (etat.curseur > 0) reculer(true);
  }
  function retablir() {
    preparerAction();
    if (etat.curseur < etat.chemin.length) avancer(true, undefined, () => { if (estResolu()) resolution(); marquerInterface(); });
  }

  /** Aller directement au coup k du chemin (bande des coups), sans animation. */
  function allerA(k) {
    k = clamp(k, 0, etat.chemin.length);
    if (etat.anim) finirAnim();
    etat.selection = null;
    if (k === etat.curseur) return;
    if (k > etat.curseur) {
      for (let i = etat.curseur; i < k; i++) etat.pos[etat.chemin[i].d] = etat.chemin[i].vers;
    } else {
      for (let i = etat.curseur - 1; i >= k; i--) etat.pos[etat.chemin[i].d] = etat.chemin[i].de;
    }
    etat.curseur = k;
    etat.indice = null;
    if (estResolu() && etat.chrono.debut !== null && etat.chrono.fin === null) etat.chrono.fin = performance.now();
    marquerInterface();
  }

  function resolution() {
    if (etat.chrono.debut !== null && etat.chrono.fin === null) etat.chrono.fin = performance.now();
    if (etat.celebre) return;
    const verrouAvant = solutionVerrouillee();
    etat.celebre = true;
    etat.victoireDeblocage = verrouAvant && !solutionVerrouillee();
    const ameliore = !etat.aide && enregistrerRecord(etat.curseur);
    remplirVictoire();
    el.victoire.hidden = false;
    lancerConfettis();
    son('victoire');
    annoncer(t('annonceVictoire', { c: etat.curseur, coups: motCoups(etat.curseur) }));
    majTable(ameliore ? etat.n + ',' + etat.p : null);
    marquerInterface();
  }

  function remplirVictoire() {
    const c = etat.curseur, m = H.phi(etat.n, etat.p);
    const prm = { c: fmt(c), m: fmt(m), coups: motCoups(c) };
    let txt;
    const demontre = H.minimumDemontre(etat.n, etat.p);
    if (etat.aide) txt = t('victoireAide', prm);
    else if (c < m) txt = t('victoireMoins', prm);
    else if (MODE_REPONSES) txt = c === m ? t(demontre ? 'victoireMin' : 'victoireMinConj', prm) : t('victoirePlus', prm);
    else txt = c === m ? t(demontre ? 'victoireMinD' : 'victoireMinConjD', prm) : t('victoirePlusD', prm);
    if (etat.victoireDeblocage) txt += t('victoireDeblocage', { k: ESSAIS_SOLUTION });
    el.victoireTitre.textContent = t('bravo');
    el.victoireTexte.innerHTML = txt;
    let suite = null;
    if (etat.n < H.NMAX) suite = { n: etat.n + 1, p: etat.p, texte: t('essayerDisques', { n: etat.n + 1 }) };
    else if (etat.p < H.PMAX) suite = { n: etat.n, p: etat.p + 1, texte: t('essayerTiges', { p: etat.p + 1 }) };
    el.btnPlus.hidden = !suite;
    if (suite) { el.btnPlus.textContent = suite.texte; el.btnPlus.dataset.n = suite.n; el.btnPlus.dataset.p = suite.p; }
  }
  function masquerVictoire() { el.victoire.hidden = true; }

  // ===========================================================================
  //  Records (localStorage, si disponible)
  // ===========================================================================
  function chargerRecords() {
    try { etat.records = JSON.parse(localStorage.getItem(CLE_RECORDS) || '{}') || {}; } catch (_) { etat.records = {}; }
    try { etat.essais = JSON.parse(localStorage.getItem(CLE_ESSAIS) || '{}') || {}; } catch (_) { etat.essais = {}; }
  }
  function enregistrerRecord(c) {
    const k = etat.n + ',' + etat.p;
    if (k in etat.records && c >= etat.records[k]) return false;
    etat.records[k] = c;
    try { localStorage.setItem(CLE_RECORDS, JSON.stringify(etat.records)); } catch (_) { /* stockage indisponible */ }
    return true;
  }

  // ===========================================================================
  //  Solution, indice et recherche exhaustive
  // ===========================================================================
  function majVitesse() {
    const v = VITESSES[etat.lecture.vitesse];
    el.vitesse.value = etat.lecture.vitesse;
    el.valVitesse.textContent = t('vitesse', { v: fmt(v), coups: motCoups(v) });
  }
  function changerVitesse(dv) {
    etat.lecture.vitesse = clamp(etat.lecture.vitesse + dv, 0, VITESSES.length - 1);
    etat.lecture.auto = false;
    majVitesse();
  }
  function vitesseAuto(reste) {
    const cible = Math.max(1, reste / 20);
    let i = 0;
    while (i < VITESSES.length - 1 && VITESSES[i] < cible) i++;
    return i;
  }

  function demarrerLecture() {
    const L = etat.lecture;
    if (etat.curseur >= etat.chemin.length) return;
    if (L.auto) { L.vitesse = vitesseAuto(etat.chemin.length - etat.curseur); majVitesse(); }
    L.active = true;
    L.prochain = performance.now() + 120;
    L.reste = 0;
    L.dernier = 0;
    etat.selection = null;
    marquerInterface();
  }
  function pauseLecture() { etat.lecture.active = false; marquerInterface(); }
  function arreterLecture() { etat.lecture.active = false; }

  function avancerLecture(t) {
    const L = etat.lecture;
    const v = VITESSES[L.vitesse];
    const intervalle = 1000 / v;
    if (intervalle >= 50) {
      if (etat.anim) return;   // on attend que le disque soit posé
      if (etat.curseur >= etat.chemin.length) { finLecture(); return; }
      if (t < L.prochain) return;
      L.prochain = t + intervalle;
      avancer(true, Math.min(intervalle * 0.82, 650), () => { if (etat.curseur >= etat.chemin.length) finLecture(); });
    } else {
      if (etat.anim) finirAnim();
      if (etat.curseur >= etat.chemin.length) { finLecture(); return; }
      const dt = L.dernier ? Math.min(100, t - L.dernier) : 16;
      L.dernier = t;
      L.reste += dt * v / 1000;
      let k = Math.min(Math.floor(L.reste), etat.chemin.length - etat.curseur);
      L.reste -= Math.floor(L.reste);
      while (k-- > 0) if (!avancer(false)) break;
      if (etat.curseur >= etat.chemin.length) finLecture();
    }
  }
  function finLecture() {
    if (!etat.lecture.active) return;
    etat.lecture.active = false;
    if (estResolu()) resolution();
    marquerInterface();
  }

  /** Lance une recherche exhaustive (p ≥ 4) en tranches, sans bloquer la page. */
  function obtenirTable(rappel) {
    const cle = etat.n + ',' + etat.p;
    if (tables.has(cle)) { rappel(tables.get(cle)); return; }
    if (etat.recherche && etat.recherche.cle === cle) { etat.recherche.rappels.push(rappel); return; }
    const n = etat.n, p = etat.p;
    const gen = H.rechercheEnLargeur(n, p, p - 1, 20000);
    const r = { cle, rappels: [rappel] };
    etat.recherche = r;
    const total = fmt(H.nbConfigurations(n, p));
    const etape = () => {
      if (etat.recherche !== r) return;
      const t0 = performance.now();
      let res = gen.next();
      while (!res.done && performance.now() - t0 < 14) res = gen.next();
      if (res.done) {
        tables.set(cle, res.value);
        if (tables.size > 4) tables.delete(tables.keys().next().value);
        etat.recherche = null;
        bulle(t('rechercheFinie', { total }), null, 2600);
        r.rappels.forEach((f) => f(res.value));
      } else {
        bulle(t('recherche', { pc: Math.round(res.value * 100), total }), null, 4000);
        setTimeout(etape, 0);
      }
    };
    bulle(t('recherche', { pc: 0, total }), null, 4000);
    setTimeout(etape, 0);
  }

  /** Coup optimal depuis la position actuelle, ou null si la recherche doit d'abord se faire. */
  function coupOptimal() {
    const n = etat.n, p = etat.p;
    const j = indexCanonique();
    const tab = tables.get(n + ',' + p);
    if (j >= 0 && j < etat.sol.coups.length) {
      return { coup: etat.sol.coups[j], reste: etat.sol.coups.length - j, exact: H.minimumDemontre(n, p) || !!tab };
    }
    if (p === 3) { const r = H.prochainCoup3(etat.pos, n, 2); return { coup: r.coup, reste: r.reste, exact: true }; }
    if (tab) { const r = H.prochainCoupTable(etat.pos, n, p, tab.dist); return { coup: r.coup, reste: r.reste, exact: true }; }
    if (H.rechercheFaisable(n, p)) return { attente: true };
    return { impossible: true };
  }

  function donnerIndice() {
    preparerAction();
    if (estResolu()) { bulle(t('dejaResolu'), null, 2600); return; }
    const r = coupOptimal();
    if (r.attente) { obtenirTable(() => donnerIndice()); return; }
    if (r.impossible) {
      bulle(t('indiceImpossible', { p: etat.p, n: etat.n, total: fmt(H.nbConfigurations(etat.n, etat.p)) }), 'erreur', 7000);
      return;
    }
    if (!r.coup) return;
    etat.aide = true;
    etat.indice = { d: r.coup.d, de: r.coup.de, vers: r.coup.vers };
    const cleIndice = etat.theme === 'caisses' ? 'indiceCaisse' : 'indiceDisque';
    const reste = MODE_REPONSES ? ' ' + t(r.exact ? 'resteMin' : 'resteFS', { r: fmt(r.reste), coups: motCoups(r.reste) }) : '';
    bulle(t(cleIndice, { d: r.coup.d, de: LETTRES[r.coup.de], vers: LETTRES[r.coup.vers] }) + reste, 'indice', 7000);
    marquerInterface();
  }

  function basculerSolution() {
    if (etat.lecture.active) { pauseLecture(); return; }
    if (solutionVerrouillee()) {
      const r = ESSAIS_SOLUTION - essaisTermines();
      bulle(t('explicationVerrou', { k: ESSAIS_SOLUTION, n: etat.n, disques: motDisques(etat.n), p: etat.p, r }), 'indice', 6000);
      return;
    }
    preparerAction();
    const n = etat.n, p = etat.p;
    if (estResolu()) {
      // Revoir la solution depuis le début
      etat.chemin = etat.sol.coups.slice();
      etat.pos = H.etatInitial(n);
      etat.curseur = 0;
      etat.planValide = true;
      etat.aide = true;
      demarrerLecture();
      return;
    }
    if (etat.planValide && etat.curseur < etat.chemin.length) { etat.aide = true; demarrerLecture(); return; }
    const j = indexCanonique();
    let plan = null;
    if (j >= 0) plan = etat.sol.coups.slice(j);
    else if (p === 3) plan = H.cheminOptimal3(etat.pos, n, 2);
    else {
      const tab = tables.get(n + ',' + p);
      if (tab) plan = H.cheminOptimalTable(etat.pos, n, p, tab.dist);
      else if (H.rechercheFaisable(n, p)) { obtenirTable(() => basculerSolution()); return; }
    }
    if (plan) {
      etat.chemin.length = etat.curseur;
      etat.chemin.push(...plan);
      if (j < 0) bulle(MODE_REPONSES ? t('solutionCalculee', { r: fmt(plan.length), coups: motCoups(plan.length) }) : t('solutionCalculeeD'), null, 3200);
    } else {
      bulle(t('solutionDepart', { total: fmt(H.nbConfigurations(n, p)) }), null, 5000);
      etat.chemin = etat.sol.coups.slice();
      etat.pos = H.etatInitial(n);
      etat.curseur = 0;
    }
    etat.planValide = true;
    etat.aide = true;
    demarrerLecture();
  }

  // ===========================================================================
  //  Bulles et annonces
  // ===========================================================================
  let minuterieBulle = 0;
  function bulle(html, type, duree) {
    el.bulle.className = 'bulle' + (type ? ' ' + type : '');
    el.bulle.innerHTML = html;
    if (el.bulle.hidden) {
      el.bulle.hidden = false;
    } else {
      el.bulle.style.animation = 'none';
      void el.bulle.offsetHeight;
      el.bulle.style.animation = '';
    }
    clearTimeout(minuterieBulle);
    minuterieBulle = setTimeout(() => { el.bulle.hidden = true; }, duree || 3200);
  }
  function masquerBulle() { clearTimeout(minuterieBulle); el.bulle.hidden = true; }
  function annoncer(txt) {
    if (etat.lecture.active && VITESSES[etat.lecture.vitesse] > 2) return;
    el.annonce.textContent = txt;
  }

  // ===========================================================================
  //  Mise à jour du panneau
  // ===========================================================================
  function majInterface() {
    interfaceSale = false;
    const n = etat.n, p = etat.p, c = etat.curseur, m = H.phi(n, p);
    const resolu = estResolu();
    el.hudCoups.textContent = fmt(c);
    el.hudCoupsMot.textContent = motCoups(c);
    el.hudMin.textContent = fmt(m);
    el.hudConfig.textContent = t('configHud', { n, disques: motDisques(n), p });
    el.hudGauche.classList.toggle('resolu', resolu);
    const recHud = etat.records[n + ',' + p];
    el.hudRecordZone.hidden = recHud === undefined;
    if (recHud !== undefined) el.hudRecord.textContent = fmt(recHud);
    el.valCoups.textContent = fmt(c);
    el.valMin.textContent = fmt(m);
    const demontre = H.minimumDemontre(n, p);
    el.badgeMin.textContent = demontre ? t('badgeDemontre') : t('badgeConjecture');
    el.badgeMin.className = 'badge' + (demontre ? '' : ' conjecture');
    el.badgeMin.title = demontre ? t('titreDemontre') : t('titreConjecture');
    const rec = etat.records[n + ',' + p];
    el.valRecord.innerHTML = rec === undefined ? '—' : fmt(rec) + (rec <= m ? ' <span class="coche">✓</span>' : '');
    el.formuleMin.innerHTML = formuleMinimum();
    el.noteAide.hidden = !etat.aide;
    majTemps();
    el.btnAnnuler.disabled = c === 0;
    el.btnRetablir.disabled = c >= etat.chemin.length;
    const verrou = solutionVerrouillee(), faits = essaisTermines();
    el.btnSolution.classList.toggle('verrouille', verrou);
    el.btnSolution.setAttribute('aria-disabled', verrou ? 'true' : 'false');
    if (verrou) {
      el.btnSolution.innerHTML = CADENAS + t('solutionVerrou', { c: faits, k: ESSAIS_SOLUTION });
      el.btnSolution.title = t('titreSolutionVerrou', { c: faits, k: ESSAIS_SOLUTION });
    } else {
      el.btnSolution.innerHTML = etat.lecture.active ? t('pause')
        : (etat.planValide && c > 0 && c < etat.chemin.length ? t('reprendre') : t('solution'));
      el.btnSolution.title = (TRAD[etat.langue]['title:btnSolution'] || TRAD.fr['title:btnSolution'] || '');
    }
    el.btnSolution.classList.toggle('actif', etat.lecture.active);
    el.valEssais.textContent = MODE_REPONSES || !verrou ? fmt(faits) : t('essaisVal', { c: faits, k: ESSAIS_SOLUTION });
    el.bandeInfo.textContent = etat.chemin.length > c
      ? t('bandeInfo', { c: fmt(c), t: fmt(etat.chemin.length), coups: motCoups(etat.chemin.length) })
      : (c ? t('bandeInfo1', { c: fmt(c), coups: motCoups(c) }) : '');
    majPile();
    dessinerBande();
  }

  function majTemps() {
    const s = formatTemps(secondesEcoulees());
    el.valTemps.textContent = s;
    el.hudTemps.textContent = s;
  }

  function formuleMinimum() {
    const n = etat.n, p = etat.p, m = H.phi(n, p);
    if (p === 3) return '<span class="math">2<sup>' + n + '</sup> − 1 = ' + fmt(m) + '</span>';
    if (n === 1) return '<span class="math">Φ(1, ' + p + ') = 1</span>';
    const l = H.partage(n, p);
    return '<span class="math">Φ(' + n + ', ' + p + ') = 2&thinsp;Φ(' + l + ', ' + p + ') + Φ(' + (n - l) + ', ' + (p - 1) + ') = 2 × '
      + fmt(H.phi(l, p)) + ' + ' + fmt(H.phi(n - l, p - 1)) + ' = ' + fmt(m) + '</span>';
  }

  /** Pile des appels récursifs pour le prochain coup de la solution canonique.
   *  Pendant une partie libre, on ne la montre pas (elle donnerait le prochain
   *  coup optimal) : on pose plutôt une question, sauf en mode enseignant. */
  function majPile() {
    const n = etat.n, p = etat.p, sol = etat.sol, Z = LETTRES[p - 1];
    const j = indexCanonique();
    const montrer = etat.lecture.active || (j > 0 && (MODE_REPONSES || etat.aide));
    if (!montrer) {
      let txt;
      const v = solutionVerrouillee();
      if (!MODE_REPONSES) {
        txt = n === 1 ? t('pileDecouverte1')
          : p === 3 ? t('pileDecouverte3', { n, m: n - 1, Z, suite: t(v ? 'suite3V' : 'suite3', { k: ESSAIS_SOLUTION }) })
            : t('pileDecouverteFS', { p, suite: t(v ? 'suiteFSV' : 'suiteFS', { k: ESSAIS_SOLUTION }) });
      } else if (n === 1) txt = t('explication1', { Z });
      else if (p === 3) txt = t('explication3', { n, m: n - 1, m2: Math.max(1, n - 2), Z });
      else {
        const l = H.partage(n, p);
        txt = t('explicationFS', { l, p, k: n - l, q: p - 1, Z });
      }
      const hors = MODE_REPONSES && j < 0 ? '<p class="explication">' + t(p === 3 ? 'horsChemin3' : 'horsCheminFS') + '</p><p class="resume"></p>' : '';
      el.pile.innerHTML = hors + '<p class="explication">' + txt + '</p>';
      return;
    }
    if (j < 0) { el.pile.innerHTML = '<p class="explication">' + t('pileCalculee') + '</p>'; return; }
    if (j >= sol.coups.length) {
      el.pile.innerHTML = '<p class="explication">' + t('termine', { m: fmt(sol.coups.length), coups: motCoups(sol.coups.length) }) + '</p>';
      return;
    }
    const ids = H.pileAppels(sol, j);
    const lignes = [];
    for (let k = 0; k < ids.length; k++) {
      const nd = sol.noeuds[ids[k]];
      if (k === ids.length - 1) {
        const cle = etat.theme === 'caisses' ? 'feuilleCaisse' : 'feuilleDisque';
        lignes.push('<div class="appel feuille" style="--niv:' + k + '"><span class="etapes">▶</span><span class="texte">'
          + t(cle, { d: nd.lo, de: LETTRES[nd.de], vers: LETTRES[nd.vers] }) + '</span></div>');
        break;
      }
      const rang = sol.noeuds[ids[k + 1]].rang;
      let points = '';
      for (let r = 0; r < 3; r++) points += '<span class="' + (r < rang ? 'fait' : r === rang ? 'en-cours' : '') + '">●</span>';
      const kd = nd.hi - nd.lo + 1;
      const objets = etat.theme === 'caisses' ? (etat.langue === 'fr' ? 'caisses' : 'crates') : motDisques(kd);
      const texte = nd.q === 3 ? t('appel3', { k: kd, objets, de: LETTRES[nd.de], vers: LETTRES[nd.vers] })
        : t('appelFS', { k: kd, objets, de: LETTRES[nd.de], vers: LETTRES[nd.vers], q: nd.q, l: nd.l });
      lignes.push('<div class="appel" style="--niv:' + k + '"><span class="etapes">' + points + '</span><span class="texte">' + texte + '</span></div>');
    }
    let affichees = lignes;
    if (lignes.length > 10) {
      affichees = lignes.slice(0, 3).concat(['<div class="ellipse" style="--niv:3">' + t('niveauxCaches', { k: lignes.length - 8 }) + '</div>'], lignes.slice(-5));
    }
    el.pile.innerHTML = affichees.join('') + '<p class="resume">' + t('resumePile', { i: fmt(j + 1), m: fmt(sol.coups.length) }) + '</p>';
  }

  // ===========================================================================
  //  Bande « Quel disque bouge ? »
  // ===========================================================================
  let survolBande = -1, glisseBande = false;
  function uniteBande() {
    const S = surfaces.bande;
    return S ? Math.min(16, S.w / Math.max(1, etat.chemin.length)) : 1;
  }
  function dessinerBande() {
    const S = surfaces.bande;
    if (!S) return;
    const ctx = S.ctx, W = S.w, Hh = S.h;
    ctx.clearRect(0, 0, W, Hh);
    const M = etat.chemin.length, c = etat.curseur, n = etat.n;
    ctx.fillStyle = C.bord;
    ctx.fillRect(0, Hh - 1, W, 1);
    if (!M) {
      ctx.fillStyle = C.texte2;
      ctx.font = '12.5px ' + POLICE_UI;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(t('bandeVide'), 2, Hh / 2);
      return;
    }
    const hMax = Hh - 7;
    const hauteur = (d) => Math.max(3, Math.round((d / n) * hMax));
    const u = uniteBande();
    if (u >= 2.5) {
      const gap = u >= 6 ? 2 : 1;
      for (let i = 0; i < M; i++) {
        const d = etat.chemin[i].d, h = hauteur(d);
        ctx.fillStyle = i < c ? etat.couleurs[d].base : C.fantome;
        const w = Math.max(1, u - gap);
        const r = Math.min(3, w / 2);
        const x = i * u, y = Hh - 1 - h;
        ctx.beginPath();
        ctx.moveTo(x, Hh - 1);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, Hh - 1);
        ctx.closePath();
        ctx.fill();
        if (i === survolBande) { ctx.strokeStyle = C.texte; ctx.lineWidth = 1; ctx.stroke(); }
      }
    } else {
      // une colonne de pixels regroupe plusieurs coups : on garde le plus grand disque
      const colonnes = Math.max(1, Math.floor(W));
      const pas = M / colonnes;
      for (let x = 0; x < colonnes; x++) {
        const i0 = Math.floor(x * pas), i1 = Math.max(i0 + 1, Math.floor((x + 1) * pas));
        if (i0 >= M) break;
        let dMax = 0;
        for (let i = i0; i < i1 && i < M; i++) if (etat.chemin[i].d > dMax) dMax = etat.chemin[i].d;
        ctx.fillStyle = i0 < c ? etat.couleurs[dMax].base : C.fantome;
        const h = hauteur(dMax);
        ctx.fillRect(x, Hh - 1 - h, 1, h);
      }
    }
    // curseur
    const xc = Math.round(Math.min(c * (u >= 2.5 ? u : W / M), W - 1)) + 0.5;
    if (c < M || M * u < W - 2) {
      ctx.strokeStyle = C.texte;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xc, 3);
      ctx.lineTo(xc, Hh - 1);
      ctx.stroke();
      ctx.fillStyle = C.texte;
      ctx.beginPath();
      ctx.moveTo(xc - 4, 0);
      ctx.lineTo(xc + 4, 0);
      ctx.lineTo(xc, 5);
      ctx.closePath();
      ctx.fill();
    }
  }
  function indexBande(x) {
    const S = surfaces.bande;
    const M = etat.chemin.length;
    if (!S || !M) return 0;
    const u = uniteBande();
    const largeur = u >= 2.5 ? u : S.w / M;
    return clamp(Math.round(x / largeur), 0, M);
  }
  function infoBande(x) {
    const S = surfaces.bande;
    const M = etat.chemin.length;
    if (!S || !M) { el.bulleBande.hidden = true; return; }
    const u = uniteBande();
    const largeur = u >= 2.5 ? u : S.w / M;
    const i = Math.floor(x / largeur);
    if (i < 0 || i >= M) { el.bulleBande.hidden = true; if (survolBande !== -1) { survolBande = -1; dessinerBande(); } return; }
    const cp = etat.chemin[i];
    el.bulleBande.textContent = t(i < etat.curseur ? 'bulleBande' : 'bulleBandeFutur',
      { i: fmt(i + 1), d: cp.d, de: LETTRES[cp.de], vers: LETTRES[cp.vers] });
    el.bulleBande.hidden = false;
    const bw = el.bulleBande.offsetWidth;
    el.bulleBande.style.left = clamp((i + 0.5) * largeur, bw / 2, S.w - bw / 2) + 'px';
    if (survolBande !== i) { survolBande = i; dessinerBande(); }
  }

  // ===========================================================================
  //  Tableau des minimums
  // ===========================================================================
  function construireTable() {
    let h = '<tr><th class="coin">' + t('coinTable') + '</th>';
    for (let p = H.PMIN; p <= H.PMAX; p++) h += '<th>' + p + '</th>';
    el.table.tHead.innerHTML = h + '</tr>';
    let b = '';
    for (let n = 1; n <= H.NMAX; n++) {
      b += '<tr data-n="' + n + '"><th>' + n + '</th>';
      for (let p = H.PMIN; p <= H.PMAX; p++) b += '<td data-n="' + n + '" data-p="' + p + '"></td>';
      b += '</tr>';
    }
    el.table.tBodies[0].innerHTML = b;
    majTable();
  }

  /** Remplit le tableau : les résultats de l'élève (ou les minimums avec ?reponses=1). */
  function majTable(nouvelle) {
    el.table.querySelectorAll('tbody tr').forEach((tr) => tr.classList.toggle('ligne-active', +tr.dataset.n === etat.n));
    el.table.querySelectorAll('tbody td').forEach((td) => {
      const n = +td.dataset.n, p = +td.dataset.p;
      const m = H.phi(n, p), rec = etat.records[n + ',' + p];
      const optimal = rec !== undefined && rec <= m;
      const coche = optimal ? ' <span class="coche">✓</span>' : '';
      td.classList.toggle('active', n === etat.n && p === etat.p);
      td.classList.toggle('colonne-active', p === etat.p && n !== etat.n);
      if (MODE_REPONSES) {
        td.classList.toggle('conj', !H.minimumDemontre(n, p));
        td.innerHTML = fmt(m) + coche;
        td.title = t('titreCase', { n, disques: motDisques(n), p, m: fmt(m), coups: motCoups(m) });
      } else {
        td.classList.toggle('vide', rec === undefined);
        td.classList.toggle('optimal', optimal);
        td.innerHTML = rec === undefined ? '·' : fmt(rec) + coche;
        td.title = rec === undefined ? t('caseVide', { n, disques: motDisques(n), p })
          : t(optimal ? 'caseRecordMin' : 'caseRecord', { n, disques: motDisques(n), p, r: fmt(rec), coups: motCoups(rec) });
      }
      if (nouvelle && nouvelle === n + ',' + p) {
        td.classList.remove('nouveau');
        void td.offsetWidth;
        td.classList.add('nouveau');
      }
    });
    el.noteTable.innerHTML = t(MODE_REPONSES ? 'noteTableR' : 'noteTableD');
    el.btnEffacer.disabled = Object.keys(etat.records).length === 0 && Object.keys(etat.essais).length === 0;
    majDefi();
    const actif = el.table.querySelector('td.active');
    if (actif) {
      const cont = el.table.parentElement;
      const r = actif.getBoundingClientRect(), rc = cont.getBoundingClientRect();
      if (r.top < rc.top + 22 || r.bottom > rc.bottom) cont.scrollTop += r.top - rc.top - rc.height / 2;
    }
  }

  /** Question qui guide l'élève d'après les cases déjà remplies. */
  function majDefi() {
    if (MODE_REPONSES) return;
    const r = etat.records;
    const colonne = [];
    for (let n = 1; n <= H.NMAX && r[n + ',3'] !== undefined; n++) colonne.push(r[n + ',3']);
    const liste = colonne.map(fmt).join(', ');
    let txt;
    if (!Object.keys(r).length) txt = t('defiDebut');
    else if (colonne.length < 3) txt = t('defiSuite', { k: colonne.length + 1, disques: motDisques(colonne.length + 1) });
    else if (!colonne.every((v, i) => v <= H.phi(i + 1, 3))) txt = t('defiAmeliorer', { liste });
    else {
      txt = t('defiRegularite', { liste, k: colonne.length + 1 });
      if (!Object.keys(r).some((k) => !k.endsWith(',3'))) txt += t('defiTiges');
    }
    el.defi.innerHTML = txt;
  }

  /** « Effacer mes résultats » : il faut cliquer deux fois (ordinateurs partagés en classe). */
  let minuterieEffacer = 0;
  function majBoutonEffacer(confirmer) {
    el.btnEffacer.textContent = t(confirmer ? 'effacerConfirmer' : 'effacer');
    el.btnEffacer.classList.toggle('danger', !!confirmer);
  }
  el.btnEffacer.addEventListener('click', () => {
    if (!minuterieEffacer) {
      majBoutonEffacer(true);
      minuterieEffacer = setTimeout(() => { minuterieEffacer = 0; majBoutonEffacer(false); }, 4000);
      return;
    }
    clearTimeout(minuterieEffacer);
    minuterieEffacer = 0;
    majBoutonEffacer(false);
    if (etat.lecture.active) pauseLecture();
    etat.records = {};
    etat.essais = {};
    etat.essaiCompte = false;
    try { localStorage.removeItem(CLE_RECORDS); localStorage.removeItem(CLE_ESSAIS); } catch (_) { /* stockage indisponible */ }
    majTable();
    marquerInterface();
    bulle(t('resultatsEffaces'), null, 2600);
  });

  // ===========================================================================
  //  Redimensionnement
  // ===========================================================================
  function redimensionner() {
    if (etat.anim) finirAnim();
    ajuster('plateau', el.plateau);
    ajuster('bande', el.bande);
    G = geometrie();
    if (etat.selection && G) etat.selection.x = G.xTige(etat.selection.de);
    marquerInterface();
  }

  // ===========================================================================
  //  Souris, doigt et stylet sur le plateau
  // ===========================================================================
  function coordonnees(e) {
    const r = el.plateau.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  function prendre(i) {
    const d = sommet(i);
    if (!d) return;
    const k = compter(i) - 1;
    animer(d, G.xTige(i), G.yNiveau(k), G.xTige(i), G.yLevage, clamp(140 + (G.yNiveau(k) - G.yLevage) * 0.25, 140, 260) * (REDUIT ? 0.4 : 1), () => {
      etat.selection = { d, de: i, x: G.xTige(i) };
      demander();
    });
    annoncer(t('annoncePris', { d, t: LETTRES[i] }));
  }
  function reposerSelection() {
    const s = etat.selection;
    if (!s) return;
    etat.selection = null;
    animer(s.d, s.x, G.yLevage, G.xTige(s.de), G.yNiveau(compter(s.de) - 1));
  }
  function signalerInterdit(d, i) {
    const e = sommet(i);
    etat.conflit = { d: e, t0: performance.now() };
    bulle(t(etat.theme === 'caisses' ? 'interditCaisses' : 'interditDisques', { d, e }), 'erreur', 3200);
    son('erreur');
    demander();
  }

  /** Clic (ou touche) sur la tige i : prendre le disque, ou le poser. */
  function clicTige(i) {
    if (i < 0) { reposerSelection(); return; }
    const s = etat.selection;
    if (!s) {
      if (!sommet(i)) { bulle(t(etat.theme === 'caisses' ? 'zoneVide' : 'tigeVide', { t: LETTRES[i] }), 'erreur', 2200); return; }
      prendre(i);
      return;
    }
    if (i === s.de) { reposerSelection(); return; }
    if (H.coupPermis(etat.pos, etat.n, etat.p, s.de, i)) {
      etat.selection = null;
      coupJoueur(s.de, i, s.x, G.yLevage);
      return;
    }
    signalerInterdit(s.d, i);
  }

  el.plateau.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    el.plateau.focus({ preventScroll: true });
    etat.clavier = false;
    masquerVictoire();
    if (etat.lecture.active) { pauseLecture(); etat.appui = null; return; }
    if (etat.anim) finirAnim();
    const [x, y] = coordonnees(e);
    const i = tigeSous(x);
    etat.appui = { x, y, i, id: e.pointerId };
    etat.glisse = null;
    if (!etat.selection && i >= 0) {
      const d = sommet(i);
      if (d) {
        const k = compter(i) - 1;
        const yd = G.yNiveau(k);
        // on « attrape » le disque là où on appuie, sinon par son centre
        const surDisque = Math.abs(y - yd) <= G.dh && Math.abs(x - G.xTige(i)) <= G.largeur(d) / 2 + 6;
        etat.glisse = { d, de: i, x, y, ox: surDisque ? G.xTige(i) - x : 0, oy: surDisque ? yd - y : 0, actif: false, id: e.pointerId };
      }
    }
    try { el.plateau.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
    e.preventDefault();
  });

  el.plateau.addEventListener('pointermove', (e) => {
    const [x, y] = coordonnees(e);
    etat.souris = e.pointerType === 'mouse';
    const i = tigeSous(x);
    if (i !== etat.survol) { etat.survol = i; if (e.pointerType === 'mouse') etat.clavier = false; demander(); }
    const g = etat.glisse;
    if (g && g.id === e.pointerId && etat.appui) {
      if (!g.actif && Math.hypot(x - etat.appui.x, y - etat.appui.y) > 5) {
        g.actif = true;
        el.plateau.classList.add('saisie');
      }
      if (g.actif) { g.x = x; g.y = y; demander(); }
    }
  });

  function finAppui(e, annule) {
    if (!etat.appui || etat.appui.id !== e.pointerId) return;
    const [x] = coordonnees(e);
    const i = tigeSous(x);
    const g = etat.glisse;
    etat.glisse = null;
    etat.appui = null;
    el.plateau.classList.remove('saisie');
    if (g && g.actif) {
      const xd = g.x + g.ox, yd = g.y + g.oy;
      if (!annule && i >= 0 && i !== g.de) {
        if (H.coupPermis(etat.pos, etat.n, etat.p, g.de, i)) { coupJoueur(g.de, i, xd, yd); return; }
        signalerInterdit(g.d, i);
      }
      animer(g.d, xd, yd, G.xTige(g.de), G.yNiveau(compter(g.de) - 1));
      return;
    }
    if (!annule) clicTige(i);
  }
  el.plateau.addEventListener('pointerup', (e) => finAppui(e, false));
  el.plateau.addEventListener('pointercancel', (e) => finAppui(e, true));
  el.plateau.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse' && !etat.glisse) { etat.survol = -1; demander(); }
  });
  el.plateau.addEventListener('blur', () => { if (etat.clavier) { etat.clavier = false; demander(); } });

  // --- Bande des coups ------------------------------------------------------
  el.bande.addEventListener('pointerdown', (e) => {
    if (!etat.chemin.length) return;
    if (etat.lecture.active) pauseLecture();
    masquerVictoire();
    glisseBande = true;
    try { el.bande.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
    const x = e.clientX - el.bande.getBoundingClientRect().left;
    allerA(indexBande(x));
    infoBande(x);
    e.preventDefault();
  });
  el.bande.addEventListener('pointermove', (e) => {
    const x = e.clientX - el.bande.getBoundingClientRect().left;
    if (glisseBande) allerA(indexBande(x));
    infoBande(x);
  });
  const finBande = () => { glisseBande = false; };
  el.bande.addEventListener('pointerup', finBande);
  el.bande.addEventListener('pointercancel', finBande);
  el.bande.addEventListener('pointerleave', () => {
    if (!glisseBande) { el.bulleBande.hidden = true; if (survolBande !== -1) { survolBande = -1; dessinerBande(); } }
  });

  // ===========================================================================
  //  Clavier
  // ===========================================================================
  function actionClavierTige(i) {
    etat.clavier = true;
    etat.survol = i;
    masquerVictoire();
    if (etat.lecture.active) pauseLecture();
    if (etat.anim) finirAnim();
    clicTige(i);
    demander();
  }
  function deplacerCurseur(dx) {
    etat.clavier = true;
    const base = etat.survol >= 0 ? etat.survol : (etat.selection ? etat.selection.de : 0);
    etat.survol = (base + dx + etat.p) % etat.p;
    demander();
  }

  document.addEventListener('keydown', (e) => {
    const cible = e.target;
    if (el.aide.open) { if (e.key === '?') { el.aide.close(); e.preventDefault(); } return; }
    const mod = e.ctrlKey || e.metaKey;
    const touche = e.key;
    const champ = cible && (cible.tagName === 'INPUT' || cible.tagName === 'SELECT' || cible.tagName === 'TEXTAREA');
    if (mod && !e.altKey && (touche === 'z' || touche === 'Z')) {
      if (champ && cible.type !== 'range' && cible.type !== 'checkbox') return;
      if (e.shiftKey) retablir(); else annuler();
      e.preventDefault();
      return;
    }
    if (mod && !e.altKey && (touche === 'y' || touche === 'Y')) { retablir(); e.preventDefault(); return; }
    if (mod || e.altKey) return;
    if (champ && cible.type !== 'checkbox') { if (touche === 'Escape') cible.blur(); return; }
    const activable = cible && (cible.tagName === 'BUTTON' || cible.type === 'checkbox');
    let traite = true;
    if (/^[0-9]$/.test(touche)) {
      const i = touche === '0' ? 9 : parseInt(touche, 10) - 1;
      if (i < etat.p) actionClavierTige(i); else traite = false;
    } else {
      switch (touche) {
        case 'ArrowLeft': deplacerCurseur(-1); break;
        case 'ArrowRight': deplacerCurseur(+1); break;
        case ' ': case 'Enter':
          if (activable) { traite = false; break; }
          actionClavierTige(etat.survol >= 0 ? etat.survol : (etat.selection ? etat.selection.de : 0));
          break;
        case 'Escape':
          if (etat.selection) reposerSelection();
          else if (etat.lecture.active) pauseLecture();
          else if (!el.victoire.hidden) masquerVictoire();
          else traite = false;
          break;
        case 'u': case 'U': annuler(); break;
        case 'y': case 'Y': retablir(); break;
        case 'r': case 'R': recommencer(); break;
        case 'i': case 'I': case 'h': case 'H': donnerIndice(); break;
        case 's': case 'S': basculerSolution(); break;
        case '+': case '=': changerVitesse(+1); break;
        case '-': case '_': changerVitesse(-1); break;
        case 'p': case 'P': basculerPanneau(); break;
        case '?': el.aide.showModal(); break;
        default: traite = false;
      }
    }
    if (traite) e.preventDefault();
  });

  // ===========================================================================
  //  Panneau, en-tête et réglages
  // ===========================================================================
  el.champN.addEventListener('input', () => { el.valN.textContent = el.champN.value; nouvellePartie(+el.champN.value, etat.p); });
  el.champP.addEventListener('input', () => { el.valP.textContent = el.champP.value; nouvellePartie(etat.n, +el.champP.value); });
  el.vitesse.addEventListener('input', () => {
    etat.lecture.vitesse = +el.vitesse.value;
    etat.lecture.auto = false;
    majVitesse();
  });
  el.apparence.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => changerTheme(b.dataset.theme)));
  function changerTheme(theme) {
    etat.theme = theme === 'caisses' ? 'caisses' : 'disques';
    el.apparence.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.theme === etat.theme ? 'true' : 'false'));
    el.noteCaisses.hidden = etat.theme !== 'caisses';
    if (surfaces.plateau) G = geometrie();
    majURL();
    marquerInterface();
  }
  el.optSon.addEventListener('change', () => { etat.son = el.optSon.checked; if (etat.son) son('coup', 1); });
  el.btnRecommencer.addEventListener('click', recommencer);
  el.btnAnnuler.addEventListener('click', annuler);
  el.btnRetablir.addEventListener('click', retablir);
  el.btnIndice.addEventListener('click', donnerIndice);
  el.btnSolution.addEventListener('click', basculerSolution);
  el.btnRejouer.addEventListener('click', recommencer);
  el.btnPlus.addEventListener('click', () => nouvellePartie(+el.btnPlus.dataset.n, +el.btnPlus.dataset.p));
  el.btnFermerVictoire.addEventListener('click', masquerVictoire);
  el.table.addEventListener('click', (e) => {
    const td = e.target.closest('td');
    if (td) nouvellePartie(+td.dataset.n, +td.dataset.p);
  });

  el.btnAide.addEventListener('click', () => el.aide.showModal());
  el.btnFermerAide.addEventListener('click', () => el.aide.close());
  el.aide.addEventListener('click', (e) => { if (e.target === el.aide) el.aide.close(); });
  el.btnPanneau.addEventListener('click', basculerPanneau);
  el.btnPleinEcran.addEventListener('click', () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    } catch (_) { /* plein écran refusé */ }
  });
  el.btnLangue.addEventListener('click', () => changerLangue(etat.langue === 'fr' ? 'en' : 'fr'));
  function basculerPanneau() {
    document.body.classList.toggle('sans-panneau');
    el.btnPanneau.setAttribute('aria-pressed', document.body.classList.contains('sans-panneau') ? 'false' : 'true');
  }

  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => redimensionner());
    ro.observe(el.plateauConteneur);
    ro.observe(el.bandeConteneur);
  } else {
    window.addEventListener('resize', redimensionner);
  }
  setInterval(() => { if (etat.chrono.debut !== null && etat.chrono.fin === null) majTemps(); }, 250);

  // ===========================================================================
  //  Démarrage
  // ===========================================================================
  const params = new URLSearchParams(location.search);
  chargerRecords();
  capturerFrancais();
  etat.langue = params.get('lang') === 'en' ? 'en' : 'fr';
  const n0 = parseInt(params.get('n'), 10), p0 = parseInt(params.get('p'), 10);
  etat.n = Number.isFinite(n0) ? clamp(n0, 1, H.NMAX) : 4;
  etat.p = Number.isFinite(p0) ? clamp(p0, H.PMIN, H.PMAX) : 3;
  changerTheme(params.get('theme') === 'caisses' ? 'caisses' : 'disques');
  appliquerLangue(etat.langue);
  nouvellePartie(etat.n, etat.p);

  // Accès pour les tests automatisés (Playwright) et la console.
  window.__toursHanoi = {
    etat, geometrie: () => G, nouvellePartie, coupJoueur: (de, vers) => coupJoueur(de, vers, G.xTige(de), G.yNiveau(compter(de) - 1)),
    allerA, basculerSolution, donnerIndice, annuler, retablir, recommencer, changerLangue, changerTheme,
    finirAnim: () => { while (etat.anim) finirAnim(); },
    rafraichir: () => marquerInterface(),
    vitesse: (i) => { etat.lecture.vitesse = clamp(i, 0, VITESSES.length - 1); etat.lecture.auto = false; majVitesse(); },
  };

  // ===========================================================================
  //  Tests automatiques (index.html?test=1)
  // ===========================================================================
  function lancerTests() {
    const res = [];
    const ok = (nom, cond) => res.push({ nom, ok: !!cond });
    try {
      ok('Φ(n, 3) = 2^n − 1 jusqu’à 15', [...Array(15)].every((_, i) => H.phi(i + 1, 3) === Math.pow(2, i + 1) - 1));
      ok('Φ(n, 4) : 1 3 5 9 13 17 25 33 41 49', [1, 3, 5, 9, 13, 17, 25, 33, 41, 49].every((v, i) => H.phi(i + 1, 4) === v));
      for (const [n, p] of [[10, 3], [10, 4], [10, 10], [15, 3], [15, 10]]) {
        const s = H.solutionCanonique(n, p);
        const q = H.etatInitial(n);
        let permis = true;
        for (const c of s.coups) { if (H.coupPermis(q, n, p, c.de, c.vers) !== c.d) permis = false; q[c.d] = c.vers; }
        ok('solution ' + n + ' disques, ' + p + ' tiges : ' + s.coups.length + ' coups permis', permis && H.estResolu(q, n, p - 1) && s.coups.length === H.phi(n, p));
      }
      const q = Int8Array.from([0, 1, 0, 2, 0]);
      ok('indice à 3 tiges depuis une position quelconque', H.cheminOptimal3(q, 4, 2).length === H.prochainCoup3(q, 4, 2).reste);
      // Partie complète au clavier (logique)
      nouvellePartie(3, 3);
      for (const c of H.solutionCanonique(3, 3).coups) { coupJoueur(c.de, c.vers, G.xTige(c.de), G.yLevage); finirAnim(); }
      ok('partie de 3 disques résolue en 7 coups', estResolu() && etat.curseur === 7 && etat.celebre);
      annuler(); finirAnim();
      ok('annuler', etat.curseur === 6 && !estResolu());
      retablir(); finirAnim();
      ok('rétablir', etat.curseur === 7 && estResolu());
      allerA(3);
      ok('aller au coup 3', etat.curseur === 3 && etat.pos[1] === 1);
      ok('coup interdit refusé (disque 3 sur le disque 1)', H.coupPermis(etat.pos, 3, 3, 0, 1) === 0 && !coupJoueur(0, 1, 0, 0) && etat.curseur === 3);
    } catch (err) {
      ok('exception : ' + err.message, false);
    }
    nouvellePartie(4, 3);
    const pre = document.getElementById('tests') || document.body.appendChild(Object.assign(document.createElement('pre'), { id: 'tests' }));
    const echecs = res.filter((r) => !r.ok).length;
    pre.textContent = 'Tests : ' + (res.length - echecs) + ' / ' + res.length + ' réussis\n' + res.map((r) => (r.ok ? '✓ ' : '✗ ') + r.nom).join('\n');
    window.__resultatsTests = { total: res.length, echecs };
  }
  if (MODE_TEST) lancerTests();
})();
