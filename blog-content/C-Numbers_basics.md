---
title: The Origins of Complex numbers
titleAbrv: C-numbers Origin
author: Pierre-Olivier Parisé
date: 2020-06-15
tags: Real numbers, Origins, Polynomial equations, Complex number
thumbnail:
summary: A complex number is not far from mortal's reach. If someone knows the basic rules of ordinary numbers, complex numbers' mechanism won't be a difficulty. There are used in many context and offer new tools to solve many equations. however, where do they come from?
slug: C-Numbers_Origins
level: beginner mathematicians
subject: history-Maths
---

A complex number is not far from mortal's reach. If someone knows the basic rules of ordinary numbers (called **real numbers**), complex numbers' mechanism won't be a difficulty. However, why were complex numbers invented and what purpose do they serve? To answer this question, let us study a bit of the basic properties of the real numbers and find where their usefulness is no longer useful.

## Real numbers

Usually, addition and multiplication of numbers are tought at a pretty young age. \\(1 + 1\\) or \\(2 \times 3\\) are familiar questions that everybody should have had answered one time in his childhood. However, there are hidden rules that seem to have been accepted without mention! The first of these rules are commutativity, associativity and inversibility.

**Commutativity** means that you can inverse the order of the operations and it won't affect the result. For example, for multiplication, the following equalities hold

<div class=equation markdown="1">
$$
	2 \times 3 = 6 = 3 \times 2.
$$
</div>

In general, given two real numbers \\(x \\) and \\(y \\), the result of \\(x \times y\\) is always the same as the result of \\(y \times x\\). The same thing is true for addition (try it yourself!)

**Associativity** means that the order in which the operations are done doesn't affect the result. There is a general rule to know which operations to do before another one. Like reading, an equation is read from the left to the right, and when an operation symbol (addition or multiplication) is crossed, you operate. For example, given the following equation

$$
	2 + 3 + 4 + 10,
$$

the operation \\(2 + 3\\) is done first which gives \\(5\\). Then, this is followed by \\(5 + 4\\) which gives you \\(9\\) and finally, computing \\(9 + 10\\) gives you the final answer of \\(19\\). Usually, when an order of the operations is wanted, parentheses are used to specify this order. For example, with the last equation, the order just used to compute the result was:

$$
	(((2 + 3) + 4) + 10).
$$

\\(2 + 3\\) is grouped together with a pair of parentheses (one opened and the other closed). The operation is executed if an open parenthesis is followed by a closed parenthesis. The number of open parentheses is keeping in track. When the operation is finished, the open and closed parenthesis are crushed and the latest open parenthesis is now taken into account. Therefore, the associativity is simply saying that you can put the parenthesis anywhere and the result won't be affected.

**Invertibility for addition** means that, given any real number \\(x\\), a number \\(y\\) can be found so that

<div class="importantEquation" markdown="1">
	\begin{equation}
	x + y = 0.
	\end{equation}
</div>
The real number \\(y\\) with this property is called the _opposite_ of \\(x\\). As an example, if \\(x = 2\\), then the opposite of \\(x\\) is \\(y = -2\\).

**Invertibility for multiplication** means that, given a real number say \\(x\\), there exists a real number, say \\(y\\), such that

<div class="importantEquation" markdown="1">
\begin{equation}
	x \times y = 1.
\end{equation}
</div>
The number \\(y\\) is usually called the _inverse_ of \\(x\\) and is denoted by \\(x^{-1}\\). For example, if \\(x = 2\\), then which real number \\(y\\) will play the role of the inverse of \\(2\\)? This \\(y\\) is \\(\tfrac{1}{2}\\). Up to this point, have you noticed something wrong with the notion of an inverse of a real number? There is one element that causes trouble! It is zero. Indeed, multiplying any real number by \\(0\\) gives zero as a result. It can't give you \\(1\\). Contrary to the addition operation, this case must be avoided and the invertibility property for the multiplication operation must be read as "[...] given a real number, not zero, [...]".

