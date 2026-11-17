---
page_title: "Tests de convergence — Pierre-Olivier Parisé"
nav: "teaching"
wide: true
---

<article>
<p class="retour-cours"><a href="mpu1054.html#Applications" title="MPU1054 – page du cours (applications et activités)">← Retour à la page du cours MPU1054</a></p>
<h1 id="TestsConvergence">Tests de convergence</h1>
<p class="subtitle">Séries à termes positifs : chaque terme est l’aire d’un rectangle, et chaque test compare des aires.</p>

<div class="app-barre">
<details class="app-aide">
<summary>Mode d’emploi</summary>
<div class="app-aide-contenu">
<p>
	Dessinons chaque terme \( x_n \ge 0 \) d’une série comme un rectangle de largeur 1 et de hauteur \( x_n \) : son aire est \( x_n \), la somme partielle \( s_n \) est l’aire des \( n \) premiers rectangles, et la série converge si et seulement si l’aire totale est finie. Les premiers termes ne changent rien à la nature de la série : seule compte la <strong>queue</strong>, l’aire à partir d’un rang \( N \). Les quatre tests de convergence du cours reposent sur la même idée : <strong>comparer cette aire à celle d’une série dont on connaît la nature</strong>. Cette application permet de :
</p>
<ul>
	<li>
		choisir le <strong>test</strong> : comparaison ou comparaison par limite (section 3.1), racine ou quotient (section 3.3) ;
	</li>
	<li>
		entrer le <strong>terme général</strong> \( x_n \) de la série, par exemple <code>n/2^n</code>, <code>n!/n^n</code> ou <code>(log n)^(-n)</code>, et, pour les deux tests de comparaison, celui de la série de comparaison \( y_n \), par exemple <code>1/n^2</code> ; les exemples des notes de cours et des exercices sont à un clic ;
	</li>
	<li>
		voir les <strong>rectangles</strong> de \( x_n \), en or, et ceux de la série de comparaison, en vert (pour la racine et le quotient, c’est la série géométrique que fournit le test) ; ce qui dépasse est en rouge, et les valeurs exactes sont écrites quand elles tiennent au-dessus des rectangles ;
	</li>
	<li>
		suivre, sous les rectangles, la <strong>suite qui décide du test</strong>, \( x_n/y_n \), \( x_n^{1/n} \) ou \( x_{n+1}/x_n \), et sa limite \( r \), estimée numériquement et reconnue quand c’est possible (par exemple \( r = 1/e \) pour \( n!/n^n \)) ;
	</li>
	<li>
		déplacer le <strong>rang</strong> \( N \) (ou \( K \)) et choisir \( \varepsilon \) ou \( r_1 \), aux curseurs ou en glissant les lignes du graphe : l’application vérifie l’inégalité du test à partir de ce rang (numériquement, jusqu’à \( n = 10^7 \)) et propose le plus petit rang qui convient ;
	</li>
	<li>
		<strong>additionner les aires</strong> à partir du rang, un rectangle à la fois, puis de plus en plus vite : les deux aires restent finies, ou deviennent infinies, ensemble ;
	</li>
	<li>
		lire le <strong>raisonnement</strong> du test, étape par étape, jusqu’à sa conclusion, ou jusqu’à la raison pour laquelle il ne permet pas de conclure (une majoration par une série divergente, \( r = 1 \) pour la racine et le quotient…).
	</li>
</ul>

<p>
	Le bouton « La queue » montre les rectangles à partir du rang, agrandis, et l’échelle logarithmique rend visibles les termes très petits ; la molette agrandit le graphe et un clic sur un rectangle y place le rang. Le bouton « Copier le lien » donne une adresse qui rouvre le même test avec les mêmes séries, pratique pour le projeter en classe. La touche <kbd>?</kbd> affiche l’aide complète dans l’application.
</p>

<p class="rd-credit">
	Application en HTML, CSS et JavaScript, créée avec l’aide de Claude Code (Anthropic). Les formules sont composées avec KaTeX.
</p>
</div>
</details>
<button type="button" class="app-plein-ecran" data-plein-ecran="app-tests" title="Afficher l’application en plein écran" hidden>⛶&nbsp;Plein écran</button>
</div>

<div class="app-cadre ecran" data-hauteur-etroit>
<iframe id="app-tests" src="../apps/tests-convergence/index.html?lang=fr&amp;embed=1" title="Tests de convergence, application interactive" allow="clipboard-write" allowfullscreen></iframe>
</div>

<script>
	// Une adresse comme tests-convergence.html?t=quotient&x=n!/n^n ouvre l’application avec ce test
	// et cette série (t : comparaison, limite, racine ou quotient ; x et y : les termes généraux ;
	// N : le rang ; eps et r1 : ε et r₁). C’est aussi l’adresse que donne « Copier le lien ».
	(function () {
		var depart = new URLSearchParams(location.search), suite = '';
		var terme = function (v) { return v.length <= 200 && !/[<>"'`]/.test(v); };
		var nombre = function (v) { return /^-?(\d{1,7}(\.\d{1,12})?|\.\d{1,12})(e[+-]?\d{1,3})?$/i.test(v); };
		var valide = {
			t: function (v) { return /^(comparaison|limite|racine|quotient)$/.test(v); },
			x: terme,
			y: terme,
			N: function (v) { return /^\d{1,8}$/.test(v); },
			eps: nombre,
			r1: nombre
		};
		['t', 'x', 'y', 'N', 'eps', 'r1'].forEach(function (cle) {
			var v = depart.get(cle);
			if (v && valide[cle](v)) suite += '&' + cle + '=' + encodeURIComponent(v);
		});
		if (!suite) return;
		var cadre = document.getElementById('app-tests');
		cadre.setAttribute('src', cadre.getAttribute('src') + suite);
	})();
</script>
</article>
