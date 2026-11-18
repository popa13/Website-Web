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
<p class="retour-cours"><a href="miscellaneous.html#WingFoil" title="Back to the Miscellaneous page">← Back to the Miscellaneous page</a></p>
<h1 id="WingFoil">Wing Foil Simulation</h1>
<p class="subtitle">A wing foil simulator with realistic physics: kneeling start, take-off, pumping, tacks and swell — played right in the browser, with a keyboard or a controller. The game is in French.</p>

<div class="app-barre">
<p class="app-astuce">Click inside the game to play with the keyboard, or press a button on the controller.</p>
<div class="app-boutons">
<button type="button" class="app-son" id="wf-son" aria-pressed="true" title="Mute the game"><svg class="son-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg><svg class="son-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9.5 5 5M22 9.5l-5 5"/></svg><span>Sound</span></button>
<button type="button" class="app-plein-ecran" data-plein-ecran="app-wing-foil" title="Play in full screen" hidden>⛶&nbsp;Full screen</button>
</div>
</div>

<div class="app-cadre ecran">
<iframe id="app-wing-foil" data-src="apps/wing-foil/index.html" title="Wing Foil Simulation, the game (in French)" allow="fullscreen *; gamepad *; autoplay *" allowfullscreen></iframe>
<div class="vl-tactile" hidden>
<p>Wing Foil Simulation is played with a keyboard or a controller, on a computer.</p>
<button type="button" class="rd-bouton" id="wf-charger">Load the game anyway</button>
</div>
</div>

<details class="app-aide app-plus" id="Details">
<summary>More about the game</summary>
<div class="app-aide-contenu">
<p>
	Start on your knees, with the wing above your head. Sheet in to get moving, stand up, let the board speed up flat on the water, then press briefly on the back foot: it takes off. In flight, you hold the height with front-foot and back-foot pressure, the power with the back hand, and the course with the edge of the board and the position of the wing. You can pump the wing and the board to take off in light wind, tack by switching hands and then feet, and ride the swell downwind. After a fall, you have to climb back on the board.
</p>
<p>
	The game has three assistance levels (assisted, realistic, expert) and three spots, each with its own wind, sea and landmarks: the lagoon, the bay and its lighthouse, and the open sea with its swell. The wind can be set from 8 to 30 knots. The gear can be set too, piece by piece: board, foil, mast, stabilizer, wing and rider weight; the game then works out the wind needed to take off. Tips appear while you sail.
</p>
<p>
	The menu and the tips are in French: <em>Naviguer</em> starts a session, <em>Pilotage</em> is the assistance level (<em>Assisté</em>, <em>Réaliste</em>, <em>Expert</em>), <em>Plan d’eau</em> the spot, <em>Vent</em> the wind, <em>Rafales</em> the gusts, <em>Mer</em> the sea state, <em>Matériel</em> the gear and <em>Départ</em> the way a session starts.
</p>

<div class="wf-gal">
	<figure><img src="apps/wing-foil/img/baie.jpg" alt="The rider flying on the foil in the bay, in front of the lighthouse, the pier and moored sailboats" loading="lazy"><figcaption>Flying in the bay, in front of the lighthouse and the pier.</figcaption></figure>
	<figure><img src="apps/wing-foil/img/depart.jpg" alt="The rider kneeling on the board in the lagoon, the wing overhead, near a sandy islet with coconut palms" loading="lazy"><figcaption>A session starts on your knees, wing in the air.</figcaption></figure>
	<figure><img src="apps/wing-foil/img/houle.jpg" alt="The rider seen from the side, flying above the swell: the mast and the foil show under the board" loading="lazy"><figcaption>In the swell of the open sea, seen from the side: the foil works under the surface.</figcaption></figure>
	<figure><img src="apps/wing-foil/img/chute.jpg" alt="After a fall: the rider is in the water, next to the board and the wing lying on the water; the game shows the cause of the fall" loading="lazy"><figcaption>In the water! The game says why, and you have to climb back on the board.</figcaption></figure>
</div>

<h3 id="Physics">The physics</h3>
<p>
	The board does not follow a pre-programmed path: 480 times a second, the game computes the forces on the foil, the board and the wing. The foil is cut into strips that lift, stall and suck in air near the surface. The board floats, planes and drags on the water. The wing pulls according to the apparent wind, how much it is sheeted in and where it is held. The swell moves the water under the foil, which is what lets you ride it. The rider keeps balance with limited reflexes: when they are no longer enough, you fall. Take-off, pumping and touchdowns come out of the same equations.
</p>

<h3 id="Controls">Controls</h3>
<div class="wf-cols">
<div>
<table class="wf-keys">
	<tr><th>On the board</th><th>Controller</th><th>Keyboard</th></tr>
	<tr><td>Climb back on, stand up, kneel again</td><td>A</td><td>Enter</td></tr>
	<tr><td>Front-foot / back-foot pressure</td><td>Left stick ↑&nbsp;/&nbsp;↓</td><td>W / S</td></tr>
	<tr><td>Edge to the left / to the right</td><td>Left stick ←&nbsp;/&nbsp;→</td><td>A / D</td></tr>
	<tr><td>Bend the legs (pump the board)</td><td>LT</td><td>Shift</td></tr>
	<tr><td>Switch feet</td><td>Y</td><td>G</td></tr>
	<tr><td>Start again on the board</td><td>B</td><td>R</td></tr>
</table>
</div>
<div>
<table class="wf-keys">
	<tr><th>The wing</th><th>Controller</th><th>Keyboard</th></tr>
	<tr><td>Sheet in / sheet out</td><td>RT, pressed more or less</td><td>E / Q</td></tr>
	<tr><td>Pump the wing</td><td>RT, in short pulls</td><td>Space</td></tr>
	<tr><td>Wing towards the nose / the tail</td><td>Right stick ↑&nbsp;/&nbsp;↓</td><td>↑&nbsp;/&nbsp;↓</td></tr>
	<tr><td>Wing lower / higher</td><td>Right stick towards the wing / away from it</td><td>←&nbsp;/&nbsp;→</td></tr>
	<tr><td>Switch hands</td><td>X</td><td>F</td></tr>
	<tr><td>Let go of the back hand</td><td>Release RT</td><td>X</td></tr>
</table>
</div>
<div>
<table class="wf-keys">
	<tr><th>The game</th><th>Controller</th><th>Keyboard</th></tr>
	<tr><td>Pause and settings</td><td>Menu ≡</td><td>P or Esc</td></tr>
	<tr><td>Change the camera</td><td>RB</td><td>C</td></tr>
	<tr><td>Show or hide the help</td><td>LB</td><td>H</td></tr>
	<tr><td>Wind: one knot more / less</td><td>D-pad ↑&nbsp;/&nbsp;↓</td><td>V (one knot more)</td></tr>
	<tr><td>Mute or unmute</td><td>—</td><td>M</td></tr>
</table>
</div>
</div>
<p>The menu of the game lists these controls, and the moves for the start, the take-off and the tack.</p>

<h3 id="Requirements">What you need</h3>
<p>
	A recent browser on a computer with 3D graphics (WebGL), and a keyboard or an Xbox-style controller. Your settings (spot, wind, gear) are kept in your browser, on this computer.
</p>
<p class="rd-credit">
	A game in HTML, CSS and JavaScript, with no external library, made with the help of Claude (Anthropic).
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
			son.querySelector('span').textContent = actif ? 'Sound' : 'Muted';
			son.title = actif ? 'Mute the game' : 'Turn the game sound back on';
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
