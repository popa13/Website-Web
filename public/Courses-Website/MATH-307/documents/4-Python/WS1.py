import numpy
import sympy


def printMatrix(arr):
    toPrint = ' '
    nbRows = arr.shape[0]
    nbCols = arr.shape[1]

    for i in numpy.arange(0, nbRows, 1):
        for j in numpy.arange(0, nbCols, 1):
            number = str(arr[i, j])
            if number[0] != '-':
                number = ' ' + number
            toPrint += number + '  '
        if i < nbRows - 1:
            toPrint += '\n '
    print(toPrint)


def interchangeEq(indexEq1, indexEq2, matrix):
    indexeq1 = indexEq1 - 1
    indexeq2 = indexEq2 - 1
    temp = matrix[indexeq2, :]
    matrix[indexeq2, :] = matrix[indexeq1, :]
    matrix[indexeq1, :] = temp


def multScalar(indexEq, k, matrix):
    matrix[indexEq - 1, :] = k * matrix[indexEq - 1, :]


def interchangeByCombination(indexEq1, indexEq2, k1, k2, matrix):
    eq1Mod = k1 * matrix[indexEq1 - 1, :]
    eq2Mod = k2 * matrix[indexEq2 - 1, :]
    matrix[indexEq1 - 1, :] = eq1Mod + eq2Mod


