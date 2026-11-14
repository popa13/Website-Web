---
page_title: "Rearranging a series — Pierre-Olivier Parisé"
nav: "teaching"
wide: true
---

<article>
<p class="retour-cours"><a href="mpu1054.html#Applications" title="MPU1054 - course page (applications and activities)">← Back to the MPU1054 course page</a></p>
<h1 id="Rearrangements">Rearranging a series</h1>
<p class="subtitle">Change the order of the terms of a series… and the sum changes: Riemann’s rearrangement theorem, live.</p>

<div class="app-barre">
<details class="app-aide">
<summary>How to use</summary>
<div class="app-aide-contenu">
<p>
	For a finite sum, the order of the terms does not matter. For a series, it can change everything. The alternating harmonic series \( 1 - \frac{1}{2} + \frac{1}{3} - \frac{1}{4} + \cdots \) converges to \( \log 2 \approx 0.693 \), but its terms taken in the order “one positive, two negative”, \( 1 - \frac{1}{2} - \frac{1}{4} + \frac{1}{3} - \frac{1}{6} - \frac{1}{8} + \cdots \), give a series that converges to half that value. Riemann showed that one can go much further: if a series converges but does not converge absolutely, its terms can be reordered so that the sum is <strong>any value chosen in advance</strong>. With this application, you can:
</p>
<ul>
	<li>
		enter the <strong>general term</strong> \( x_n \) of a series, for example <code>(-1)^(n+1)/n</code>, <code>sin(n)/n</code> or <code>cos(n*pi/3)/n</code>, and see the series written out, with a numerical diagnosis of its convergence;
	</li>
	<li>
		<strong>choose the terms yourself</strong>, \( y_1, y_2, y_3, \ldots \), of the rearrangement \( y_k = x_{f(k)} \): from the bank of positive and negative terms, right on the graph (a click above the last point adds the next positive term, a click below it the next negative term, with a preview before the click) or with the keyboard, then drag the terms to change their order;
	</li>
	<li>
		follow on the <strong>graph</strong>, in the style of my lecture notes, the partial sums \( t_k = y_1 + y_2 + \cdots + y_k \) of the rearrangement next to those of the original series, term by term, with exact values when possible;
	</li>
	<li>
		run <strong>Riemann’s procedure</strong> toward a value \( c \) typed in, set with the slider or chosen by dragging the gold line on the graph: positive terms as long as \( t_k \le c \), then negative terms as long as \( t_k > c \), and so on, one step at a time or up to thousands of terms;
	</li>
	<li>
		see, with an absolutely convergent series such as \( \sum (-1)^{n+1}/n^2 \), that the procedure can no longer reach any value: this is the <strong>rearrangement theorem</strong>, which says that all the rearrangements of an absolutely convergent series have the same sum.
	</li>
</ul>

<p>
	The “Pattern” row adds 60 terms following a regular pattern, for example 2 positive terms then 1 negative; for the alternating harmonic series, the application also gives the sum \( \log 2 + \frac{1}{2}\log\frac{p}{q} \) of the rearrangement “\( p \) positive, \( q \) negative”. The “Copy link” button gives an address that reopens the same rearrangement (up to 400 terms), handy for showing it in class. Press <kbd>?</kbd> in the application for the complete help.
</p>

<p class="rd-credit">
	HTML, CSS and JavaScript application, created with the help of Claude Code (Anthropic). The formulas are typeset with KaTeX.
</p>
</div>
</details>
<button type="button" class="app-plein-ecran" data-plein-ecran="app-rearr" title="Show the application in full screen" hidden>⛶&nbsp;Full screen</button>
</div>

<div class="app-cadre ecran">
<iframe id="app-rearr" src="apps/rearrangements/index.html?lang=en&amp;embed=1" title="Rearranging a series, interactive application" allow="clipboard-write" allowfullscreen></iframe>
</div>

<script>
	// Une adresse comme rearrangements.html?x=sin(n)/n&c=0.5 ouvre l’application avec cette série
	// (x : terme général, f : les indices f(1), f(2), … déjà choisis, séparés par des virgules,
	// c : la valeur visée par le procédé de Riemann). C’est aussi l’adresse que donne « Copier le lien ».
	(function () {
		var depart = new URLSearchParams(location.search), suite = '';
		var valide = {
			x: function (v) { return v.length <= 200 && !/[<>"'`]/.test(v); },
			f: function (v) { return v.length <= 3200 && /^\d+(,\d+)*$/.test(v); },
			c: function (v) { return /^-?(\d{1,7}(\.\d{1,12})?|\.\d{1,12})$/.test(v); }
		};
		['x', 'f', 'c'].forEach(function (cle) {
			var v = depart.get(cle);
			if (v && valide[cle](v)) suite += '&' + cle + '=' + encodeURIComponent(v);
		});
		if (!suite) return;
		var cadre = document.getElementById('app-rearr');
		cadre.setAttribute('src', cadre.getAttribute('src') + suite);
	})();
</script>
</article>
