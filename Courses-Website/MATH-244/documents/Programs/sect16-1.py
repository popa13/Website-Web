#!/usr/bin/python3.6
# -*coding:utf-8 -*

import numpy as np 
import matplotlib.pyplot as plt

############################################
############################################
#
#   Section 16.1 examples: Vector Fields
#
############################################

# Example 1
#x, y = np.meshgrid(np.linspace(-5, 5, 15), np.linspace(-5,5, 15))

#P = -y
#Q = x
#plt.quiver(x, y, P, Q)

#plt.show()

#------------------------------------------------------------------------------------
# Example 2
"""
x, y, z = np.meshgrid(np.linspace(0, 3, 5), np.linspace(0,3, 5), np.linspace(-2,2, 5))

P = x-x
Q = x-x
R = z

fig = plt.figure()
ax = fig.gca(projection='3d')
ax.quiver(x, y, z, P, Q, R, color = 'black', length=0.5) #length=0.1
plt.show()
"""

#-----------------------------------------------------------------------------------
# Newton's Law of Grativation
"""
m = 1
M = 2
G = 1

x, y, z = np.meshgrid(np.linspace(-5,5, 5), np.linspace(-5,5, 5), np.linspace(-5,5, 5))

P = -m*M*G*x/np.sqrt(x**2+y**2+z**2)
Q = -m*M*G*y/np.sqrt(x**2+y**2+z**2)
R = -m*M*G*z/np.sqrt(x**2+y**2+z**2)

fig = plt.figure()
ax = fig.gca(projection='3d')
ax.quiver(x, y, z, P, Q, R, color = 'black') #length=0.1"
plt.show()
"""

#--------------------------------------------------------------------------------
# Example 6: Gradient vector field

feature_x = np.arange(-5.0,5.0, .05,)
feature_y = np.arange(-5.0,5.0, .05,)

x, y = np.meshgrid(feature_x, feature_y)
z = x**2*y - y**3
fig, ax = plt.subplots(constrained_layout=True)
ax.set_aspect(1)
#ax.plot(feature_x, feature_y, c = 'k')
CS = ax.contourf(x, y, z, 20, cmap='jet')
CS2 = ax.contour(x, y, z, 15, c='b')

cbar = fig.colorbar(CS)
#cbar.add_lines(CS2)

feature_x = np.linspace(-5,5, 15)
feature_y = np.linspace(-5,5, 15)

x, y = np.meshgrid(feature_x, feature_y)
P = 2*x*y 
Q = x**2 - 3*y**2
norm = np.linalg.norm(np.array((P, Q)), axis = 0)
P = P/(4*norm)
Q = Q/(4*norm)
ax.quiver(x, y, P, Q, units='xy', scale=0.5, color='black')#units='xy',

plt.show()


