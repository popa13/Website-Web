---
page_title: "Les tours de Hanoï"
nav: "miscellaneous"
wide: true
---

<article>
<p class="retour-cours"><a href="miscellaneous.html#ToursHanoi" title="Retour à la page Divers">← Retour à la page Divers</a></p>
<h2 class="dessousText" id="ToursHanoi">Les tours de Hanoï</h2>
<p class="subtitle">Un jeu de 1883, une solution récursive et un problème encore ouvert : essayez-le jusqu’à 15 disques et 10 tiges.</p>

<p>
	Le but est de déplacer toute la tour de la tige A vers la dernière tige en respectant deux règles : on déplace <strong>un seul disque à la fois</strong>, et on ne pose <strong>jamais un disque sur un disque plus petit</strong>. Combien de coups faut-il au minimum ? C’est à vous de le découvrir ! Cette application accompagne ma présentation sur le travail des mathématiciens, où la tour de disques modélise une pile de caisses fragiles qu’un chariot élévateur doit déplacer d’un quai à l’autre. Elle permet de :
</p>
<ul>
	<li>
		<strong>jouer</strong> à la souris, au doigt ou au clavier, avec 1 à 15 disques et 3 à 10 tiges ;
	</li>
	<li>
		remplir son propre tableau <strong>« Combien de coups ? »</strong> : chaque tour réussie sans aide y inscrit son meilleur résultat, et un ✓ apparaît quand on atteint le minimum. Voyez-vous la régularité ? Pouvez-vous deviner la formule ?
	</li>
	<li>
		après 5 essais, voir la <strong>solution optimale</strong> se dérouler, de 0,5 à 1000 coups par seconde, avec les <strong>appels récursifs</strong> qui la construisent et la <strong>régularité cachée</strong> du disque qui bouge à chaque coup ;
	</li>
	<li>
		ajouter des tiges : la stratégie de <strong>Frame et Stewart</strong> (1941) n’a été démontrée optimale pour 4 tiges qu’en 2014, par Thierry Bousch ; pour 5 tiges ou plus, c’est un <strong>problème ouvert</strong>.
	</li>
</ul>

<p class="rd-actions">
	<a id="lien-hanoi" class="rd-bouton" href="../apps/tours-hanoi/index.html?lang=fr" target="_blank" rel="noopener" title="Ouvrir l’application dans un nouvel onglet">Ouvrir l’application en plein écran</a>
</p>

<div class="rd-cadre">
	<iframe id="app-hanoi" src="../apps/tours-hanoi/index.html?lang=fr" title="Les tours de Hanoï – application interactive" loading="lazy" allowfullscreen></iframe>
</div>
<script>
	// Une adresse comme tours-hanoi?n=5&p=4 ouvre l’application dans cette configuration
	// (n : nombre de disques, p : nombre de tiges, theme=caisses : les caisses).
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
	Le bouton « Indice » montre le prochain coup optimal depuis n’importe quelle position, l’apparence « Caisses » transforme les disques en caisses de l’entrepôt, et un clic dans le tableau « Combien de coups ? » lance la partie correspondante. La touche <kbd>?</kbd> affiche l’aide complète dans l’application.
</p>

<p class="rd-credit">
	Application autonome en HTML, CSS et JavaScript, aux couleurs de l’UQTR, créée avec l’aide de Claude Code (Anthropic).
</p>
</article>
