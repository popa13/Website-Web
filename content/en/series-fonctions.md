---
page_title: "Series of functions — Pierre-Olivier Parisé"
nav: "teaching"
wide: true
---

<article>
<p class="retour-cours"><a href="mpu1054.html#Applications" title="MPU1054 - course page (applications and activities)">← Back to the MPU1054 course page</a></p>
<h1 id="SeriesFonctions">Series of functions</h1>
<p class="subtitle">Partial sums, remainder and uniform convergence: the series of the lecture notes and of the exercises of Section 4.1.</p>

<div class="app-barre">
<details class="app-aide">
<summary>How to use</summary>
<div class="app-aide-contenu">
<p>
	A series of functions \( \sum f_n \) is the sequence of its partial sums \( s_n = f_1 + \cdots + f_n \): for each fixed \( x \), it is a numerical series, and the <strong>sum</strong> \( f(x) \) is the limit of the \( s_n(x) \). The whole of Section 4.1 revolves around one question: is the convergence <strong>uniform</strong> on a set \( A \), that is, does the <strong>remainder</strong> \( R_n = f - s_n \) become small for all \( x \in A \) at once? With this application, you can:
</p>
<ul>
	<li>
		choose a <strong>series</strong> among those of the examples of my lecture notes (the geometric series, those of the exponential and of the logarithm, \( \sum \frac{\cos (nx)}{n^2} \), the zeta function, van der Waerden’s function…) and of Exercises P1, P2 and T1 of Section 4.1, or enter your own <strong>general term</strong> \( f_n(x) \), for example <code>x^n/n!</code> or <code>sin(nx)/n^2</code>;
	</li>
	<li>
		draw the <strong>partial sums</strong> \( s_n \), in gold, and the sum \( f \), in green; move \( n \), or “add up the terms” one by one starting from the first; also show \( s_{n/2} \), \( s_{n/4} \)…, as in the figures of the notes;
	</li>
	<li>
		choose the <strong>set</strong> \( A \), for example \( (-1, 1) \) or \( [-r, r] \) for the geometric series, and drag its endpoints on the graph: often, the convergence is uniform only on smaller sets;
	</li>
	<li>
		follow, in each tab, a result of the section: <strong>pointwise convergence</strong> at a point \( x_0 \); <strong>uniform convergence</strong>, with the band \( f \pm \varepsilon \), the norm \( \lVert R_n \rVert_A \) and the rank from which the graph of \( s_n \) stays in the band (what leaves it is red); the <strong>Cauchy criterion</strong>, with the block \( s_m - s_n \); the uniform version of the <strong>term test</strong>, with \( \lVert f_n \rVert_A \); the <strong>Weierstrass \( M \)-test</strong>, with the numbers \( M_n \) and the band \( f \pm \rho_n \);
	</li>
	<li>
		read the <strong>reasoning</strong> of the lecture notes or of the solutions for the chosen series and set, step by step, up to its conclusion.
	</li>
</ul>

<p>
	Below the curves, a second graph shows the sequence of numbers that decides: \( s_n(x_0) \), \( \lVert R_n \rVert_A \), \( \lVert s_m - s_n \rVert_A \), \( \lVert f_n \rVert_A \) or \( M_n \). The mouse wheel zooms in on the graphs and a double-click resets the view. For a series or an interval of your own, the application only gives numerical values: to conclude, a test is needed. The “Copy link” button gives an address that reopens the same series with the same settings, handy for showing it in class. Press <kbd>?</kbd> in the application for the complete help.
</p>

<p class="rd-credit">
	HTML, CSS and JavaScript application, created with the help of Claude Code (Anthropic). The formulas are typeset with KaTeX.
</p>
</div>
</details>
<button type="button" class="app-plein-ecran" data-plein-ecran="app-series" title="Show the application in full screen" hidden>⛶&nbsp;Full screen</button>
</div>

<div class="app-cadre ecran" data-hauteur-etroit>
<iframe id="app-series" src="apps/series-fonctions/index.html?lang=en&amp;embed=1" title="Series of functions, interactive application" allow="clipboard-write" allowfullscreen></iframe>
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