if __name__ == '__main__':
    stop = False
    while (not stop):
        printQuestion = input(
            "Which question do you want to do? Enter a number?\nChoose between 1, 2, 3, 4, 5, 6, 7, 8, 9, 10.\nEnter q to quit\n")

        ###### Question 1
        if printQuestion != 'q' and int(printQuestion) == 1:
            print('_____ Question 1 _____')
            print('a)')
            A = sympy.Matrix(2, 2, [2, 1, 1, -2])
            B = sympy.Matrix(2, 1, [0, 0])
            sol = A.inv() * B
            print("x = " + str(sol[0]) + ", y = " + str(sol[1]))

            print('b)')
            A = sympy.Matrix(2, 3, [2, 1, 1, -4, -2, -2])
            rrefA = A.rref()[0]
            printMatrix(rrefA)

            print('c)')
            A = sympy.Matrix(2, 3, [2, 1, 1, 1, -3, -2])
            rrefA = A.rref()[0]
            printMatrix(rrefA)

            print('d)')
            A = sympy.Matrix(3, 3, [1, 3, -4, 2, -1, 7, 1, -1, 5])
            rrefA = A.rref()[0]
            printMatrix(rrefA)

            print('e)')
            A = sympy.Matrix(3, 3, [1, 3, 6, 2, -1, -2, 1, -4, -8])
            rrefA = A.rref()[0]
            printMatrix(rrefA)

            print('f)')
            A = sympy.Matrix(2, 4, [1, 3, 1, -4, 2, -1, -1, 3])
            rrefA = A.rref()[0]
            printMatrix(rrefA)

            print('---------------------------------')

        ###### Question 2
        if printQuestion != 'q' and int(printQuestion) == 2:
            print('_____ Question 2 _____')
            A = sympy.Matrix(3, 3, [0, 1, 2, 2, 0, 1, 1, 2, 0])
            B = sympy.Matrix(3, 3, [2, -1, 4, 5, -4, -4, -2, 2, 5])
            print("det(A) = " + str(A.det()) + ', det(B) = ' + str(B.det()))
            AB = A * B
            print('det(AB) = ' + str(AB.det()))
            if A.det() * B.det() == AB.det():
                print('Answer: the equation det(AB) = det(A)det(B) is true')

            print('---------------------------------')


        ###### Question 3
        if printQuestion != 'q' and int(printQuestion) == 3:
            print('_____ Question 3 _____')
            a, b, c, d, e, f = sympy.symbols('a11 a12 a13 a22 a23 a33')
            x, y, z, u, v, w = sympy.symbols('b11 b12 b13 b22 b23 b33')
            A = sympy.Matrix(3, 3, [a, b, c, 0, d, e, 0, 0, f])
            print("A = ")
            printMatrix(A)
            print('B = ')
            B = sympy.Matrix(3, 3, [x, y, z, 0, u, v, 0, 0, w])
            printMatrix(B)

            print('a)')
            print('AB = ')
            printMatrix(A * B)
            print('We see that it is an upper triangular matrix')

            print('b)')
            print('A^tA = ')
            printMatrix(A.transpose() * A)
            print('(A^t A)^t = ')
            printMatrix((A.transpose() * A).transpose())
            print('We see that (A^t A)^t = A^t A. So A^t A is symmetric.')

            print('---------------------------------')

        ###### Question 4
        if printQuestion != 'q' and int(printQuestion) == 4:
            print('_____ Question 4 _____')
            print("Answer: No, the matrix multiplication won't be defined")

            print('---------------------------------')

        ###### Question 5
        if printQuestion != 'q' and int(printQuestion) == 5:
            print('_____ Question 5 _____')
            A = sympy.Matrix(3, 3, [0, 1, 2, 2, 0, 1, 1, 2, 0])
            B = sympy.Matrix(3, 1, [-1, 15, 1])

            print('Matrix of coefficients A is')
            printMatrix(A)
            print('Column vector of constants B is')
            printMatrix(B)

            print('Value of x')
            A1 = sympy.Matrix(3, 3, [-1, 1, 2, 15, 0, 1, 1, 2, 0])
            print('A1 = ')
            printMatrix(A1)
            print("x = " + str(A1.det() / A.det()))

            print("Value of y")
            A2 = sympy.Matrix(3, 3, [0, -1, 2, 2, 15, 1, 1, 1, 0])
            print('A2 = ')
            printMatrix(A2)
            print('y = ' + str(A2.det() / A.det()))

            print('Value of z')
            A3 = sympy.Matrix(3, 3, [0, 1, -1, 2, 0, 15, 1, 2,1 ])
            print('A3 = ')
            printMatrix(A3)
            print('z = ' + str(A3.det() / A.det()))

            print('---------------------------------')

        ###### Question 6
        if printQuestion != 'q' and int(printQuestion) == 6:
            print('_____ Question 6 _____')
            A = sympy.Matrix(3, 4, [1, 1, 1, -3, 2, 1, 1, -4, 1, -4, 1, 2])
            print("Augmented Matrix of the sytem is:")
            printMatrix(A)

            print('Step 1)')
            print('2L1 - L2 -> L2')
            print('L1 - L3 -> L3')
            E = sympy.Matrix(3, 3, [1, 0, 0, 2, -1, 0, 1, 0, -1])
            A = E * A
            printMatrix(A)

            print('Step 2)')
            print('L3 - 5L2 -> L3')
            E = sympy.Matrix(3, 3, [1, 0, 0, 0, 1, 0, 0, -5, 1])
            A = E * A
            printMatrix(A)

            print("Step 3)")
            print("(-1/5)L3 -> L3")
            A[2, 3] = -1
            A[2, 2] = 1
            printMatrix(A)

            print('Solutions:')
            print('z = -1')
            print('y = -2 - z = -2 + 1 = -1')
            print('x = -3 - y - z = -3 + 1 + 1 = -1.')

            print('---------------------------------')

        ##### Question 7
        if printQuestion != 'q' and int(printQuestion) == 7:
            print('_____ Question 7 _____')
            A = sympy.Matrix(3, 4, [1, 0, 0, -3, 2, 1, 0, 0, 1, -4, 1, -24])
            print("Augmented Matrix is:")
            printMatrix(A)

            print('Step 1)')
            print('2L1 - L2 -> L2')
            print('L1 - L3 -> L3')
            E = sympy.Matrix(3, 3, [1, 0, 0, 2, -1, 0, 1, 0, -1])
            A = E * A
            printMatrix(A)

            print('Step 2)')
            print('4L2 + L3 -> L3')
            E = sympy.Matrix(3, 3, [1, 0, 0, 0, 1, 0, 0, 4, 1])
            A = E * A
            printMatrix(A)

            print('Step 3)')
            print('-L2 -> L2')
            print('-L3 -> L3')
            E = sympy.Matrix(3, 3, [1, 0, 0, 0, -1, 0, 0, 0, -1])
            A = E * A
            printMatrix(A)

            print('Solutions:')
            print('x = -3, y = 6, z = 3.')

            print('---------------------------------')

        ##### Question 8
        if printQuestion != 'q' and int(printQuestion) == 8:
            print('_____ Question 8 _____')
            A = sympy.Matrix(3, 3, [3, 2, 5, 1, 2, 0, -2, -1, 1])
            AI = sympy.Matrix(3, 6, [3, 2, 5, 1, 0, 0, 1, 2, 0, 0, 1, 0, -2, -1, 1, 0, 0, 1])
            print('Augmented Matrix [A|I]:')
            printMatrix(AI)

            print("Step 1)")
            print('L1 - 3L2 -> L2')
            print('2L1 + 3L3 -> L3')
            E = sympy.Matrix(3, 3, [1, 0, 0, 1, -3, 0, 2, 0, 3])
            AI = E * AI
            printMatrix(AI)

            print('Step 2)')
            print('2L1 + L2 -> L1')
            print('L2 + 4L3 -> L3')
            E = sympy.Matrix(3, 3, [2, 1, 0, 0, 1, 0, 0, 1, 4])
            AI = E * AI
            printMatrix(AI)

            print('Step 3)')
            print('57L1 - 15L3 -> L1')
            print('57L2 - 5L3 -> L2')
            E = sympy.Matrix(3, 3, [57, 0, -15, 0, 57, -5, 0, 0, 1])
            AI = E * AI
            printMatrix(AI)

            print('Step 4)')
            print('(1/342)L1 -> L1')
            print('(-1/228)L2 -> L2')
            print('(-1/57)L3 -> L3')
            E = sympy.Matrix(3, 3, [sympy.Rational(1, 342), 0, 0, 0, sympy.Rational(-1, 228), 0, 0, 0, sympy.Rational(1, 57)])
            AI = E * AI
            printMatrix(AI)

            print('Answer:')
            print('A^{-1} =')
            printMatrix(AI[:, 3:])

            print('---------------------------------')

        ##### Question 9
        if printQuestion != 'q' and int(printQuestion) == 9:
            print('_____ Question 9 _____')
            print('A)')
            a, b, c, d = sympy.symbols('a b c d')
            A = sympy.Matrix(2, 2, [a, b, c, d])
            print('In the following, a corresponds to alpha, b to beta, c to gamma, and d to delta.')
            print("Matrix of cofactors C:")
            C = A.cofactor_matrix()
            printMatrix(C)
            print('Find the adjoint by taking the transpose of C:')
            adjA = C.transpose()
            printMatrix(adjA)
            print('The inverse of A is adj(A)/det(A):')
            Ainv = (1 / A.det()) * adjA
            printMatrix(Ainv)

            print('B)')
            B = sympy.Matrix(3, 3, [0, 1, 2, 2, 0, 1, 1, 2, 0])
            print("Matrix of cofactors C:")
            C = B.cofactor_matrix()
            printMatrix(C)
            print('Find the adjoint by taking the transpose of C:')
            adjB = C.transpose()
            printMatrix(adjB)
            print('The inverse of B is adj(B)/det(B):')
            Binv = sympy.Rational(1, B.det()) * adjB
            printMatrix(Binv)

            print('---------------------------------')

        ##### Question 9
        if printQuestion != 'q' and int(printQuestion) == 10:
            print('_____ Question 10 _____')
            print('The matrix of coefficients is:')
            A = sympy.Matrix(3, 3, [2, -1, 4, 5, -4, -4, -2, 2, 5])
            printMatrix(A)

            print('The vector B of constants is:')
            B = sympy.Matrix(3, 1, [sympy.Rational(15, 2), sympy.Rational(-23, 2), 12])
            printMatrix(B)

            print('The inverse of A should be (you use the technique you want to compute the inverse):')
            Ainv = A.inv()
            printMatrix(Ainv)

            print('The solution is then X = Ainv * B:')
            print('X = ')
            printMatrix(Ainv * B)

            print('---------------------------------')

        if printQuestion == 'q':
            stop = True