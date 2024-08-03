#!/usr/bin/python3.6
# -*coding:utf-8 -*

import sympy
import math
import numpy

import matplotlib.pyplot as plt

#Example 2
def fct(x):
	return x**3 - 6*x

#Example 5
def fctEx5(x):
	return 1/x

def approxAreaR(a, b, n):
	dx = (b-a)/n
	Somme = 0
	for i in numpy.linspace(1,n, n):
		Somme = Somme + dx*fct(a+i*dx)
	return Somme

def approxAreaL(a, b, n):
	dx = (b-a)/n
	Somme = 0
	for i in numpy.linspace(1, n, n):
		Somme = Somme + dx*fct(a+(i-1)*dx)
	return Somme

def approxAreaM(a, b, n):
	dx = (b-a)/n 
	Somme = 0
	for i in numpy.linspace(1, n, n):
		Somme = Somme + dx*fctEx5(a+(i - 1.0/2)*dx)
	return Somme


print(approxAreaM(1, 2, 10000))
print(math.log(2))