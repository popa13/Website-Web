---
page_title: Mathopo-Tetrabrot
nav: tetrabrot
lang: zh
description: 一篇关于 Tetrabrot 的文章，它是多复数 Mandelbrot 集的三维投影。
---

<article>
    <p>
        在 <a href="https://en.wikipedia.org/wiki/Multicomplex_number" target="_blank">多复数</a> 动力系统中，Tetrabrot<sup><a href="#Rochon2000" id='returnRochon2000' title="D. Rochon, 'A Generalized Mandelbrot Set for Bicomplex Numbers', Fractals, 8(4):355–368, 2000.">[1]</a></sup> 是 <a href="https://en.wikipedia.org/wiki/Mandelbrot_set" target="_blank">Mandelbrot 集</a> 的一种三维推广。该集合由 Dominic Rochon 于 2000 年发现，可以解释为三复数 Multibrot 集 \(\mathcal{M}_3^2\) 的一个三维切片 \(\mathcal{T}^2(1, \mathbf{i_1}, \mathbf{i_2})\)。
    </p>
    <p>
        <figure>
            <img width="512" alt="Tetrabrot with Julia sets" title="Mathopo, CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0>, via Wikimedia Commons" src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Tetrabrot_with_Julia_sets.png/512px-Tetrabrot_with_Julia_sets.png">
            <figcaption>
                与 Tetrabrot 相关的填充 Julia 集示意图
            </figcaption>
        </figure>
    </p>
</article>

<article>
    <h2>发散层算法（Divergence-Layers Algorithm）</h2>
    <p>
        生成 Tetrabrot 图像的方法有多种。在 <strong>三复数空间</strong> 中，这些算法使用三复数函数
        \( f_c(\eta) := \eta^p + c \)，其中 \(\eta, c \in \mathbb{TC}\)，且 \(p \ge 2\) 为整数。当且仅当对任意整数 \(m \ge 1\)，都有 \(|f_c^m(0)| \le 2\) 时，参数 \(c\) 属于 \(\mathcal{T}^2(1, \mathbf{i_1}, \mathbf{i_2})\)。这意味着迭代序列 \(\{f_c^m(0)\}\) 在所有阶数下保持有界。
    </p>
    <p>
        由于计算机无法进行无限次迭代，我们必须对该条件进行近似处理。因此，固定一个有限的迭代次数 \(M\)。若在所有 \(m \in \{1,2,\ldots,M\}\) 下均有 \(|f_c^m(0)| \le 2\)，则认为参数 \(c\) 属于 Tetrabrot。这种方法称为 <strong>发散层算法</strong>，并被用于在三维空间中绘制 Tetrabrot。
    </p>
    <p>
        <figure>
            <img width="512" alt="Tetrabrot layered" src="https://upload.wikimedia.org/wikipedia/commons/5/5a/Tetrabrot_layered.png">
            <figcaption>
                使用发散层算法绘制的 Tetrabrot 示例
            </figcaption>
        </figure>
    </p>
</article>

<article>
    <h2>广义 Fatou–Julia 定理</h2>
    <p>
        当 \(p=2\) 且 \(c \in \mathbb{TC}\) 时，三复数填充 <a href="https://en.wikipedia.org/wiki/Julia_set" target="_blank">Julia 集</a> 定义为
        $$
            \mathcal{K}_{3,c}^2 := \{ \eta \in \mathbb{TC} : \{ f_c^m(\eta) \}_{m=1}^{\infty} \text{ 有界} \}。
        $$
        函数 \(f_c(\eta)=\eta^2+c\) 在无穷远处的 <a href="https://en.wikipedia.org/wiki/Attractor#Basins_of_attraction" target="_blank">吸引域</a> 定义为
        \(A_{3,c}(\infty):=\mathbb{TC}\setminus\mathcal{K}_{3,c}^2\)，即
        $$
            A_{3,c}(\infty)=\{ \eta \in \mathbb{TC} : f_c^m(\eta) \to \infty \text{ 当 } m \to \infty \}。
        $$
        进一步定义强吸引域为
        $$
            SA_{3,c}(\infty) := \big( A_{c_{\gamma_1\gamma_3}}(\infty) \times_{\gamma_1} A_{c_{\overline{\gamma}_1\gamma_3}}(\infty) \big)
            \times_{\gamma_3}
            \big( A_{c_{\gamma_1\overline{\gamma}_3}}(\infty) \times_{\gamma_1} A_{c_{\overline{\gamma}_1\overline{\gamma}_3}}(\infty) \big)。
        $$
    </p>
    <p>
        在上述记号下，\(\mathcal{M}_3^2\) 的 <strong>广义 Fatou–Julia 定理</strong><sup><a href="#RochonGarant2008" id='returnRochonGarant2008'>[2]</a></sup> 表述如下：
        <ul>
            <li>\(0 \in \mathcal{K}_{3,c}^2\) 当且仅当 \(\mathcal{K}_{3,c}^2\) 是连通的；</li>
            <li>\(0 \in SA_{3,c}(\infty)\) 当且仅当 \(\mathcal{K}_{3,c}^2\) 是 Cantor 集；</li>
            <li>\(0 \in A_{3,c}(\infty) \setminus SA_{3,c}(\infty)\) 当且仅当 \(\mathcal{K}_{3,c}^2\) 非完全不连通。</li>
        </ul>
    </p>
    <figure>
        <img width="512" alt="Fatou-Julia Tetrabrot" src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Fatou-Julia_Tetrabrot.png/512px-Fatou-Julia_Tetrabrot.png">
        <figcaption>
            Tetrabrot 的 Fatou–Julia 定理示意图
        </figcaption>
    </figure>
