---
page_title: Mathopo-Tétrabrot
nav: tetrabrot
lang: fr
description: Un article sur le Tétrabrot, une projection tridimensionnelle de l’ensemble de Mandelbrot multicomplexe.
---

<article>
    <p>
        En dynamique <a href="https://en.wikipedia.org/wiki/Multicomplex_number" target="_blank">multicomplexe</a>, le Tétrabrot<sup><a href="#Rochon2000" id='returnRochon2000' title="D. Rochon, 'A Generalized Mandelbrot Set for Bicomplex Numbers', Fractals, 8(4):355-368, 2000.">[1]</a></sup> est une généralisation tridimensionnelle de l’<a href="https://en.wikipedia.org/wiki/Mandelbrot_set" target="_blank">ensemble de Mandelbrot</a>. Découvert par Dominic Rochon en 2000, il peut être interprété comme une tranche tridimensionnelle \(\mathcal{T}^2(1, \mathbf{i_1}, \mathbf{i_2})\) de l’ensemble Multibrot tricomplexe \(\mathcal{M}_3^2\).
    </p>
    <p>
        <figure>
            <img width="512" alt="Tétrabrot avec ensembles de Julia" title="Mathopo, CC BY-SA 4.0 &lt;https://creativecommons.org/licenses/by-sa/4.0&gt;, via Wikimedia Commons" src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Tetrabrot_with_Julia_sets.png/512px-Tetrabrot_with_Julia_sets.png">
            <figcaption>
            Illustration des ensembles de Julia remplis associés au Tétrabrot
            </figcaption>
        </figure>
    </p>
</article>


<article>
    <h2>
        Algorithme par couches de divergence
    </h2>
    <p>
        Il existe différents algorithmes permettant de générer des images du Tétrabrot. Dans l’<strong>espace tricomplexe</strong>, ces algorithmes utilisent la fonction tricomplexe \(f_c (\eta) := \eta^p + c \), où \(\eta , c \in \mathbb{TC}\) et où \(p \geq 2\) est un entier. Le nombre \(c\) appartient à \(\mathcal{T}^2 (1, \mathbf{i_1}, \mathbf{i_2})\) si et seulement si \(|f_c^m(0)| \leq 2\), pour tout entier \(m \geq 1\). Cette condition signifie que l’ensemble des nombres \( f_c^m (0) \) doit être borné pour tout entier \(m \geq 1 \).
    </p>
    <p>
        Puisqu’il est impossible de calculer un nombre infini d’itérations sur un ordinateur, il est nécessaire de considérer une approximation de cette condition. On fixe donc un nombre fini d’itérations à tester, disons \(M\). Le nombre \(c\) appartient au Tétrabrot si les nombres \(f_c^m(0)\), pour \(m \in \{1, 2, \ldots , M\}\), demeurent bornés par \(2\). Cette méthode est appelée <strong>algorithme par couches de divergence</strong> (*Divergence-Layer Algorithm*). Elle est utilisée pour tracer le Tétrabrot dans l’espace tridimensionnel.
    </p>
    <p>
        <figure>
            <img width="512" alt="Tétrabrot par couches" src="https://upload.wikimedia.org/wikipedia/commons/5/5a/Tetrabrot_layered.png">
            <figurecaption>
                Illustration du Tétrabrot à l’aide de l’algorithme par couches de divergence
            </figurecaption>
        </figure>
    </p>
</article>

