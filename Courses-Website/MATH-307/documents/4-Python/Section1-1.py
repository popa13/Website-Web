import numpy
import sympy

from mpl_toolkits import mplot3d
import matplotlib.pyplot as plt


def interchangeEq(indexEq1, indexEq2, matrix):
    temp = matrix[indexEq2 - 1]
    matrix[indexEq2 - 1] = matrix[indexEq1]
    matrix[indexEq1 - 1] = temp


def multScalar(indexEq, k, matrix):
    matrix[indexEq - 1, :] = k * matrix[indexEq - 1, :]


def interchangeByCombination(indexEq1, indexEq2, k1, k2, matrix):
    eq1Mod = k1 * matrix[indexEq1 - 1, :]
    eq2Mod = k2 * matrix[indexEq2 - 1, :]
    matrix[indexEq1 - 1, :] = eq1Mod + eq2Mod


def printMatrix(arr):
    toPrint = ' '
    nbRows = arr.shape[0]
    nbCols = arr.shape[1]

    for i in numpy.arange(0, nbRows, 1):
        for j in numpy.arange(0, nbCols, 1):
            toPrint += str(arr[i, j]).zfill(3) + '  '
        if i < nbRows - 1:
            toPrint += '\n '
    print(toPrint)


stop = False
while not stop:

    #########################
    ##### Example 3:
    #########################
    print("________ Example 3 _________")
    printStep = int(input("Which step do you want to print? Enter a number?\nChoose between 1, 2, and 3.\n"))

    #### Step 1
    if printStep == 1:
        # Augmented matrix
        m = sympy.Matrix([[2, 3, -1, 3], [-1, -1, 3, 0], [1, 2, 2, 3], [0, 1, 5, 3]])

        # First operations to get rid of the x's
        print("___ Step 1 ___")
        print("L1 + 2L2 -> L2")
        interchangeByCombination(2, 1, 2, 1, m)
        print("L1 - 2L3 -> L3")
        interchangeByCombination(3, 1, -2, 1, m)
        printMatrix(m)

        ### Plot the planes obtained after this step
        x = numpy.linspace(-10, 10, 20)
        y = numpy.linspace(-10, 10, 20)
        ones = numpy.ones(100)
        xGrid, yGrid = numpy.meshgrid(y, x)
        onesGrid = numpy.meshgrid(ones, ones)
        # First plane
        plane1 = m.row(0)[3] / m.row(0)[2] - (m.row(0)[0] / m.row(0)[2]) * xGrid - (m.row(0)[1] / m.row(0)[2]) * yGrid

        # Second plane
        plane2 = m.row(1)[3] / m.row(1)[2] - (m.row(1)[0] / m.row(1)[2]) * xGrid - (m.row(1)[1] / m.row(1)[2]) * yGrid

        # Third Plane
        plane3 = m.row(2)[3] / m.row(2)[2] - (m.row(2)[0] / m.row(2)[2]) * xGrid - (m.row(2)[1] / m.row(2)[2]) * yGrid

        # Fourth Plane
        plane4 = m.row(3)[3] / m.row(3)[2] - (m.row(3)[0] / m.row(3)[2]) * xGrid - (m.row(3)[1] / m.row(3)[2]) * yGrid

        fig = plt.figure()
        ax = plt.axes(projection='3d')

        ax.plot_surface(xGrid, yGrid, plane1)
        ax.plot_surface(xGrid, yGrid, plane2)
        ax.plot_surface(xGrid, yGrid, plane3)
        ax.plot_surface(xGrid, yGrid, plane4)

        ax.set_xlim(-10, 10)
        ax.set_ylim(-10, 10)
        ax.set_zlim(-40, 40)

        plt.show()

    #######
    # Second operations to get rid of the y
    if printStep == 2:
        # Augmented matrix
        m = sympy.Matrix([[2, 3, -1, 3], [-1, -1, 3, 0], [1, 2, 2, 3], [0, 1, 5, 3]])

        # First operations to get rid of the x's
        interchangeByCombination(2, 1, 2, 1, m)
        interchangeByCombination(3, 1, -2, 1, m)

        print("___ Step 2 ___")
        print("3L2 - L1 -> L1")
        interchangeByCombination(1, 2, -1, 3, m)
        print("L2 + L3 -> L3")
        interchangeByCombination(3, 2, 1, 1, m)
        print("L2 - L4 -> L4")
        interchangeByCombination(4, 2, -1, 1, m)
        printMatrix(m)
        print("Notice the two lines of zeros!")

        ### Plot the planes obtained after this step
        x = numpy.linspace(-10, 10, 20)
        y = numpy.linspace(-10, 10, 20)
        ones = numpy.ones(100)
        xGrid, yGrid = numpy.meshgrid(y, x)
        onesGrid = numpy.meshgrid(ones, ones)
        # First plane
        plane1 = m.row(0)[3] / m.row(0)[2] - (m.row(0)[0] / m.row(0)[2]) * xGrid - (m.row(0)[1] / m.row(0)[2]) * yGrid

        # Second plane
        plane2 = m.row(1)[3] / m.row(1)[2] - (m.row(1)[0] / m.row(1)[2]) * xGrid - (m.row(1)[1] / m.row(1)[2]) * yGrid

        # Third Plane
        plane3 = m.row(2)[3] / m.row(2)[2] - (m.row(2)[0] / m.row(2)[2]) * xGrid - (m.row(2)[1] / m.row(2)[2]) * yGrid

        # Fourth Plane
        plane4 = m.row(3)[3] / m.row(3)[2] - (m.row(3)[0] / m.row(3)[2]) * xGrid - (m.row(3)[1] / m.row(3)[2]) * yGrid

        fig = plt.figure()
        ax = plt.axes(projection='3d')

        ax.plot_surface(xGrid, yGrid, plane1)
        ax.plot_surface(xGrid, yGrid, plane2)
        ax.plot_surface(xGrid, yGrid, plane3)
        ax.plot_surface(xGrid, yGrid, plane4)

        ax.set_xlim(-10, 10)
        ax.set_ylim(-10, 10)
        ax.set_zlim(-5, 5)

        plt.show()

    ##### Step 3
    # Third operations to obtain 1 on the diagonal
    if printStep == 3:
        # Augmented matrix
        m = sympy.Matrix([[2, 3, -1, 3], [-1, -1, 3, 0], [1, 2, 2, 3], [0, 1, 5, 3]])

        # First operations to get rid of the x's
        interchangeByCombination(2, 1, 2, 1, m)
        interchangeByCombination(3, 1, -2, 1, m)

        # Second operations to get rid of the y's
        interchangeByCombination(1, 2, -1, 3, m)
        interchangeByCombination(3, 2, 1, 1, m)
        interchangeByCombination(4, 2, -1, 1, m)

        print("___ Step 3 ___")
        print("(-1/2)L1 -> L1")
        multScalar(1, -0.5, m)
        printMatrix(m)

        ### Plot the planes obtained after this step
        x = numpy.linspace(-10, 10, 20)
        y = numpy.linspace(-10, 10, 20)
        ones = numpy.ones(100)
        xGrid, yGrid = numpy.meshgrid(y, x)
        onesGrid = numpy.meshgrid(ones, ones)
        # First plane
        plane1 = m.row(0)[3] / m.row(0)[2] - (m.row(0)[0] / m.row(0)[2]) * xGrid - (m.row(0)[1] / m.row(0)[2]) * yGrid

        # Second plane
        plane2 = m.row(1)[3] / m.row(1)[2] - (m.row(1)[0] / m.row(1)[2]) * xGrid - (m.row(1)[1] / m.row(1)[2]) * yGrid

        # Third Plane
        plane3 = m.row(2)[3] / m.row(2)[2] - (m.row(2)[0] / m.row(2)[2]) * xGrid - (m.row(2)[1] / m.row(2)[2]) * yGrid

        # Fourth Plane
        plane4 = m.row(3)[3] / m.row(3)[2] - (m.row(3)[0] / m.row(3)[2]) * xGrid - (m.row(3)[1] / m.row(3)[2]) * yGrid

        # Set of solutions
        z = numpy.linspace(-5, 5, 20)
        xsol = -3 + 8 * z
        ysol = 3 - 5 * z

        fig = plt.figure()
        ax = plt.axes(projection='3d')

        ax.plot_surface(xGrid, yGrid, plane1)
        ax.plot_surface(xGrid, yGrid, plane2)
        ax.plot_surface(xGrid, yGrid, plane3)
        ax.plot_surface(xGrid, yGrid, plane4)
        ax.plot(xsol, ysol, z, color='black')

        ax.set_xlim(-10, 10)
        ax.set_ylim(-10, 10)
        ax.set_zlim(-5, 5)

        plt.show()

    # Print the general solution
    printSol = int(input("Do you want to see the general solution? Enter 0 for yes and 1 for no.\n"))
    if printSol == 0:
        print("General solution:")
        print("""x - 8z = -3
        y + 5z = 3 """)
        print("""x = -3 + 8z
        y = 3 - 5z""")
        print("The variable z is a free parameter.")

        ##
        # plot the planes and the solutions
        m = sympy.Matrix([[2, 3, -1, 3], [-1, -1, 3, 0], [1, 2, 2, 3], [0, 1, 5, 3]])

        x = numpy.linspace(-10, 10, 20)
        y = numpy.linspace(-10, 10, 20)
        ones = numpy.ones(100)
        xGrid, yGrid = numpy.meshgrid(y, x)
        onesGrid = numpy.meshgrid(ones, ones)

        # First plane
        plane1 = m.row(0)[3] / m.row(0)[2] - (m.row(0)[0] / m.row(0)[2]) * xGrid - (m.row(0)[1] / m.row(0)[2]) * yGrid

        # Second plane
        plane2 = m.row(1)[3] / m.row(1)[2] - (m.row(1)[0] / m.row(1)[2]) * xGrid - (m.row(1)[1] / m.row(1)[2]) * yGrid

        # Third Plane
        plane3 = m.row(2)[3] / m.row(2)[2] - (m.row(2)[0] / m.row(2)[2]) * xGrid - (m.row(2)[1] / m.row(2)[2]) * yGrid

        # Fourth Plane
        plane4 = m.row(3)[3] / m.row(3)[2] - (m.row(3)[0] / m.row(3)[2]) * xGrid - (m.row(3)[1] / m.row(3)[2]) * yGrid

        # Set of solutions
        z = numpy.linspace(-5, 5, 20)
        xsol = -3 + 8 * z
        ysol = 3 - 5 * z

        # plot with matplotlib
        fig = plt.figure()
        ax = plt.axes(projection='3d')

        ax.plot_surface(xGrid, yGrid, plane1)
        ax.plot_surface(xGrid, yGrid, plane2)
        ax.plot_surface(xGrid, yGrid, plane3)
        ax.plot_surface(xGrid, yGrid, plane4)
        ax.plot3D(xsol, ysol, z, 'black')
        ax.set_xlim(-10, 10)
        ax.set_ylim(-10, 10)
        ax.set_zlim(-40, 20)

        plt.savefig("example3.png")
        plt.show()

    choice = input("Do you want to print other steps? Enter 'y' for yes and 'n' for no.\n")
    if choice == 'n':
        stop = True

print('End of the examples.')
