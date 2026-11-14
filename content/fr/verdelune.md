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
<p class="retour-cours"><a href="miscellaneous.html#JeuVideo" title="Retour à la page Divers">← Retour à la page Divers</a></p>
<h1 id="Verdelune">Verdelune — La Route des lanternes</h1>
<p class="subtitle">Une aventure de créatures originale avec des combats en temps réel, en 3D ou en 2D classique, en français ou en anglais — directement dans le navigateur.</p>

<div class="app-barre">
<p class="app-astuce">Cliquez dans le jeu pour jouer au clavier, ou appuyez sur un bouton de la manette.</p>
<div class="app-boutons">
<button type="button" class="app-son" id="vl-son" aria-pressed="true" title="Couper le son du jeu"><svg class="son-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg><svg class="son-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9.5 5 5M22 9.5l-5 5"/></svg><span>Son</span></button>
<button type="button" class="app-plein-ecran" data-plein-ecran="app-verdelune" title="Jouer en plein écran" hidden>⛶&nbsp;Plein écran</button>
</div>
</div>

<div class="app-cadre ecran vl-cadre">
<iframe id="app-verdelune" data-src="../apps/verdelune/index.html?lang=fr" title="Verdelune, le jeu" allow="fullscreen; gamepad; autoplay" allowfullscreen></iframe>
<div class="vl-tactile" hidden>
<p>Verdelune se joue au clavier ou à la manette, sur un ordinateur.</p>
<button type="button" class="rd-bouton" id="vl-charger">Charger le jeu quand même</button>
</div>
</div>

<details class="app-aide app-plus" id="Details">
<summary>Plus de détails sur le jeu</summary>
<div class="app-aide-contenu">
<p>
	Recevez votre premier Lumin lors du Rite des lanternes, faites allumer vos lanternes par la vieille allumeuse, gravissez la Tour de la Cloche-Vent, arrêtez le Clan Pénombre dans la Grotte de Luimousse et gagnez le Badge Rafale et le Badge Chrysalide. Les combats se jouent en temps réel : on se déplace librement dans l’arène, on saute, on se protège, on esquive et on lance quatre attaques avec les boutons de la manette. La démo se termine après la deuxième Arène.
</p>

<p class="vl-actions"><a href="../apps/verdelune/Verdelune-offline.zip" download title="Le fichier du jeu avec ses lanceurs (Linux, Windows, macOS) et le LISEZ-MOI">Télécharger pour jouer hors ligne (zip, 1,3 Mo)</a></p>

<div class="vl-gal">
	<figure><img src="../apps/verdelune/img/town.jpg" alt="La ville de Cressford, en voxels" loading="lazy"><figcaption>Cressford, l’une des villes de la Route des lanternes.</figcaption></figure>
	<figure><img src="../apps/verdelune/img/dialogue_fr.jpg" alt="Une conversation avec le portrait du personnage" loading="lazy"><figcaption>Chaque personnage a un portrait dont le visage suit l’humeur de la réplique.</figcaption></figure>
	<figure><img src="../apps/verdelune/img/cave.jpg" alt="L’entrée de la grotte de Morneval" loading="lazy"><figcaption>L’entrée de la grotte de Morneval.</figcaption></figure>
	<figure><img src="../apps/verdelune/img/swim.jpg" alt="Des Newtle sauvages nagent près du rivage" loading="lazy"><figcaption>Les Lumins sauvages parcourent les herbes hautes, les grottes et l’eau.</figcaption></figure>
</div>

<img class="vl-strip" src="../apps/verdelune/img/portraits.jpg" alt="Portraits des personnages" loading="lazy">
<p class="vl-cap">Quelques-unes des personnes rencontrées en chemin.</p>
<img class="vl-strip" src="../apps/verdelune/img/starters.jpg" alt="Cindling, Emberbrush et Volcanid" loading="lazy" style="max-width:720px">
<p class="vl-cap">Le partenaire Feu : Cindling, puis Emberbrush et Volcanid.</p>

<h3 id="Commandes">Commandes</h3>
<div class="vl-cols">
<div>
<table class="vl-keys">
	<tr><th>Exploration</th><th>Manette</th><th>Clavier</th></tr>
	<tr><td>Marcher</td><td>Stick gauche / croix</td><td>Flèches ou ZQSD/WASD</td></tr>
	<tr><td>Courir (maintenir)</td><td>X</td><td>Maj</td></tr>
	<tr><td>Parler, interagir</td><td>A</td><td>Espace / Entrée</td></tr>
	<tr><td>Retour</td><td>B</td><td>Échap</td></tr>
	<tr><td>Menu</td><td>Menu ≡</td><td>Tab</td></tr>
	<tr><td>Waylink (carte, contacts)</td><td>Y</td><td>M</td></tr>
	<tr><td>Caméra (3D)</td><td>Stick droit</td><td>Clic droit, <kbd>,</kbd> <kbd>.</kbd></td></tr>
</table>
</div>
<div>
<table class="vl-keys">
	<tr><th>Combats</th><th>Manette</th><th>Clavier</th></tr>
	<tr><td>Se déplacer</td><td>Stick gauche</td><td>Flèches</td></tr>
	<tr><td>Attaques 1 à 4</td><td>A · B · X · Y</td><td>A · S · Q · W</td></tr>
	<tr><td>Sauter</td><td>RT</td><td>E</td></tr>
	<tr><td>Se protéger (maintenir)</td><td>LB</td><td>Maj</td></tr>
	<tr><td>Esquiver</td><td>LT</td><td>Espace</td></tr>
	<tr><td>Pause : Combat, Sac, Lumins, Fuite</td><td>Menu ≡</td><td>Tab</td></tr>
</table>
</div>
</div>
<p>Chaque bouton et chaque touche se configurent dans <em>Options → Commandes</em>, qui propose aussi un testeur de manette.</p>

<h3 id="Sauvegarde">Sauvegarder son voyage</h3>
<p class="vl-note">
	Le jeu sauvegarde de lui-même aux moments clés, dans votre navigateur, sur cet ordinateur. Pour en garder une copie ou continuer sur un autre ordinateur ou navigateur, ouvrez <em>Options → Sauvegarde → Exporter mon voyage</em> : un petit fichier <code>.vlsave</code> arrive dans vos Téléchargements. Sur l’autre ordinateur, choisissez <em>Importer un voyage</em> (au même endroit, ou sur l’écran titre) — ou déposez simplement le fichier sur la fenêtre du jeu. Effacer les données du navigateur (ou jouer en navigation privée) efface le voyage qui y est sauvegardé : une copie exportée est une bonne précaution.
</p>

<h3 id="Configuration">Ce qu’il faut</h3>
<p>
	Un Firefox, Chrome, Edge ou Safari récent sur un ordinateur capable d’afficher de la 3D (WebGL 2), et un clavier ou une manette de type Xbox. Si le jeu est lent, choisissez <em>Options → Graphismes → Basse</em> ou <em>Moyenne</em>. La version hors ligne est le même jeu dans un seul fichier HTML : décompressez-la et double-cliquez sur le lanceur de votre système (ou ouvrez <code>Verdelune.html</code> dans un navigateur).
</p>
<p class="rd-credit">
	Un jeu original — histoire, créatures, personnages, musique et code — réalisé avec l’aide de Claude (Anthropic). Il n’est affilié à aucune autre série de jeux.
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
			son.querySelector('span').textContent = actif ? 'Son' : 'Son coupé';
			son.title = actif ? 'Couper le son du jeu' : 'Remettre le son du jeu';
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