<article>
    <h2>
        Théorème de Fatou-Julia généralisé
    </h2>
    <p>
        L’<a href="https://en.wikipedia.org/wiki/Julia_set" target="_blank">ensemble de Julia</a> rempli tricomplexe d’ordre \(p = 2\), pour \(c \in \mathbb{TC}\), est défini par
        $$
            \mathcal{K}_{3, c}^2 := \{ \eta \in \mathbb{TC} \, : \, \{ f_c^m (\eta)\}_{m = 1}^\infty \text{ est bornée.} \}
        $$
        Le <a href="https://en.wikipedia.org/wiki/Attractor#Basins_of_attraction" target="_blank">bassin d’attraction</a> en \(\infty\) de \(f_c(\eta) = \eta^2 + c\) est défini par \(A_{3, c} (\infty) := \mathbb{TC} \backslash \mathcal{K}_{3, c}^2\), c’est-à-dire
        $$
            A_{3, c} (\infty) = \{ \eta \in \mathbb{TC} \, : \, f_c^m (\eta ) \rightarrow \infty \text{ lorsque } m \rightarrow \infty \}
        $$
        et le bassin d’attraction fort en \(\infty\) de \(f_c\) est défini par
        $$
            SA_{3, c} (\infty ) := \Big( A_{c_{\gamma{1} \gamma_3}} (\infty) \times_{\gamma_1} A_{c_{\overline{\gamma}_1 \gamma_3}} (\infty ) \Big) \times_{\gamma_3} \Big( A_{c_{\gamma_1 \overline{\gamma}_3}} (\infty) \times_{\gamma_1} A_{c_{\overline{\gamma}_1 \overline{\gamma}_3}} (\infty) \Big) ,
        $$
        où \(A_c (\infty)\) désigne le bassin d’attraction de \(f_c\) en \(\infty\) pour \(c \in \mathbb{C}(\mathbf{i_1})\).
    </p>
    <p>
        Avec ces notations, le <strong>théorème de Fatou-Julia généralisé</strong> pour \(\mathcal{M}_3^2\) s’énonce de la manière suivante<sup><a href="#RochonGarant2008" id='returnRochonGarant2008' title="V. Garant-Pelletier and D. Rochon, 'On a Generalized Fatou-Julia Theorem in Multicomplex Space', Fractals, 17(3):241-255, 2008.">[2]</a></sup> :
            <ul>
                <li> \( 0 \in \mathcal{K}_{3, c}^2\) si et seulement si \(\mathcal{K}_{3, c}^2\) est connexe ;</li>
                <li> \( 0 \in SA_{3, c} (\infty)\) si et seulement si \(\mathcal{K}_{3, c}^2\) est un ensemble de Cantor ;</li>
                <li> \( 0 \in A_{3, c} (\infty ) \backslash SA_{3, c} (\infty ) \) si et seulement si \( \mathcal{K}_{3, c}^2\) est déconnecté mais pas totalement.</li>
            </ul>
    </p>
    <figure>
        <img width="512" alt="Fatou-Julia Tétrabrot" src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Fatou-Julia_Tetrabrot.png/512px-Fatou-Julia_Tetrabrot.png">
        <figurecaption>
            Illustration du théorème de Fatou-Julia pour le Tétrabrot
        </figurecaption>
    </figure>
</article>

