---
page_title: "Séries de fonctions — Pierre-Olivier Parisé"
nav: "teaching"
wide: true
---

<article>
<p class="retour-cours"><a href="mpu1054.html#Applications" title="MPU1054 – page du cours (applications et activités)">← Retour à la page du cours MPU1054</a></p>
<h1 id="SeriesFonctions">Séries de fonctions</h1>
<p class="subtitle">Sommes partielles, reste et convergence uniforme : les séries des notes de cours et des exercices de la section 4.1.</p>

<div class="app-barre">
<details class="app-aide">
<summary>Mode d’emploi</summary>
<div class="app-aide-contenu">
<p>
	Une série de fonctions \( \sum f_n \) est la suite de ses sommes partielles \( s_n = f_1 + \cdots + f_n \) : pour chaque \( x \) fixé, c’est une série numérique, et la <strong>somme</strong> \( f(x) \) est la limite des \( s_n(x) \). Toute la section 4.1 tourne autour d’une question : la convergence est-elle <strong>uniforme</strong> sur un ensemble \( A \), c’est-à-dire le <strong>reste</strong> \( R_n = f - s_n \) devient-il petit pour tous les \( x \in A \) à la fois ? Cette application permet de :
</p>
<ul>
	<li>
		choisir une <strong>série</strong> parmi celles des exemples des notes de cours (la série géométrique, celles de l’exponentielle et du logarithme, \( \sum \frac{\cos (nx)}{n^2} \), la fonction zêta, la fonction de van der Waerden…) et des exercices P1, P2 et T1 de la section 4.1, ou entrer son propre <strong>terme général</strong> \( f_n(x) \), par exemple <code>x^n/n!</code> ou <code>sin(nx)/n^2</code> ;
	</li>
	<li>
		tracer les <strong>sommes partielles</strong> \( s_n \), en or, et la somme \( f \), en vert ; déplacer \( n \), ou « additionner les termes » un à un à partir du premier ; afficher aussi \( s_{n/2} \), \( s_{n/4} \)…, comme dans les figures des notes ;
	</li>
	<li>
		choisir l’<strong>ensemble</strong> \( A \), par exemple \( (-1, 1) \) ou \( [-r, r] \) pour la série géométrique, et glisser ses extrémités sur le graphe : souvent, la convergence n’est uniforme que sur des ensembles plus petits ;
	</li>
	<li>
		suivre, dans chaque onglet, un résultat de la section : la <strong>convergence simple</strong> en un point \( x_0 \) ; la <strong>convergence uniforme</strong>, avec la bande \( f \pm \varepsilon \), la norme \( \lVert R_n \rVert_A \) et le rang à partir duquel le graphe de \( s_n \) reste dans la bande (ce qui en sort est en rouge) ; le <strong>critère de Cauchy</strong>, avec le bloc \( s_m - s_n \) ; le <strong>test du terme général</strong>, version uniforme, avec \( \lVert f_n \rVert_A \) ; le <strong>test \( M \) de Weierstrass</strong>, avec les nombres \( M_n \) et la bande \( f \pm \rho_n \) ;
	</li>
	<li>
		lire le <strong>raisonnement</strong> des notes de cours ou du solutionnaire pour la série et l’ensemble choisis, étape par étape, jusqu’à sa conclusion.
	</li>
</ul>

<p>
	Sous les courbes, un second graphe montre la suite de nombres qui décide : \( s_n(x_0) \), \( \lVert R_n \rVert_A \), \( \lVert s_m - s_n \rVert_A \), \( \lVert f_n \rVert_A \) ou \( M_n \). La molette agrandit les graphes et un double-clic les recadre. Pour une série ou un intervalle au choix, l’application ne donne que des valeurs numériques : pour conclure, il faut un test. Le bouton « Copier le lien » donne une adresse qui rouvre la même série avec les mêmes réglages, pratique pour la projeter en classe. La touche <kbd>?</kbd> affiche l’aide complète dans l’application.
</p>

<p class="rd-credit">
	Application en HTML, CSS et JavaScript, créée avec l’aide de Claude Code (Anthropic). Les formules sont composées avec KaTeX.
</p>
</div>
</details>
<button type="button" class="app-plein-ecran" data-plein-ecran="app-series" title="Afficher l’application en plein écran" hidden>⛶&nbsp;Plein écran</button>
</div>

<div class="app-cadre ecran" data-hauteur-etroit>
<iframe id="app-series" src="../apps/series-fonctions/index.html?lang=fr&amp;embed=1" title="Séries de fonctions, application interactive" allow="clipboard-write" allowfullscreen></iframe>
</div>

<script>
	// Une adresse comme series-fonctions.html?s=T1&t=cauchy&n=12 ouvre l’application avec cette série,
	// cet onglet et ces réglages (s : une série des notes ou des exercices, ou f : un terme général ;
	// t : sommes, uniforme, cauchy, terme ou testm ; A et p : l’ensemble et son paramètre, ou A=ab avec a et b ;
	// n et m : les indices (m : suivant, double ou un entier) ; eps : ε ; x0 : le point x₀ ; log et prec : les cases de la barre d’outils).
	// C’est aussi l’adresse que donne « Copier le lien ».
	(function () {
		var depart = new URLSearchParams(location.search), suite = '';
		var terme = function (v) { return v.length <= 200 && !/[<>"'`]/.test(v); };
		var nombre = function (v) { return /^-?(\d{1,7}(\.\d{1,12})?|\.\d{1,12})(e[+-]?\d{1,3})?$/i.test(v); };
		var valide = {
			t: function (v) { return /^(sommes|uniforme|cauchy|terme|testm)$/.test(v); },
			s: function (v) { return /^[A-Za-z0-9]{1,24}$/.test(v); },
			f: terme,
			A: function (v) { return /^[A-Za-z]{1,12}$/.test(v); },
			p: nombre,
			a: nombre,
			b: nombre,
			n: function (v) { return /^\d{1,5}$/.test(v); },
			m: function (v) { return /^(suivant|double|\d{1,5})$/.test(v); },
			eps: nombre,
			x0: nombre,
			log: function (v) { return v === '1'; },
			prec: function (v) { return v === '0'; }
		};
		['t', 's', 'f', 'A', 'p', 'a', 'b', 'n', 'm', 'eps', 'x0', 'log', 'prec'].forEach(function (cle) {
			var v = depart.get(cle);
			if (v && valide[cle](v)) suite += '&' + cle + '=' + encodeURIComponent(v);
		});
		if (!suite) return;
		var cadre = document.getElementById('app-series');
		cadre.setAttribute('src', cadre.getAttribute('src') + suite);
	})();
</script>
</article>
