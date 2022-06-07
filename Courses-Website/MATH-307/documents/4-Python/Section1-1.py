import numpy as np


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


#########################
##### Example 3:
#########################
print("Example 3 with python: step-by-step")

# Augmented matrix
m = np.array([[2, 3, -1, 3], [-1, -1, 3, 0], [1, 2, 2, 3], [0, 1, 5, 3]])
print(m)

# First operations to get rid of the x's
print("L1 + 2L2 -> L2")
interchangeByCombination(2, 1, 2, 1, m)
print("L1 - 2L3 -> L3")
interchangeByCombination(3, 1, -2, 1, m)
print(m)

# Second operations to get rid of the y'
print("3L2 - L1 -> L1")
interchangeByCombination(1, 2, -1, 3, m)
print("L2 + L3 -> L3")
interchangeByCombination(3, 2, 1, 1, m)
print("L2 - L4 -> L4")
interchangeByCombination(4, 2, -1, 1, m)
print(m)
print("Notice the two lines of zeros!")

# Get the ones
print("(-1/2)L1 -> L1")
multScalar(1, -0.5, m)
print(m)

# Print the equations
print("General solution:")
print("""x - 8z = -3
y + 5z = 3 """)
print("""x = -3 + 8z
y = 3 - 5z""")
print("The variable z is a free parameter.")

# plot the planes and the solutions

