---
page_title: "Riemann and Darboux Sums"
nav: "teaching"
wide: true
---

<article>
<h2 class="dessousText" id="RiemannDarboux">Riemann and Darboux Sums</h2>
<p class="subtitle">Interactive application for the course MPU1054 – Analysis in One Real Variable II (Chapter 1: the Riemann integral).</p>

<p>
	This application illustrates the construction of the Riemann integral of a function \( f \) over an interval \( [a, b] \):
</p>
<ul>
	<li>
		the <strong>partition</strong> \( \mathcal{P} = \{x_0, x_1, \ldots, x_n\} \) of \( [a, b] \) – uniform, quadratic, random or free – whose points \( x_k \) can be dragged with the mouse and refined with the mouse wheel;
	</li>
	<li>
		the <strong>tags</strong> \( t_k \in [x_{k-1}, x_k] \) (left endpoints, right endpoints, midpoints, random or free) and the <strong>Riemann sum</strong> \( S(f;\dot{\mathcal{P}}) = \sum_{k=1}^{n} f(t_k)\,(x_k - x_{k-1}) \);
	</li>
	<li>
		the lower and upper <strong>Darboux sums</strong> \( L(f;\mathcal{P}) = \sum_{k=1}^{n} m_k\,(x_k - x_{k-1}) \) and \( U(f;\mathcal{P}) = \sum_{k=1}^{n} M_k\,(x_k - x_{k-1}) \), where \( m_k \) and \( M_k \) are the infimum and the supremum of \( f \) on \( [x_{k-1}, x_k] \), together with the inequalities \( L(f;\mathcal{P}) \le S(f;\dot{\mathcal{P}}) \le U(f;\mathcal{P}) \);
	</li>
	<li>
		the <strong>limiting process</strong>: as the partition is refined, the difference \( U(f;\mathcal{P}) - L(f;\mathcal{P}) \) tends to \( 0 \) and all the sums converge to \( \int_a^b f(x)\,dx \).
	</li>
</ul>

<p class="rd-actions">
	<a class="rd-bouton" href="apps/riemann-darboux/index.html?lang=en" target="_blank" rel="noopener" title="Open the application in a new tab">Open the application in full screen</a>
</p>

<div class="rd-cadre">
	<iframe src="apps/riemann-darboux/index.html?lang=en" title="Riemann and Darboux sums – interactive application" loading="lazy" allowfullscreen></iframe>
</div>

<p>
	Available functions: a non-monotonic “generic” function, \( x \), \( x^2 \), \( x^3 \), \( x^3 - x \), or any expression typed in (for instance <code>sqrt(x)</code> or <code>sin(x) + x/2</code>). The numbers \( a \) and \( b \) and the points \( x_k \) are dragged with the mouse, the mouse wheel changes the number of subintervals, a double-click adds a point to the partition, and the “Animate” button refines the partition automatically. Press <kbd>?</kbd> in the application for the complete help.
</p>

<p class="rd-credit">
	Standalone HTML, CSS and JavaScript application in the colours of UQTR, created with the help of Claude Code (Anthropic) from the course notes.
</p>
</article>
