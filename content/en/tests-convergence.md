---
page_title: "Convergence tests — Pierre-Olivier Parisé"
nav: "teaching"
wide: true
---

<article>
<p class="retour-cours"><a href="mpu1054.html#Applications" title="MPU1054 - course page (applications and activities)">← Back to the MPU1054 course page</a></p>
<h1 id="TestsConvergence">Convergence tests</h1>
<p class="subtitle">Series of positive terms: each term is the area of a rectangle, and each test compares areas.</p>

<div class="app-barre">
<details class="app-aide">
<summary>How to use</summary>
<div class="app-aide-contenu">
<p>
	Let us draw each term \( x_n \ge 0 \) of a series as a rectangle of width 1 and height \( x_n \): its area is \( x_n \), the partial sum \( s_n \) is the area of the first \( n \) rectangles, and the series converges if and only if the total area is finite. The first terms do not change the nature of the series: only the <strong>tail</strong> counts, the area from some rank \( N \) on. The five convergence tests of the course rest on the same idea: <strong>compare this area with a known area</strong>, that of a series whose nature is known or that under a curve. With this application, you can:
</p>
<ul>
	<li>
		choose the <strong>test</strong>: comparison or limit comparison (Section 3.1), root, ratio or integral (Section 3.3);
	</li>
	<li>
		enter the <strong>general term</strong> \( x_n \) of the series, for example <code>n/2^n</code>, <code>n!/n^n</code> or <code>(log n)^(-n)</code>, and, for the two comparison tests, that of the comparison series \( y_n \), for example <code>1/n^2</code>; the examples of my lecture notes and of the exercises are one click away;
	</li>
	<li>
		see the <strong>rectangles</strong> of \( x_n \), in gold, and those of the comparison series, in green (for the root and ratio tests, it is the geometric series given by the test); what sticks out is in red, and the exact values are written when they fit above the rectangles;
	</li>
	<li>
		follow, below the rectangles, the <strong>sequence that decides the test</strong>, \( x_n/y_n \), \( x_n^{1/n} \) or \( x_{n+1}/x_n \), and its limit \( r \), estimated numerically and recognized when possible (for example \( r = 1/e \) for \( n!/n^n \));
	</li>
	<li>
		move the <strong>rank</strong> \( N \) (or \( K \)) and choose \( \varepsilon \) or \( r_1 \), with the sliders or by dragging the lines of the graph: the application checks the inequality of the test from this rank on (numerically, up to \( n = 10^7 \)) and suggests the smallest rank that works;
	</li>
	<li>
		for the <strong>integral test</strong>, see the curve \( y = f(t) \) that gives the terms, \( x_n = f(n) \), the area under the curve from the rank on and the rectangles, under the curve or above it; the application looks for an antiderivative (the indefinite integral \( \int f(t)\,dt = F(t) + C \)), then for the limit of \( F(b) - F(N) \), and gives \( \int_N^\infty f(t)\,dt \) exactly when possible (\( \pi/4 \) for \( f(t) = 1/(t^2+1) \), \( +\infty \) for \( f(t) = 1/(t \log t) \));
	</li>
	<li>
		<strong>add up the areas</strong> from the rank on, one rectangle at a time, then faster and faster: the two areas stay finite, or become infinite, together;
	</li>
	<li>
		read the <strong>reasoning</strong> of the test, step by step, up to its conclusion, or up to the reason why it is inconclusive (a bound by a divergent series, \( r = 1 \) for the root and ratio tests, a function that is not decreasing for the integral test…).
	</li>
</ul>

<p>
	The “The tail” button shows the rectangles from the rank on, enlarged, and the logarithmic scale makes very small terms visible; the mouse wheel zooms in on the graph and a click on a rectangle puts the rank there. The “Copy link” button gives an address that reopens the same test with the same series, handy for showing it in class. Press <kbd>?</kbd> in the application for the complete help.
</p>

<p class="rd-credit">
	HTML, CSS and JavaScript application, created with the help of Claude Code (Anthropic). The formulas are typeset with KaTeX.
</p>
</div>
</details>
<button type="button" class="app-plein-ecran" data-plein-ecran="app-tests" title="Show the application in full screen" hidden>⛶&nbsp;Full screen</button>
</div>

<div class="app-cadre ecran" data-hauteur-etroit>
<iframe id="app-tests" src="apps/tests-convergence/index.html?lang=en&amp;embed=1" title="Convergence tests, interactive application" allow="clipboard-write" allowfullscreen></iframe>
</div>

<script>
	// Une adresse comme tests-convergence.html?t=quotient&x=n!/n^n ouvre l’application avec ce test
	// et cette série (t : comparaison, limite, racine, quotient ou integrale ; x et y : les termes généraux ;
	// N : le rang ; eps et r1 : ε et r₁ ; rect : sous ou dessus). C’est aussi l’adresse que donne « Copier le lien ».
	(function () {
		var depart = new URLSearchParams(location.search), suite = '';
		var terme = function (v) { return v.length <= 200 && !/[<>"'`]/.test(v); };
		var nombre = function (v) { return /^-?(\d{1,7}(\.\d{1,12})?|\.\d{1,12})(e[+-]?\d{1,3})?$/i.test(v); };
		var valide = {
			t: function (v) { return /^(comparaison|limite|racine|quotient|integrale)$/.test(v); },
			x: terme,
			y: terme,
			N: function (v) { return /^\d{1,8}$/.test(v); },
			eps: nombre,
			r1: nombre,
			rect: function (v) { return v === 'sous' || v === 'dessus'; }
		};
		['t', 'x', 'y', 'N', 'eps', 'r1', 'rect'].forEach(function (cle) {
			var v = depart.get(cle);
			if (v && valide[cle](v)) suite += '&' + cle + '=' + encodeURIComponent(v);
		});
		if (!suite) return;
		var cadre = document.getElementById('app-tests');
		cadre.setAttribute('src', cadre.getAttribute('src') + suite);
	})();
</script>
</article>