The last important and useful property of the addition and multiplication operations is the **distributivity** of the multiplication over the addition. Let's explain this important property with an example. Suppose that the following equation is given

$$
	3 \times (4 + 5).
$$

The natural way to compute the result would be to, first, add \\(4\\) and \\(5\\) and then multiply the result by 3. However, distributivity tells another story. It is possible, instead, to, first compute 3 \times 4, then compute 3 \* 5, and add those two last results. Moreover, the result will be the same as if you do it in the "natural way". In general, with variables representing any real numbers, the distributivity property is written as

<div class="importantEquation" markdown="1">
\begin{equation}	x \times (y + z) = x \times y + x \times z.\end{equation}
</div>
The reader, now, may ask a legitimate question: does this property hold if addition and multplication are interchanged? The answer is no and try some examples to convince yourself of that truth.

These properties of real numbers are all that is needed to do computation in day to day life. For example, when an accountant does your taxes, everything he uses is stated in the above text! However, when you go deepper and deeper in science, you need more properties (and consequently, more tools) than the ones mentioned above. One of these, for example, is the possibility of solving a _polynomial equation_.

## Polynomial equations

<!-- do you need a 0 on the right hand side? can't it be any number? -->

A polynomial equation is an equation where, on the left side of the equality, you have a formula composed of sums of constant terms times a variable (which encodes a real number) raised to certain powers and, on the right side, you have a \\(0\\). So, an example of a polynomial equation is
\begin{equation}
x^2 - 1 = 0
\end{equation}
where \\(x\\) stands for the variable, but any choice of letter would do the job (it is a dummy variable). The main goal, when giving such an equation, is to find its solutions. For example, if \\(x = 1\\) in the above polynomial equation, then
\begin{equation}
1^2 - 1 = 1 - 1 = 0
\end{equation}
and this specific \\(x\\) satisfies the polynomial equation. But, there are other solutions to this polynomial equation and the goal is to find them all! Can you guess what are the other solutions? The solutions of the polynomial equation \\(x^2 - 1 = 0\\) are \\(x = 1\\) and \\(x = -1\\). As we can see, there are two solutions to the equation \\(x^2 - 1\\) and there are all all ordinary numbers (real numbers).

<!-- not sure what ...all all.. means -->

<!-- the first fact? I feel like you're missing an introduction to this paragraph,-->

The first fact is exactly related to what is called the _degree_ of a polynomial equation:

 <div class="Definition" markdown="1">
The degree of a polynomial equation is the highest power to which a variable is raised.
 </div>

For example, the degree of the polynomial \\(x^2 - 1\\) is two, since the variable \\(x\\) is raised to the power \\(2\\) and it's the highest order. As an expected property, the number of solutions to a polynomial equation is the same as its degree, as is the case for the equation \\(x^2 - 1\\). Also, when the solutions of a polynomial equation are all real, the polynomial equations is said to have _real solutions_. The polynomial equation \\(x^2 - 1\\) also has real solutions. Now, a question naturally pops up: Does every polynomial equation of degree \\(n\\) has exactly \\(n\\) real solution? Try to convince yourself by considering some examples of polynomial equations and try to find their solutions. It is also possible to use <a href="https://www.wolframalpha.com/" target="_blank" class="aLink">WorlframAlpha</a> to compute the solutions of a polynomial equations. Just write the equation in the searching engine and press enter. WorlframAlpha will show you a bunch of properties and, in particular, its solutions to the polynomial equation.

After some experimentation, you're maybe convinced that... There are polynomial equation that has no solution at all! In fact, that has no real solutions. Such an example is the polynomial equation

$$
	x^2 + 1 = 0.
$$

If you subtract 1 from each side, you get the following equation

$$
	x^2 = -1.
$$

Now, let's think about this last equation. Which real number \\(x\\), multiplied by himself, gives you a negative number? Try some by yourself to see that _no_ real number has this property!! So, the polynomial equation just mentioned doesn't have any real solutions. Is all of mathematics destroyed because of that? Luckily, no. Mathematicians of the \\(16^{\text{th}}\\) century came up with new tools to get around this obstacle: the complex numbers!

