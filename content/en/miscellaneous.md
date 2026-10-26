---
page_title: Mathopo-Miscellaneous
nav: miscellaneous
lang: en
description: Things outside of mathematics — a video game I make in my spare time, maps of gas prices and EV charging stations in Québec, and pictures of waves.
---

<style>
.misc-game{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:18px;align-items:center;margin:.7rem 0 .3rem}
.misc-game img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px;border:1px solid rgba(0,0,0,.12)}
.misc-game p{margin:0 0 .9rem}
.misc-links{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem 1.2rem}
.misc-gallery{columns:2 260px;column-gap:14px;margin:.8rem 0 .2rem}
.misc-gallery figure{break-inside:avoid;margin:0 0 14px}
.misc-gallery img{display:block;width:100%;height:auto;border-radius:10px;border:1px solid rgba(0,0,0,.12)}
.misc-gallery figcaption{font-size:.92rem;color:#555;margin-top:.35rem}
@media (max-width: 640px){ .misc-game{grid-template-columns:1fr} }
</style>

<article>
<h2 class="dessousText" id="Miscellaneous">Miscellaneous</h2>

<p>
	A few things outside of mathematics: a video game I make in my spare time, maps of gas prices and of EV charging stations in Québec, and pictures of waves.
</p>
</article>

<article>
<h3 class="dessousText" id="VideoGame">Verdelune — a video game</h3>

<div class="misc-game">
	<a href="verdelune.html" title="More about Verdelune"><img src="apps/verdelune/img/town.jpg" alt="The town of Cressford in Verdelune, built in voxels" loading="lazy"></a>
	<div>
		<p>
			Verdelune is an original creature adventure with real-time battles, in 3D or classic 2D, in English or French. It plays directly in the browser, with a keyboard or a controller.
		</p>
		<div class="misc-links">
			<a class="rd-bouton" href="verdelune.html">Discover the game</a>
			<a class="aLink" href="apps/verdelune/index.html?lang=en" target="_blank" rel="noopener" title="Opens the game in a new tab">Play now ↗</a>
		</div>
	</div>
</div>
</article>

<article>
<h3 class="dessousText" id="GasPrices">Gas prices in Québec</h3>

<div class="misc-game">
	<a href="essence.html" title="Open the gas price map"><img src="images/essence-carte.jpg" alt="The EssenceQC map: gas prices at service stations across Québec, next to the list of the cheapest stations" loading="lazy"></a>
	<div>
		<p>
			EssenceQC is a map of gasoline and diesel prices at service stations across Québec, based on the official data of the Régie de l’énergie. Search for a city or a brand, and compare regular, super and diesel. The map is in French.
		</p>
		<div class="misc-links">
			<a class="rd-bouton" href="essence.html">Open the map</a>
		</div>
	</div>
</div>
</article>

<article>
<h3 class="dessousText" id="EVCharging">EV charging stations in Québec</h3>

<div class="misc-game">
	<a href="apps/bornes/index.html" title="Open the charging station map"><img src="images/bornes-carte.jpg" alt="The BornesQC map: public charging stations across Québec, coloured by network, next to the list of the fastest stations" loading="lazy"></a>
	<div>
		<p>
			BornesQC gathers the public charging stations of every network on one map: Circuit électrique, FLO, Tesla, ChargePoint and others. Filter by network and by power (level 2, 50, 100 or 180 kW and more). The map is in French; this is a first prototype.
		</p>
		<div class="misc-links">
			<a class="rd-bouton" href="apps/bornes/index.html">Open the map</a>
		</div>
	</div>
</div>
</article>

<article>
<h3 class="dessousText" id="Waves">Waves</h3>

<p>
	Surfing is one of my favorite hobbies. Here are a few pictures from the water — click on a picture to see it in full size.
</p>

<div class="misc-gallery">
	<figure><a href="images/pierre-olivier-parise.JPG"><img src="images/waves/sept-iles-wave-2025.jpg" alt="Riding a wave in Sept-Îles" loading="lazy"></a><figcaption>One of the many waves I caught in Sept-Îles (July 2025).</figcaption></figure>
	<figure><a href="images/G0038072-InWater.JPG"><img src="images/waves/in-the-whitewater.jpg" alt="In the whitewater of a breaking wave" loading="lazy"></a><figcaption>In the whitewater, seen from a GoPro.</figcaption></figure>
	<figure><a href="images/DroneWaterPattern.png"><img src="images/waves/foam-from-a-drone.jpg" alt="White foam on dark water, seen from above" loading="lazy"></a><figcaption>Foam patterns seen from a drone.</figcaption></figure>
	<figure><a href="images/20241026_103636.jpg"><img src="images/waves/sept-iles-beach-2024.jpg" alt="Walking on a beach in Sept-Îles with a surfboard" loading="lazy"></a><figcaption>One of the many beaches of Sept-Îles (October 2024).</figcaption></figure>
</div>
<!-- To add a picture: put a copy about 1600 pixels wide in public/images/waves/, copy one of the <figure> lines above,
     and change the file names and the caption. The link (href) can point to the full-size picture in public/images/. -->
</article>
