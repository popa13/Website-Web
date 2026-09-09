---
page_title: "Sommes de Riemann et de Darboux"
nav: "teaching"
wide: true
---

<article>
<h2 class="dessousText" id="RiemannDarboux">Sommes de Riemann et de Darboux</h2>
<p class="subtitle">Application interactive pour le cours MPU1054 – Analyse à une variable réelle II (chapitre 1 : l’intégrale de Riemann).</p>

<p>
	Cette application illustre la construction de l’intégrale de Riemann d’une fonction \( f \) sur un intervalle \( [a, b] \) :
</p>
<ul>
	<li>
		la <strong>partition</strong> \( \mathcal{P} = \{x_0, x_1, \ldots, x_n\} \) de \( [a, b] \) – uniforme, quadratique, aléatoire ou libre – dont on déplace les points \( x_k \) à la souris et que l’on raffine avec la molette ;
	</li>
	<li>
		les <strong>marques</strong> \( t_k \in [x_{k-1}, x_k] \) (extrémités gauches, extrémités droites, milieux, aléatoires ou libres) et la <strong>somme de Riemann</strong> \( S(f;\dot{\mathcal{P}}) = \sum_{k=1}^{n} f(t_k)\,(x_k - x_{k-1}) \) ;
	</li>
	<li>
		les <strong>sommes de Darboux</strong> inférieure \( L(f;\mathcal{P}) = \sum_{k=1}^{n} m_k\,(x_k - x_{k-1}) \) et supérieure \( U(f;\mathcal{P}) = \sum_{k=1}^{n} M_k\,(x_k - x_{k-1}) \), où \( m_k \) et \( M_k \) désignent l’infimum et le supremum de \( f \) sur \( [x_{k-1}, x_k] \), ainsi que l’encadrement \( L(f;\mathcal{P}) \le S(f;\dot{\mathcal{P}}) \le U(f;\mathcal{P}) \) ;
	</li>
	<li>
		le <strong>passage à la limite</strong> : en raffinant la partition, la différence \( U(f;\mathcal{P}) - L(f;\mathcal{P}) \) tend vers \( 0 \) et toutes les sommes convergent vers \( \int_a^b f(x)\,dx \).
	</li>
</ul>

<p class="rd-actions">
	<a class="rd-bouton" href="../apps/riemann-darboux/index.html?lang=fr" target="_blank" rel="noopener" title="Ouvrir l’application dans un nouvel onglet">Ouvrir l’application en plein écran</a>
</p>

<div class="rd-cadre">
	<iframe src="../apps/riemann-darboux/index.html?lang=fr" title="Sommes de Riemann et de Darboux – application interactive" loading="lazy" allowfullscreen></iframe>
</div>

<p>
	Fonctions disponibles : une fonction « générique » non monotone, \( x \), \( x^2 \), \( x^3 \), \( x^3 - x \), ou toute expression saisie au clavier (par exemple <code>sqrt(x)</code> ou <code>sin(x) + x/2</code>). Les nombres \( a \) et \( b \) ainsi que les points \( x_k \) se déplacent à la souris, la molette change le nombre de sous-intervalles, un double-clic ajoute un point à la partition et le bouton « Animer » raffine automatiquement la partition. La touche <kbd>?</kbd> affiche l’aide complète dans l’application.
</p>

<p class="rd-credit">
	Application autonome en HTML, CSS et JavaScript, aux couleurs de l’UQTR, créée avec l’aide de Claude Code (Anthropic) à partir des notes du cours.
</p>
</article>
