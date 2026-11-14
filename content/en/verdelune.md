---
page_title: "Verdelune — Pierre-Olivier Parisé"
nav: "miscellaneous"
wide: true
---

<style>
.vl-gal{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin:1.1rem 0 1.4rem}
.vl-gal figure{margin:0}
.vl-gal img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px;border:1px solid rgba(0,0,0,.12)}
.vl-gal figcaption{font-size:.92rem;color:var(--ink-2);margin-top:.35rem}
.vl-strip{display:block;width:100%;border-radius:10px;border:1px solid rgba(0,0,0,.12);margin:.4rem 0 .3rem}
.vl-cap{font-size:.92rem;color:var(--ink-2);margin:0 0 1.2rem}
/* phones: the screenshots in a row that scrolls sideways, instead of one under the other */
@media (max-width:640px){.vl-gal{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:12px;margin-right:calc(-1 * var(--gutter,1rem));padding:0 var(--gutter,1rem) 6px 0;scrollbar-width:thin}.vl-gal figure{flex:0 0 82%;scroll-snap-align:start}}
.vl-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px}
.vl-keys{border-collapse:collapse;width:100%;margin:.4rem 0 1rem;font-size:.95rem}
.vl-keys th,.vl-keys td{padding:.32rem .6rem;border-bottom:1px solid var(--rule);text-align:left;vertical-align:top}
.vl-keys th{background:#f5f7f6}
.vl-note{background:#f3f8f5;border-left:4px solid #0b7a57;padding:.7rem 1rem;border-radius:6px;margin:.6rem 0 1.2rem}
.vl-actions{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem 1.2rem;margin:1rem 0 .4rem}
.vl-actions .rd-bouton{font-size:1.05rem;padding:.65rem 1.35rem}
</style>

<article>
<p class="retour-cours"><a href="miscellaneous.html#VideoGame" title="Back to the Miscellaneous page">← Back to the Miscellaneous page</a></p>
<h1 id="Verdelune">Verdelune — The Lantern Road</h1>
<p class="subtitle">An original creature adventure with real-time battles, in 3D or classic 2D, in English or French — played right in the browser.</p>

<div class="app-barre">
<p class="app-astuce">Click inside the game to play with the keyboard, or press a button on the controller.</p>
<div class="app-boutons">
<button type="button" class="app-son" id="vl-son" aria-pressed="true" title="Mute the game"><svg class="son-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg><svg class="son-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9.5 5 5M22 9.5l-5 5"/></svg><span>Sound</span></button>
<button type="button" class="app-plein-ecran" data-plein-ecran="app-verdelune" title="Play in full screen" hidden>⛶&nbsp;Full screen</button>
</div>
</div>

<div class="app-cadre ecran vl-cadre">
<iframe id="app-verdelune" data-src="apps/verdelune/index.html?lang=en" title="Verdelune, the game" allow="fullscreen; gamepad; autoplay" allowfullscreen></iframe>
<div class="vl-tactile" hidden>
<p>Verdelune is played with a keyboard or a controller, on a computer.</p>
<button type="button" class="rd-bouton" id="vl-charger">Load the game anyway</button>
</div>
</div>

<details class="app-aide app-plus" id="Details">
<summary>More about the game</summary>
<div class="app-aide-contenu">
<p>
	Receive your first Lumin at the Lantern Rite, have your lanterns kindled by the old lamplighter, climb the Windbell Tower, stop the Gloam Crew in Glowmoss Grotto and earn the Gale Badge and the Chrysalis Badge. Battles are fought in real time: move freely around the arena, jump, guard, dodge and use four moves on the controller's face buttons. The demo ends after the second Arena.
</p>

<p class="vl-actions"><a href="apps/verdelune/Verdelune-offline.zip" download title="The game file with its launchers (Linux, Windows, macOS) and the README">Download for offline play (zip, 1.3 MB)</a></p>

<div class="vl-gal">
	<figure><img src="apps/verdelune/img/town.jpg" alt="The town of Cressford, in voxels" loading="lazy"><figcaption>Cressford, one of the towns on the Lantern Road.</figcaption></figure>
	<figure><img src="apps/verdelune/img/dialogue.jpg" alt="A conversation with a portrait of the speaker" loading="lazy"><figcaption>Every character has a portrait whose face follows the mood of the line.</figcaption></figure>
	<figure><img src="apps/verdelune/img/cave.jpg" alt="The entrance of Gloomvale Cave" loading="lazy"><figcaption>The mouth of Gloomvale Cave.</figcaption></figure>
	<figure><img src="apps/verdelune/img/swim.jpg" alt="Wild Newtles swimming near the shore" loading="lazy"><figcaption>Wild Lumins roam the grass, the caves and the water.</figcaption></figure>
</div>

<img class="vl-strip" src="apps/verdelune/img/portraits.jpg" alt="Portraits of the characters" loading="lazy">
<p class="vl-cap">Some of the people you meet along the way.</p>
<img class="vl-strip" src="apps/verdelune/img/starters.jpg" alt="Cindling, Emberbrush and Volcanid" loading="lazy" style="max-width:720px">
<p class="vl-cap">The fire partner: Cindling, then Emberbrush and Volcanid.</p>

<h3 id="Controls">Controls</h3>
<div class="vl-cols">
<div>
<table class="vl-keys">
	<tr><th>Exploring</th><th>Controller</th><th>Keyboard</th></tr>
	<tr><td>Walk</td><td>Left stick / D-pad</td><td>Arrows or WASD</td></tr>
	<tr><td>Run (hold)</td><td>X</td><td>Shift</td></tr>
	<tr><td>Talk, interact</td><td>A</td><td>Space / Enter</td></tr>
	<tr><td>Back</td><td>B</td><td>Esc</td></tr>
	<tr><td>Menu</td><td>Menu ≡</td><td>Tab</td></tr>
	<tr><td>Waylink (map, contacts)</td><td>Y</td><td>M</td></tr>
	<tr><td>Camera (3D)</td><td>Right stick</td><td>Right-drag, <kbd>,</kbd> <kbd>.</kbd></td></tr>
</table>
</div>
<div>
<table class="vl-keys">
	<tr><th>Battles</th><th>Controller</th><th>Keyboard</th></tr>
	<tr><td>Move</td><td>Left stick</td><td>Arrows</td></tr>
	<tr><td>Moves 1–4</td><td>A · B · X · Y</td><td>A · S · Q · W</td></tr>
	<tr><td>Jump</td><td>RT</td><td>E</td></tr>
	<tr><td>Guard (hold)</td><td>LB</td><td>Shift</td></tr>
	<tr><td>Dodge</td><td>LT</td><td>Space</td></tr>
	<tr><td>Pause: Fight, Bag, Lumins, Run</td><td>Menu ≡</td><td>Tab</td></tr>
</table>
</div>
</div>
<p>Every button and key can be remapped in <em>Options → Controls</em>, which also has a controller tester.</p>

<h3 id="Saving">Saving your journey</h3>
<p class="vl-note">
	The game saves on its own at key moments, in your browser, on this computer. To keep a copy or to continue on another computer or browser, open <em>Options → Save → Export my journey</em>: a small <code>.vlsave</code> file goes to your Downloads. On the other computer, choose <em>Import a journey</em> (in the same place, or on the title screen) — or simply drop the file onto the game window. Clearing the browser's data (or playing in a private window) erases the journey saved in the browser, so an exported copy is a good backup.
</p>

<h3 id="Requirements">What you need</h3>
<p>
	A recent Firefox, Chrome, Edge or Safari on a computer with 3D graphics (WebGL 2), and a keyboard or an Xbox-style controller. If the game runs slowly, choose <em>Options → Graphics → Low</em> or <em>Medium</em>. The offline version is the same game in a single HTML file: unzip it and double-click the launcher for your system (or open <code>Verdelune.html</code> in a browser).
</p>
<p class="rd-credit">
	An original game — story, creatures, characters, music and code — made with the help of Claude (Anthropic). It is not affiliated with any other game series.
</p>
</div>
</details>
</article>

<script>
	// The game (3 MB) is loaded in the page. It is played with a keyboard or a controller:
	// on a touch screen alone, it is loaded only on request.
	(function () {
		var cadre = document.getElementById('app-verdelune');
		var avis = document.querySelector('.vl-tactile');
		var plein = document.querySelector('[data-plein-ecran="app-verdelune"]');
		var son = document.getElementById('vl-son');
		function charger() {
			if (!cadre.getAttribute('src')) cadre.setAttribute('src', cadre.getAttribute('data-src'));
			avis.hidden = true; cadre.hidden = false;
			if (plein) plein.style.display = '';
			son.style.display = '';
		}
		// Sound button: the choice is kept in this browser; son.js (added to the game by build.py)
		// reads it when the game starts and follows the messages of the page.
		var actif = true;
		try { actif = localStorage.getItem('verdelune-son') !== 'off'; } catch (e) {}
		function majSon() {
			son.setAttribute('aria-pressed', actif ? 'true' : 'false');
			son.classList.toggle('coupe', !actif);
			son.querySelector('span').textContent = actif ? 'Sound' : 'Muted';
			son.title = actif ? 'Mute the game' : 'Turn the game sound back on';
		}
		majSon();
		son.addEventListener('click', function () {
			actif = !actif;
			majSon();
			try { localStorage.setItem('verdelune-son', actif ? 'on' : 'off'); } catch (e) {}
			if (cadre.contentWindow) cadre.contentWindow.postMessage({ type: 'mathopo:son', son: actif }, '*');
		});
		if (window.matchMedia && !window.matchMedia('(any-pointer: fine)').matches) {
			avis.hidden = false; cadre.hidden = true;
			if (plein) plein.style.display = 'none';
			son.style.display = 'none';
			document.getElementById('vl-charger').addEventListener('click', charger);
		} else {
			charger();
		}
	})();
</script>
