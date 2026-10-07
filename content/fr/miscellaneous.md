---
page_title: Mathopo-Divers
nav: miscellaneous
lang: fr
description: En dehors des mathématiques — un jeu vidéo que je crée dans mes temps libres et des photos de vagues.
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
<h2 class="dessousText" id="Divers">Divers</h2>

<p>
    Quelques projets en dehors des mathématiques : un jeu vidéo que je crée dans mes temps libres, et des photos de vagues.
</p>
</article>

<article>
<h3 class="dessousText" id="JeuVideo">Verdelune — un jeu vidéo</h3>

<div class="misc-game">
    <a href="verdelune.html" title="En savoir plus sur Verdelune"><img src="../apps/verdelune/img/town.jpg" alt="La ville de Cressford dans Verdelune, construite en voxels" loading="lazy"></a>
    <div>
        <p>
            Verdelune est une aventure de créatures originale avec des combats en temps réel, en 3D ou en 2D classique, en français ou en anglais. Elle se joue directement dans le navigateur, au clavier ou à la manette.
        </p>
        <div class="misc-links">
            <a class="rd-bouton" href="verdelune.html">Découvrir le jeu</a>
            <a class="aLink" href="../apps/verdelune/index.html?lang=fr" target="_blank" rel="noopener" title="Ouvre le jeu dans un nouvel onglet">Jouer maintenant ↗</a>
        </div>
    </div>
</div>
</article>

<article>
<h3 class="dessousText" id="Vagues">Vagues</h3>

<p>
    Le surf est l’un de mes passe-temps préférés. Voici quelques photos prises sur l’eau — cliquez sur une photo pour la voir en grand.
</p>

<div class="misc-gallery">
    <figure><a href="../images/pierre-olivier-parise.JPG"><img src="../images/waves/sept-iles-wave-2025.jpg" alt="Sur une vague à Sept-Îles" loading="lazy"></a><figcaption>L’une des nombreuses vagues que j’ai prises à Sept-Îles (juillet 2025).</figcaption></figure>
    <figure><a href="../images/G0038072-InWater.JPG"><img src="../images/waves/in-the-whitewater.jpg" alt="Dans l’écume d’une vague qui déferle" loading="lazy"></a><figcaption>Dans l’écume, vu d’une GoPro.</figcaption></figure>
    <figure><a href="../images/DroneWaterPattern.png"><img src="../images/waves/foam-from-a-drone.jpg" alt="De l’écume blanche sur l’eau sombre, vue d’en haut" loading="lazy"></a><figcaption>Les motifs de l’écume vus d’un drone.</figcaption></figure>
    <figure><a href="../images/20241026_103636.jpg"><img src="../images/waves/sept-iles-beach-2024.jpg" alt="Sur une plage de Sept-Îles, planche de surf sous le bras" loading="lazy"></a><figcaption>L’une des nombreuses plages de Sept-Îles (octobre 2024).</figcaption></figure>
</div>
<!-- Pour ajouter une photo : mettez-en une copie d’environ 1600 pixels de large dans public/images/waves/, copiez l’une
     des lignes <figure> ci-dessus, puis changez les noms de fichiers et la légende. Le lien (href) peut pointer vers la
     photo en pleine grandeur dans public/images/. -->
</article>
