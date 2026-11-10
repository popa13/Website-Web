---
page_title: "The Tower of Hanoi"
nav: "miscellaneous"
wide: true
---

<article>
<p class="retour-cours"><a href="miscellaneous.html#TowerOfHanoi" title="Back to the Miscellaneous page">← Back to Miscellaneous</a></p>
<h2 class="dessousText" id="TowerOfHanoi">The Tower of Hanoi</h2>
<p class="subtitle">A puzzle from 1883, a recursive solution and a problem that is still open: try it with up to 15 disks and 10 pegs.</p>

<p>
	The goal is to move the whole tower from peg A to the last peg following two rules: move <strong>only one disk at a time</strong>, and <strong>never place a disk on a smaller disk</strong>. What is the minimum number of moves? That is for you to find out! This application accompanies my talk on what mathematicians do, where the tower of disks models a stack of fragile crates that a forklift must move from one dock to another. With it, you can:
</p>
<ul>
	<li>
		<strong>play</strong> with the mouse, a finger or the keyboard, with 1 to 15 disks and 3 to 10 pegs;
	</li>
	<li>
		fill in your own <strong>“How many moves?”</strong> table: each tower solved without help writes your best result in it, and a ✓ appears when you reach the minimum. Do you see the pattern? Can you guess the formula?
	</li>
	<li>
		after 5 attempts, watch the <strong>optimal solution</strong> unfold, from 0.5 to 1000 moves per second, together with the <strong>recursive calls</strong> that build it and the <strong>hidden pattern</strong> of the disk that moves at each step;
	</li>
	<li>
		add pegs: the strategy of <strong>Frame and Stewart</strong> (1941) was only proved optimal for 4 pegs in 2014, by Thierry Bousch; for 5 pegs or more, it is an <strong>open problem</strong>.
	</li>
</ul>

<p class="rd-actions">
	<a id="lien-hanoi" class="rd-bouton" href="apps/tours-hanoi/index.html?lang=en" target="_blank" rel="noopener" title="Open the application in a new tab">Open the application in full screen</a>
</p>

<div class="rd-cadre">
	<iframe id="app-hanoi" src="apps/tours-hanoi/index.html?lang=en" title="The Tower of Hanoi – interactive application" loading="lazy" allowfullscreen></iframe>
</div>
<script>
	// An address such as tours-hanoi?n=5&p=4 opens the application in that configuration
	// (n: number of disks, p: number of pegs, theme=caisses: the crates).
	(function () {
		var depart = new URLSearchParams(location.search), suite = '';
		['n', 'p', 'theme'].forEach(function (cle) {
			var v = depart.get(cle);
			if (v && /^[a-z0-9]+$/i.test(v)) suite += '&' + cle + '=' + v;
		});
		if (!suite) return;
		['app-hanoi', 'lien-hanoi'].forEach(function (id) {
			var e = document.getElementById(id), attr = e.tagName === 'IFRAME' ? 'src' : 'href';
			e.setAttribute(attr, e.getAttribute(attr) + suite);
		});
	})();
</script>

<p>
	The “Hint” button shows the next optimal move from any position, the “Crates” look turns the disks into the crates of the warehouse, and a click in the “How many moves?” table starts the corresponding game. Press <kbd>?</kbd> in the application for the complete help.
</p>

<p class="rd-credit">
	Standalone HTML, CSS and JavaScript application in the colours of UQTR, created with the help of Claude Code (Anthropic).
</p>
</article>
