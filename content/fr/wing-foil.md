---
page_title: "Wing Foil Simulation — Pierre-Olivier Parisé"
nav: "miscellaneous"
wide: true
---

<style>
.wf-gal{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin:1.1rem 0 1.4rem}
.wf-gal figure{margin:0}
.wf-gal img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px;border:1px solid rgba(0,0,0,.12)}
.wf-gal figcaption{font-size:.92rem;color:var(--ink-2);margin-top:.35rem}
/* phones: the screenshots in a row that scrolls sideways, instead of one under the other */
@media (max-width:640px){.wf-gal{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:12px;margin-right:calc(-1 * var(--gutter,1rem));padding:0 var(--gutter,1rem) 6px 0;scrollbar-width:thin}.wf-gal figure{flex:0 0 82%;scroll-snap-align:start}}
.wf-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px}
.wf-keys{border-collapse:collapse;width:100%;margin:.4rem 0 1rem;font-size:.95rem}
.wf-keys th,.wf-keys td{padding:.32rem .6rem;border-bottom:1px solid var(--rule);text-align:left;vertical-align:top}
.wf-keys th{background:#f5f7f6}
</style>

<article>
<p class="retour-cours"><a href="miscellaneous.html#WingFoil" title="Retour à la page Divers">← Retour à la page Divers</a></p>
<h1 id="WingFoil">Wing Foil Simulation</h1>
<p class="subtitle">Un simulateur de wing foil à la physique réaliste : départ à genoux, décollage, pumping, virements de bord et houle — directement dans le navigateur, au clavier ou à la manette.</p>

<div class="app-barre">
<p class="app-astuce">Cliquez dans le jeu pour jouer au clavier, ou appuyez sur un bouton de la manette.</p>
<div class="app-boutons">
<button type="button" class="app-son" id="wf-son" aria-pressed="true" title="Couper le son du jeu"><svg class="son-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg><svg class="son-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9.5 5 5M22 9.5l-5 5"/></svg><span>Son</span></button>
<button type="button" class="app-plein-ecran" data-plein-ecran="app-wing-foil" title="Jouer en plein écran" hidden>⛶&nbsp;Plein écran</button>
</div>
</div>

<div class="app-cadre ecran">
<iframe id="app-wing-foil" data-src="../apps/wing-foil/index.html" title="Wing Foil Simulation, le jeu" allow="fullscreen *; gamepad *; autoplay *" allowfullscreen></iframe>
<div class="vl-tactile" hidden>
<p>Wing Foil Simulation se joue au clavier ou à la manette, sur un ordinateur.</p>
<button type="button" class="rd-bouton" id="wf-charger">Charger le jeu quand même</button>
</div>
</div>

<details class="app-aide app-plus" id="Details">
<summary>Plus de détails sur le jeu</summary>
<div class="app-aide-contenu">
<p>
	Partez à genoux, la wing au-dessus de la tête. Bordez pour avancer, levez-vous, laissez la planche accélérer à plat, puis donnez un court appui sur le pied arrière : elle décolle. En vol, la hauteur se tient au pied avant et au pied arrière, la puissance à la main arrière, et le cap avec la carre et la position de la wing. On peut pomper la wing et la planche pour décoller dans le vent léger, virer de bord en changeant de mains puis de pieds, et surfer la houle au portant. Après une chute, il faut remonter sur la planche.
</p>
<p>
	Le jeu propose trois niveaux de pilotage (assisté, réaliste, expert) et trois plans d’eau, chacun avec son vent, sa mer et ses repères : le lagon, la baie et son phare, le large et sa houle. Le vent se règle de 8 à 30 nœuds. Le matériel se règle aussi, pièce par pièce : planche, foil, mât, stabilisateur, wing et poids du rider ; le jeu calcule alors le vent qu’il faut pour décoller. Des conseils s’affichent pendant la navigation.
</p>

<div class="wf-gal">
	<figure><img src="../apps/wing-foil/img/baie.jpg" alt="Le rider en vol sur son foil dans la baie, devant le phare, la jetée et des voiliers au mouillage" loading="lazy"><figcaption>En vol dans la baie, devant le phare et la jetée.</figcaption></figure>
	<figure><img src="../apps/wing-foil/img/depart.jpg" alt="Le rider à genoux sur sa planche dans le lagon, la wing au-dessus de la tête, près d’un îlot de sable et de cocotiers" loading="lazy"><figcaption>Le départ se fait à genoux, la wing en l’air.</figcaption></figure>
	<figure><img src="../apps/wing-foil/img/houle.jpg" alt="Le rider vu de côté, en vol au-dessus de la houle : le mât et le foil se voient sous la planche" loading="lazy"><figcaption>Dans la houle du large, vu de côté : le foil travaille sous la surface.</figcaption></figure>
	<figure><img src="../apps/wing-foil/img/chute.jpg" alt="Après une chute : le rider est à l’eau, à côté de sa planche et de sa wing posée sur l’eau ; le jeu affiche la cause de la chute" loading="lazy"><figcaption>À l’eau ! Le jeu dit pourquoi, et il faut remonter sur la planche.</figcaption></figure>
</div>

<h3 id="Physique">La physique</h3>
<p>
	La planche ne suit pas une trajectoire préprogrammée : le jeu calcule 480 fois par seconde les forces sur le foil, la planche et la wing. Le foil est découpé en tranches qui portent, décrochent et aspirent de l’air près de la surface. La planche flotte, plane et frotte sur l’eau. La wing tire selon le vent apparent, son bordé et sa position. La houle déplace l’eau sous le foil, ce qui permet de la surfer. Le rider tient son équilibre avec des réflexes limités : quand ils ne suffisent plus, c’est la chute. Le décollage, le pumping et les touchdowns sortent de ces mêmes équations.
</p>

<h3 id="Commandes">Commandes</h3>
<div class="wf-cols">
<div>
<table class="wf-keys">
	<tr><th>Sur la planche</th><th>Manette</th><th>Clavier</th></tr>
	<tr><td>Remonter, se lever, se remettre à genoux</td><td>A</td><td>Entrée</td></tr>
	<tr><td>Appui sur le pied avant / arrière</td><td>Stick gauche ↑&nbsp;/&nbsp;↓</td><td>W / S</td></tr>
	<tr><td>Carre à gauche / à droite</td><td>Stick gauche ←&nbsp;/&nbsp;→</td><td>A / D</td></tr>
	<tr><td>Fléchir les jambes (pomper la planche)</td><td>LT</td><td>Maj</td></tr>
	<tr><td>Changer de pieds</td><td>Y</td><td>G</td></tr>
	<tr><td>Repartir sur la planche</td><td>B</td><td>R</td></tr>
</table>
</div>
<div>
<table class="wf-keys">
	<tr><th>La wing</th><th>Manette</th><th>Clavier</th></tr>
	<tr><td>Border / choquer</td><td>RT, plus ou moins enfoncée</td><td>E / Q</td></tr>
	<tr><td>Pomper la wing</td><td>RT, par à-coups</td><td>Espace</td></tr>
	<tr><td>Wing vers le nez / vers la queue</td><td>Stick droit ↑&nbsp;/&nbsp;↓</td><td>↑&nbsp;/&nbsp;↓</td></tr>
	<tr><td>Wing plus basse / plus haute</td><td>Stick droit vers la wing / à l’opposé</td><td>←&nbsp;/&nbsp;→</td></tr>
	<tr><td>Changer de mains</td><td>X</td><td>F</td></tr>
	<tr><td>Tout lâcher</td><td>Relâcher RT</td><td>X</td></tr>
</table>
</div>
<div>
<table class="wf-keys">
	<tr><th>Le jeu</th><th>Manette</th><th>Clavier</th></tr>
	<tr><td>Pause et réglages</td><td>Menu ≡</td><td>P ou Échap</td></tr>
	<tr><td>Changer de caméra</td><td>RB</td><td>C</td></tr>
	<tr><td>Afficher ou cacher l’aide</td><td>LB</td><td>H</td></tr>
	<tr><td>Vent : un nœud de plus / de moins</td><td>Croix ↑&nbsp;/&nbsp;↓</td><td>V (un nœud de plus)</td></tr>
	<tr><td>Couper ou remettre le son</td><td>—</td><td>M</td></tr>
</table>
</div>
</div>
<p>Le menu du jeu rappelle ces commandes et les gestes du départ, du décollage et du virement de bord.</p>

<h3 id="Configuration">Ce qu’il faut</h3>
<p>
	Un navigateur récent sur un ordinateur capable d’afficher de la 3D (WebGL), et un clavier ou une manette de type Xbox. Vos réglages (plan d’eau, vent, matériel) sont gardés dans votre navigateur, sur cet ordinateur. Le jeu est en français.
</p>
<p class="rd-credit">
	Jeu en HTML, CSS et JavaScript, sans bibliothèque externe, créé avec l’aide de Claude (Anthropic).
</p>
</div>
</details>
</article>

<script>
	// The game is played with a keyboard or a controller: on a touch screen alone, it is loaded only on request.
	// (allow="… *" on the frame: the controller and the full-screen button of the game also work when this
	// page is opened as a local file, where the browser treats the game as another origin.)
	(function () {
		var cadre = document.getElementById('app-wing-foil');
		var avis = document.querySelector('.vl-tactile');
		var plein = document.querySelector('[data-plein-ecran="app-wing-foil"]');
		var son = document.getElementById('wf-son');
		function charger() {
			if (!cadre.getAttribute('src')) cadre.setAttribute('src', cadre.getAttribute('data-src'));
			avis.hidden = true; cadre.hidden = false;
			if (plein) plein.style.display = '';
			son.style.display = '';
		}
		// Sound button: the game keeps the sound setting (its menu, the M key). It tells the page when the
		// setting changes, and it follows the button of the page; both use the message 'mathopo:son'.
		var actif = true;
		function majSon() {
			son.setAttribute('aria-pressed', actif ? 'true' : 'false');
			son.classList.toggle('coupe', !actif);
			son.querySelector('span').textContent = actif ? 'Son' : 'Son coupé';
			son.title = actif ? 'Couper le son du jeu' : 'Remettre le son du jeu';
		}
		majSon();
		window.addEventListener('message', function (e) {
			var d = e.data;
			if (e.source !== cadre.contentWindow || !d || d.type !== 'mathopo:son') return;
			actif = !!d.son;
			majSon();
		});
		// A click on the button takes the keyboard away from the game: it is given back if the game had it.
		var retour = false;
		son.addEventListener('pointerdown', function () { retour = document.activeElement === cadre; });
		son.addEventListener('click', function () {
			actif = !actif;
			majSon();
			if (cadre.contentWindow) {
				cadre.contentWindow.postMessage({ type: 'mathopo:son', son: actif }, '*');
				if (retour) cadre.contentWindow.focus();
			}
			retour = false;
		});
		if (window.matchMedia && !window.matchMedia('(any-pointer: fine)').matches) {
			avis.hidden = false; cadre.hidden = true;
			if (plein) plein.style.display = 'none';
			son.style.display = 'none';
			document.getElementById('wf-charger').addEventListener('click', charger);
		} else {
			charger();
		}
	})();
</script>
