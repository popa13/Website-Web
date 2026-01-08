import sympy
from matplotlib.pyplot import cm
import matplotlib.pyplot as plt
import numpy as np

quit = False

if __name__ == '__main__':

    while (not quit):
        choiceExample = input('Which example to you want? \nEnter q to quit.\n')

        ###############
        ## Example 1 ##
        if choiceExample != 'q' and choiceExample != 'fig' and int(choiceExample) == 1:
            #############
            ### Example from the lecture notes, with a 3 x 3 grids of points
            m = 3
            a, b = 0, 3.0
            lX = b - a
            n = 3
            c, d = 0, 3.0
            lY = d - c
            ## Values of x (x0, x1, x2, ..., xn)
            x = np.arange(a, b, lX / m)
            ## Values of y (y0, y1, y2, ..., yn)
            y = np.arange(c, d, lY / n)
            ## Creating the grid (rectangle R)
            X, Y = np.meshgrid(x, y)
            ## We usually decompose y' = f(x, y(x)) as
            ##   dy = f(x, y(x)) and dx = 1.
            plt.xlim(-1, 8)
            plt.ylim(-1, 8)

            #### Figure 1.3.2
            dY = 1 + X * Y ** 2
            dX = np.ones(dY.shape)
            dYN = dY / (np.sqrt(dX ** 2 + dY ** 2))  # Normalization
            dXN = dX / (np.sqrt(dX ** 2 + dY ** 2))  # Normalization
            plt.quiver(X, Y, dX, dY)

            plt.show()

        ###########################################
        ## Example 1: More points and normalized ##
        if choiceExample != 'q' and choiceExample != 'fig' and int(choiceExample) == 2:
            #######
            m = 25 ## number of points for x
            a, b = 0, 2.0 ## Lower and upper bounds of your interval
            lX = b - a  ## length of your interval
            n = 25  ## number of points for y
            c, d = 0, 2.0  ## lower and upper bounds of your interval in y
            lY = d - c  ## length of your interval in y
            ## Values of x (x0, x1, x2, ..., xn)
            x = np.arange(a, b + lX/m, lX / m)
            ## Values of y (y0, y1, y2, ..., yn)
            y = np.arange(c, d + lY/n, lY / n)
            ## Creating the grid (rectangle R)
            X, Y = np.meshgrid(x, y)
            plt.xlim(0,2) # Fit the limits
            plt.ylim(0,2) # Fit the limits

            #### Example from the lecture notes
            ## We usually decompose y' = f(x, y(x)) as
            ##   dy = f(x, y(x)) and dx = 1.
            dY = 1 + X * Y ** 2
            dX = np.ones(dY.shape)
            dYN = dY / (np.sqrt(dX ** 2 + dY ** 2))  # Normalization
            dXN = dX / (np.sqrt(dX ** 2 + dY ** 2))  # Normalization
            plt.quiver(X, Y, dXN, dYN)

            plt.show()

        ######################
        ## If wants to quit ##
        if choiceExample == 'q':
            quit = True