<article>
    <h2>
        Lancer de rayons
    </h2>
    <p>
        En 1982, A. Norton<sup><a href="#Norton1982" id = 'returnNorton1982' title="A. Norton, 'Generation and Display of Geometric Fractals in 3-D', Computer Graphics, 16:61-67, 1982.">[3]</a></sup> a proposé plusieurs algorithmes pour la génération et l’affichage de formes fractales en trois dimensions. Pour la première fois, l’itération utilisant des <a href="https://en.wikipedia.org/wiki/Quaternion" target="_blank">quaternions</a><sup><a href="#Kantor1982" id='returnKantor1982' title="I. L. Kantor, Hypercomplex Numbers, Springer-Verlag, New-York, 1982.">[4]</a></sup> est apparue. Des résultats théoriques ont été obtenus pour l’<strong>ensemble de Mandelbrot quaternionique</strong><sup><a id='returnBeddingBriggs1995' href="#BeddingBriggs1995" title="S. Bedding and K. Briggs, 'Iteration of Quaternion Maps', Int. J. Bifur. Chaos Appl. Sci. Eng., 5:877-881, 1995">[5]</a></sup><sup><a id='returnGomataDoyleStevesMcFarlane1995' href="#GomataDoyleStevesMcFarlane1995" title="J. Gomatam, J. Doyle, B. Steves and I. McFarlane, 'Generalization of the Mandelbrot Set: Quaternionic Quadratic Maps', Chaos, Solitons & Fractals, 5:971-985, 1995.">[6]</a></sup> (voir <a href="https://www.youtube.com/watch?v=nfhiWHimcLc" target="_blank">la vidéo</a>), défini à l’aide du polynôme quadratique quaternionique \(q^2 + c\).
    </p>
    <figure>
        <img width="512" alt="Ensemble de Julia quaternionique Douady Rabbit" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Quaternion_Julia_Douady_rabbit.jpg/512px-Quaternion_Julia_Douady_rabbit.jpg">
        <figurecaption>
            Ensemble de Julia quaternionique avec paramètres \(c = 0.123 + 0.745i\) et une coupe dans le plan \(XY\). L’ensemble de Julia « Douady Rabbit » est visible dans la coupe.
        </figurecaption>
    </figure>
    <p>
        En 2005, en utilisant les <a href="https://en.wikipedia.org/wiki/Bicomplex_number" target="_blank">nombres bicomplexes</a>, É. Martineau et D. Rochon<sup><a href="#MartineauRochon2005" id="returnMartineauRochon2005"title="É. Martineau and D. Rochon, 'On a Bicomplex Distance Estimation for the Tetrabrot', International Journal of Bifurcation and Chaos, 15(6):501-521, 2005.">[7]</a></sup> ont obtenu des estimations des bornes inférieure et supérieure de la distance entre un point \(c\) situé à l’extérieur de l’ensemble de Mandelbrot bicomplexe \(\mathcal{M}_2^2\) et \(\mathcal{M}_2^2\) lui-même. Soit \(c \not\in \mathcal{M}_2^2\), et définissons
            $$
            d(c, \mathcal{M}_2^2) := \inf \{ |w - c| \, : \, w \in \mathcal{M}_2^2 .\}
            $$
        Alors,
            $$
            d(c, \mathcal{M}_2^2) = \sqrt{\frac{d(c_{\gamma_1}, \mathcal{M}^2) + d(c_{\overline{\gamma}_1}, \mathcal{M}^2)}{2}},
            $$
        où \(\mathcal{M}^2\) désigne l’<a href="https://en.wikipedia.org/wiki/Mandelbrot_set" target="_blank">ensemble de Mandelbrot</a> classique.
    </p>
    <p>
        En utilisant la fonction de Green \(G : \mathbb{C}(\mathbf{i_1}) \backslash \mathcal{M}^2 \rightarrow \mathbb{C}(\mathbf{i_1}) \backslash \overline{B}_1 (0, 1)\) dans le plan complexe, où \(\overline{B}_1 (0, 1)\) est la boule unité fermée de \(\mathbb{C}(\mathbf{i_1}) \simeq \mathbb{C}\), la distance est approximée de la manière suivante<sup><a href="#HartSandinKauffman1989" id="returnHartSandinKauffman1989" title="J. C. Hart, D. J. Sandin and L. H. Kauffman, 'Ray tracing deterministic 3-D fractals', Comput. Graph., 23:289-296, 1989.">[8]</a></sup> :
        $$
            \frac{|z_m| \ln |z_m|}{2|z_m|^{1/2^m} |z_m'|} \approx \frac{\sinh G(c_\gamma)}{2^{G(c_\gamma)}|G'(c_\gamma)|} < d(c_\gamma, \mathcal{M}^2) ,
        $$
        pour tout \(c_\gamma \in \mathbb{C}(\mathbf{i_1}) \backslash \mathcal{M}^2\) et pour \(m\) suffisamment grand, où \(z_m := f_{c_\gamma}^m (0)\) et \(z_m' :=  \frac{d}{dc} f_c (0) |_{c = c_\gamma}\). Cette approximation fournit une borne inférieure pouvant être utilisée pour le <a href="https://en.wikipedia.org/wiki/Ray_tracing_(graphics)" target="_blank">lancer de rayons</a> du Tétrabrot.
    </p>
    <p>
        <figure>
            <img width="512" alt="Tétrabrot par lancer de rayons" src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Tetrabrot_ray-traced.png/512px-Tetrabrot_ray-traced.png">
            <figurecaption>
                Tétrabrot obtenu par lancer de rayons
            </figurecaption>
        </figure>
    </p>
    <p>
        Il existe également une généralisation de la borne inférieure pour \(d (c, \mathcal{M}_2^2)\) à l’ensemble Multibrot tricomplexe d’ordre \(p\)<sup><a id="returnBrouillettePariseRochon2019" href="#BrouillettePariseRochon2019" title="G. Brouillette, P.-O. Parisé & D. Rochon, 'Tricomplex Distance Estimation for Filled-in Julia Sets and Multibrot Sets', International Journal of Bifurcation and Chaos, 29, No. 6, 2019.">[9]</a></sup>. Certaines ressources et images sont disponibles sur la page personnelle de <a href="http://aleph1.sourceforge.net/gallery/mandelbrot/">Aleph One</a>. Une <a href="https://www.youtube.com/watch?v=y5Sp82y7XuA" target="_blank">vidéo</a> est également disponible sur YouTube, où des régions spécifiques du Tétrabrot de Rochon sont explorées.
    </p>
</article>

<article>
    <h2>
        Références
    </h2>
    <ol>
        <li> <a id='Rochon2000' href='#returnRochon2000'>^</a>D. Rochon, « A Generalized Mandelbrot Set for Bicomplex Numbers », Fractals, 8(4):355-368, 2000.</li>
        <li> <a id='RochonGarant2008' href='#returnRochonGarant2008'>^</a>V. Garant-Pelletier et D. Rochon, « On a Generalized Fatou-Julia Theorem in Multicomplex Space », Fractals, 17(3):241-255, 2008.</li>
        <li> <a id='Norton1982' href='#returnNorton1982'>^</a>A. Norton, « Generation and Display of Geometric Fractals in 3-D », Computer Graphics, 16:61-67, 1982.</li>
        <li> <a id='Kantor1982' href='#returnKantor1982'>^</a>I. L. Kantor, <em>Hypercomplex Numbers</em>, Springer-Verlag, New-York, 1982.</li>
        <li> <a id='BeddingBriggs1995' href='#returnBeddingBriggs1995'>^</a>S. Bedding et K. Briggs, « Iteration of Quaternion Maps », Int. J. Bifur. Chaos Appl. Sci. Eng., 5:877-881, 1995.</li>
        <li> <a id='GomataDoyleStevesMcFarlane1995' href='#returnGomataDoyleStevesMcFarlane1995'>^</a>J. Gomatam, J. Doyle, B. Steves et I. McFarlane, « Generalization of the Mandelbrot Set: Quaternionic Quadratic Maps », Chaos, Solitons & Fractals, 5:971-985, 1995.</li>
        <li> <a id='MartineauRochon2005' href='#returnMartineauRochon2005'>^</a>É. Martineau et D. Rochon, « On a Bicomplex Distance Estimation for the Tetrabrot », International Journal of Bifurcation and Chaos, 15(6):501-521, 2005.</li>
        <li> <a id='HartSandinKauffman1989' href='#returnHartSandinKauffman1989'>^</a>J. C. Hart, D. J. Sandin et L. H. Kauffman, « Ray tracing deterministic 3-D fractals », Comput. Graph., 23:289-296, 1989.</li>
        <li> <a id='BrouillettePariseRochon2019' href='#returnBrouillettePariseRochon2019'>^</a>G. Brouillette, P.-O. Parisé et D. Rochon, « Tricomplex Distance Estimation for Filled-in Julia Sets and Multibrot Sets », International Journal of Bifurcation and Chaos, 29(6), 2019.</li>
    </ol>
</article>