## Complex numbers

Mathematicians like Rafael Bombelli (1526-1576) had the crazy idea to introduce new quantities that solve equations like \\(x^2 + 1= 0\\). He introduced the _square root of negative one_, denoted as \\(\sqrt{-1}\\) at that time. There is also the solution \\(x=-\sqrt{-1}\\) to the equation \\(x^2 + 1 = 0\\) This gives you the missing solutions to this polynomial equation.

Bombelli was the first to dare to use publicly such quantities as \\(\sqrt{-1}\\)! Is it possible to do actual computations with these new quantities, and what are the rules to combine them? In his _Algebra_, published in 1572, Bombelli defined the rules by which to manipulate these new quantities and how to mix them with the real numbers. Then, he introduced some notation to avoid confusion in the manipulations of the new quatities. Indeed, if the reader is familiar with the properties of the square-root, he may fall into the following trap when trying to multiply \\(\sqrt{-1}\\) with itself:

<DIV class="equation" markdown="1">
$$
	\sqrt{-1} \times \sqrt{-1} = \sqrt{(-1) \times (-1)} = \sqrt{1} = 1.
$$
</DIV>

This contradicts the profound reason of introducing the quantity \\(\sqrt{-1}\\)! According to its definition, \\(\sqrt{-1}\\) multiplied by itself must equal \\(-1\\) (it is the solution of the polynomial equation \\(x^2 + 1\\).). Here is the notation introduced by Bombelli:

<DIV class="Definition" markdown="1">
_più_ stands for \\(+1\\), _meno_ stands for \\(-1\\), _più di meno_ stands for \\(\sqrt{-1}\\) and _meno di meno_ stands for \\(-\sqrt{-1}\\).
</DIV>

Then, he gives the rules to manipulate these quantities, in a form of a poem:

> Più via più di meno, fà più di meno.
> Meno via più di meno, fà meno di meno.
> Più via meno di meno, fà meno di meno.
> Meno via meno di meno, fà più di meno.
> Più di meno via più di meno, fà meno.
> Più di meno via meno di meno, fà più.
> Meno di meno via più di meno, fà più.
> Meno di meno via meno di meno, fà meno.

This poem translates, less poetically, as follows:

<DIV class = "importantEquation" markdown="1">
$$
	+1 \times \sqrt{-1} = \sqrt{-1}.
	-1 \times \sqrt{-1} = -\sqrt{-1}. 
	+1 \times -\sqrt{-1} = -\sqrt{-1}.
	-1 \times -\sqrt{-1} = \sqrt{-1}.
$$
$$
	\sqrt{-1} \times \sqrt{-1} = -1.
	\sqrt{-1} \times -\sqrt{-1} = 1. 
	-\sqrt{-1} \times \sqrt{-1} = 1. 
	-\sqrt{-1} \times -\sqrt{-1} = -1.
$$
</DIV>

<!-- The last string of mathematics? Not sure what that means -->

This last poem, which is beautiful by the way, and the last string of mathematics are just unpleasant, for the eyes and for computations. This is why, in the early \\(18^{\text{th}}\\) century, one of the most prolific mathematicians of the all time, Leonhard Euler (1707-1783), invented the symbol \\(i\\) to denote the square root of \\(-1\\). From this point on, mathematicians began to denote expressions like \\(a + bi\\) for the new quantities introduced by Bombelli. These new expressions also mark the starting point of the _complex numbers_, as we know them today.

## Conclusion

Complex numbers are not just something that comes up from nowhere and that we have to learn at university because it is a part of mathematics. These numbers have their own history and they have been discovered in a very specific situation and to serve a very specific purposes. In another post, the basic rules to manipulate the complex numbers will be presented and their geometry will be explained. _Eh ben oui_ as we say in Quebec, complex numbers have a strong relationship with geometry! Until then, see you!

## References

- Les nombres complexes, Quand algèbre, analyse et géométrie se rejoignent, Bibliothèque Tangente, Éditions POLE, Hors série no. 63, 2018.