</article>

<article>
    <h2>光线追踪（Ray-Tracing）</h2>
    <p>
        1982 年，A. Norton<sup><a href="#Norton1982" id='returnNorton1982'>[3]</a></sup> 提出了用于生成和显示三维分形的算法，并首次在迭代过程中引入了 <a href="https://en.wikipedia.org/wiki/Quaternion" target="_blank">四元数</a><sup><a href="#Kantor1982" id='returnKantor1982'>[4]</a></sup>。随后，对 <strong>四元数 Mandelbrot 集</strong><sup><a href="#BeddingBriggs1995">[5]</a></sup><sup><a href="#GomataDoyleStevesMcFarlane1995">[6]</a></sup> 的理论性质进行了研究，其定义基于二次多项式 \(q^2+c\)。
    </p>
    <figure>
        <img width="512" alt="Quaternion Julia Douady rabbit" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Quaternion_Julia_Douady_rabbit.jpg/512px-Quaternion_Julia_Douady_rabbit.jpg">
        <figcaption>
            四元数 Julia 集示例，在 XY 平面上的截面呈现出著名的“Douady 兔子”结构
        </figcaption>
    </figure>
    <p>
        2005 年，É. Martineau 与 D. Rochon<sup><a href="#MartineauRochon2005" id='returnMartineauRochon2005'>[7]</a></sup> 在 <a href="https://en.wikipedia.org/wiki/Bicomplex_number" target="_blank">双复数</a> 的框架下，给出了点 \(c\) 到双复数 Mandelbrot 集 \(\mathcal{M}_2^2\) 的距离上下界估计。
    </p>
    <p>
        利用 Green 函数可以得到距离的近似下界<sup><a href="#HartSandinKauffman1989" id='returnHartSandinKauffman1989'>[8]</a></sup>，并可用于对 Tetrabrot 进行 <a href="https://en.wikipedia.org/wiki/Ray_tracing_(graphics)" target="_blank">光线追踪</a> 渲染。
    </p>
    <figure>
        <img width="512" alt="Tetrabrot ray-traced" src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Tetrabrot_ray-traced.png/512px-Tetrabrot_ray-traced.png">
        <figcaption>
            通过光线追踪生成的 Tetrabrot 图像
        </figcaption>
    </figure>
</article>

<article>
    <h2>参考文献</h2>
    <ol>
        <li><a id='Rochon2000' href='#returnRochon2000'>^</a>D. Rochon, A Generalized Mandelbrot Set for Bicomplex Numbers, Fractals, 8(4):355–368, 2000.</li>
        <li><a id='RochonGarant2008' href='#returnRochonGarant2008'>^</a>V. Garant-Pelletier & D. Rochon, On a Generalized Fatou-Julia Theorem in Multicomplex Space, Fractals, 17(3):241–255, 2008.</li>
        <li><a id='Norton1982' href='#returnNorton1982'>^</a>A. Norton, Generation and Display of Geometric Fractals in 3-D, Computer Graphics, 16:61–67, 1982.</li>
        <li><a id='Kantor1982' href='#returnKantor1982'>^</a>I. L. Kantor, Hypercomplex Numbers, Springer-Verlag, New York, 1982.</li>
        <li><a id='BeddingBriggs1995'>^</a>S. Bedding & K. Briggs, Iteration of Quaternion Maps, Int. J. Bifur. Chaos, 5:877–881, 1995.</li>
        <li><a id='GomataDoyleStevesMcFarlane1995'>^</a>J. Gomatam et al., Generalization of the Mandelbrot Set: Quaternionic Quadratic Maps, Chaos, Solitons & Fractals, 5:971–985, 1995.</li>
        <li><a id='MartineauRochon2005' href='#returnMartineauRochon2005'>^</a>É. Martineau & D. Rochon, On a Bicomplex Distance Estimation for the Tetrabrot, Int. J. Bifurcation and Chaos, 15(6):501–521, 2005.</li>
        <li><a id='HartSandinKauffman1989' href='#returnHartSandinKauffman1989'>^</a>J. C. Hart et al., Ray Tracing Deterministic 3-D Fractals, Computer Graphics, 23:289–296, 1989.</li>
        <li><a id='BrouillettePariseRochon2019'>^</a>G. Brouillette, P.-O. Parisé & D. Rochon, Tricomplex Distance Estimation for Filled-in Julia Sets and Multibrot Sets, Int. J. Bifurcation and Chaos, 29(6), 2019.</li>
    </ol>
</article>

