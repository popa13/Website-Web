---
page_title: "Réarranger une série"
nav: "teaching"
wide: true
---

<article>
<p class="retour-cours"><a href="mpu1054.html#Applications" title="MPU1054 – page du cours (applications et activités)">← Retour à la page du cours MPU1054</a></p>
<h2 class="dessousText" id="Rearrangements">Réarranger une série</h2>
<p class="subtitle">Changez l’ordre des termes d’une série… et la somme change : le théorème de réarrangement de Riemann, en direct.</p>

<p>
	Pour une somme finie, l’ordre des termes ne compte pas. Pour une série, il peut tout changer. La série harmonique alternée \( 1 - \frac{1}{2} + \frac{1}{3} - \frac{1}{4} + \cdots \) converge vers \( \log 2 \approx 0{,}693 \), mais ses termes pris dans l’ordre « un positif, deux négatifs », \( 1 - \frac{1}{2} - \frac{1}{4} + \frac{1}{3} - \frac{1}{6} - \frac{1}{8} + \cdots \), donnent une série qui converge vers la moitié de cette valeur. Riemann a montré qu’on peut aller beaucoup plus loin : si une série converge sans converger absolument, on peut réordonner ses termes pour que la somme soit <strong>n’importe quelle valeur choisie d’avance</strong>. Cette application permet de :
</p>
<ul>
	<li>
		entrer le <strong>terme général</strong> \( x_n \) d’une série, par exemple <code>(-1)^(n+1)/n</code>, <code>sin(n)/n</code> ou <code>cos(n*pi/3)/n</code>, et voir la série écrite en long, avec un diagnostic numérique de sa convergence ;
	</li>
	<li>
		<strong>choisir soi-même</strong> les termes \( y_1, y_2, y_3, \ldots \) du réarrangement \( y_k = x_{f(k)} \) : dans la banque des termes positifs et négatifs, directement sur le graphe (un clic au-dessus du dernier point ajoute le prochain terme positif, un clic au-dessous le prochain terme négatif, avec un aperçu avant le clic) ou au clavier, puis glisser les termes pour changer leur ordre ;
	</li>
	<li>
		suivre sur le <strong>graphe</strong>, dans le style des notes de cours, les sommes partielles \( t_k = y_1 + y_2 + \cdots + y_k \) du réarrangement à côté de celles de la série de départ, terme par terme, avec les valeurs exactes quand c’est possible ;
	</li>
	<li>
		lancer le <strong>procédé de Riemann</strong> vers une valeur \( c \) choisie au clavier, au curseur ou en glissant la ligne dorée sur le graphe : des termes positifs tant que \( t_k \le c \), puis des termes négatifs tant que \( t_k > c \), et ainsi de suite, un pas à la fois ou jusqu’à des milliers de termes ;
	</li>
	<li>
		constater, avec une série qui converge absolument comme \( \sum (-1)^{n+1}/n^2 \), que le procédé ne peut plus atteindre n’importe quelle valeur : c’est le <strong>théorème de réarrangement</strong>, selon lequel tous les réarrangements d’une série absolument convergente ont la même somme.
	</li>
</ul>

<p class="rd-actions">
	<a id="lien-rearr" class="rd-bouton" href="../apps/rearrangements/index.html?lang=fr" target="_blank" rel="noopener" title="Ouvrir l’application dans un nouvel onglet">Ouvrir l’application en plein écran</a>
</p>

<div class="rd-cadre">
	<iframe id="app-rearr" src="../apps/rearrangements/index.html?lang=fr" title="Réarranger une série – application interactive" loading="lazy" allow="clipboard-write" allowfullscreen></iframe>
</div>
<script>
	// Une adresse comme rearrangements.html?x=sin(n)/n&c=0.5 ouvre l’application avec cette série
	// (x : terme général, f : les indices f(1), f(2), … déjà choisis, séparés par des virgules,
	// c : la valeur visée par le procédé de Riemann).
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
		['app-rearr', 'lien-rearr'].forEach(function (id) {
			var e = document.getElementById(id), attr = e.tagName === 'IFRAME' ? 'src' : 'href';
			e.setAttribute(attr, e.getAttribute(attr) + suite);
		});
	})();
</script>

<p>
	La ligne « Motif » ajoute 60 termes selon un motif régulier, par exemple 2 termes positifs puis 1 négatif ; pour la série harmonique alternée, l’application donne aussi la somme \( \log 2 + \frac{1}{2}\log\frac{p}{q} \) du réarrangement « \( p \) positifs, \( q \) négatifs ». Le bouton « Copier le lien » donne une adresse qui rouvre le même réarrangement (jusqu’à 400 termes), pratique pour le projeter en classe. La touche <kbd>?</kbd> affiche l’aide complète dans l’application.
</p>

<p class="rd-credit">
	Application autonome en HTML, CSS et JavaScript, aux couleurs de l’UQTR, créée avec l’aide de Claude Code (Anthropic). Les formules sont composées avec KaTeX.
</p>
</article>
