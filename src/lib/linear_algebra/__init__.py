import math, random


def makeRandomMatrix(row, column, exclusion_list=[]):
    '''
    Return a matrix with the given number of rows and columns, and randomly-generated, unique values.
    The values will be surrounded around 0, going equally in the positive and negative direction.
    '''

    # Find a range of values that are sufficient for the size of the matrix to have unique values.
    number_of_matrix_elements = row * column
    numeric_bound = int(math.ceil(number_of_matrix_elements / 2))
    numeric_max = max(9, numeric_bound)
    numeric_min = -1 * numeric_max

    # Build a list of values in that range.
    numeric_list = range(numeric_min, numeric_max + 1)

    # Remove excluded numerics.
    numeric_list = [ numeric for numeric in numeric_list if numeric not in exclusion_list ]

    # Refill the numeric list with numbers outside the numeric bounds.
    should_include_max = True
    numeric_to_include = None
    while len(numeric_list) < (number_of_matrix_elements * 1.5):

        # Toggle between including the max and min numeric.
        if should_include_max:
            numeric_max = numeric_max + 1
            numeric_to_include = numeric_max
        else:
            numeric_min = numeric_min - 1
            numeric_to_include = numeric_min
        should_include_max = not should_include_max

        if numeric_to_include not in exclusion_list:
            numeric_list.append(numeric_to_include)

    # Shuffle the values to randomize position.
    random.shuffle(numeric_list)

    # Build matrix from the shuffled values.
    return [[numeric_list.pop() for i in range(column)] for j in range (row)]


def dot_product(x_vector, y_vector):
    '''
    Calculates the dot product of x_vector and y_vector.
    Raises IndexError if x_vector and y_vector do not have the same dimensions.
    '''
    x_length = len(x_vector)
    if x_length != len(y_vector):
        raise IndexError('Vectors in dot product must have same dimensions')
    return sum([x_vector[i] * y_vector[i] for i in range(x_length)])


def latexMatrix(matrix):
    '''Return a string of LaTex that prints the given matrix.'''
    numRows = len(matrix)
    numCols = len(matrix[0])

    latexOutput = ''
    for i in range(numRows):
        latexOutput += str(matrix[i][0])
        for j in range(1, numCols):
            latexOutput += ' & %s' % matrix[i][j]
        latexOutput += ' \\\\ '
    return '\\begin{bmatrix} %s \\end{bmatrix}' % latexOutput


def create_identity_matrix(n):
    '''
    Generates an n by n identity matrix. Ex: If n is 3, return:
    [
        [ 1, 0, 0 ],
        [ 0, 1, 0 ],
        [ 0, 0, 1 ],
    ]
    '''
    return [ [ 1 if i == j else 0 for i in range(n) ] for j in range(n) ]


def create_swap_elementary_matrix(n, row1 = None, row2 = None):
    '''
    Generates an n by n elementary matrix that randomly swaps two rows when left-multiplied to another matrix with n columns.

    Arguments:
    row1, row2: (optional) rows (1-indexed) to swap. If omitted, rows are selected randomly.
    '''
    elementary_matrix = create_identity_matrix(n)

    if row1 is None:
        row1 = pickFromRange(1, n, [ row2 ])

    if row2 is None:
        row2 = pickFromRange(1, n, [ row1 ])

    elementary_matrix[row1 - 1], elementary_matrix[row2 - 1] = elementary_matrix[row2 - 1], elementary_matrix[row1 - 1]

    return elementary_matrix


def create_scale_elementary_matrix(n, row = None, factor = None):
    '''
    Generates an n by n elementary matrix that scales a random row by a random integer
    when left-multiplied to another matrix with n columns.

    Arguments:
    row: (optional) row (1-indexed) to scale. If omitted, a random row is selected.
    factor: (optional) factor by which to scale row. If omitted, a random factor is selected.
    '''
    elementary_matrix = create_identity_matrix(n)

    if row is None:
        row = pickFromRange(1, n)

    if factor is None:
        factor = pickFromRange(-5, 5, [ -1, 0, 1 ])

    elementary_matrix[row - 1] = [ factor * i for i in elementary_matrix[row - 1] ]

    return elementary_matrix


def create_add_elementary_matrix(n, factor = None, from_row = None, to_row = None):
    '''
    Generates an n by n elementary matrix E, replacing E[i][j] with factor, where i is to_row - 1 and j is from_row - 1.

    An error is raised when to_row and from_row are the same value.

    Arguments:
    factor: (optional) multiple of row to add. If omitted, a random factor is selected.
    from_row: (optional) the row (1-indexed) to add. This row is scaled by the factor argument above and does not change.
    to_row: (optional) the row (1-indexed) to be added. This row is changed by the operation.
    '''
    elementary_matrix = create_identity_matrix(n)

    if factor is None:
        factor = pickFromRange(-5, 5, [ 0 ])

    if from_row is None:
        from_row = pickFromRange(1, n, [ to_row ])

    if to_row is None:
        to_row = pickFromRange(1, n, [ from_row ])

    if to_row == from_row:
        raise ValueError('from_row and to_row must be different')

    elementary_matrix[to_row - 1][from_row - 1] = factor

    return elementary_matrix


def multiply_matrix(left_matrix, right_matrix):
    '''
    Multiplies two matrices left_matrix and right_matrix.
    Raises IndexError if the number of cols of left_matrix is unequal to the number of rows of right_matrix.
    '''
    if len(left_matrix[0]) != len(right_matrix):
        raise IndexError('Number of columns in A must equal number of rows in B')

    number_of_columns = len(right_matrix[0])
    number_of_rows = len(left_matrix)

    # Matrix of 0s with size of the product matrix.
    product_matrix = [ [ 0 for i in range(number_of_columns) ] for j in range(number_of_rows) ]

    # Compute the product.
    for i in range(number_of_rows):
        for j in range(number_of_columns):
            for k in range(len(right_matrix)):
                product_matrix[i][j] += left_matrix[i][k] * right_matrix[k][j]

    return product_matrix


def generate_equations_from_matrix(matrix):
    '''
    Generates the equation form of a matrix in LaTeX.
    The right number of variables x_1, x_2, x_3, ... are used depending on matrix size.
    Zero coefficients prevent the corresponding variable term from appearing.
    Ex: the matrix [[1, 2, 3], [-1, -2, -3], [0, 1, 2], [1, 0, 2], [0, 0, 0]] is rendered as
        x_1 + 2x_2 = 3
        -x_1 - 2x_2 = -3
        x_2 = 2
        x_1 = 2
        0 = 0
    More info: https://www.khanacademy.org/math/precalculus/precalc-matrices/representing-systems-with-matrices/a/representing-systems-with-matrices
    '''
    number_of_equations = len(matrix)
    number_of_variables = len(matrix[0]) - 1

    latex_output = '\\begin{align}'
    for i in range(number_of_equations):

        '''
        Special case:
        If the coefficients of all variables is 0, then 0 should go in the left hand side of the equation.
        Then add =, the constant term, then skip to the next equation.
        '''
        if all([j == 0 for j in matrix[i][:-1]]):
            latex_output += '0 &= %d \\\\ ' % matrix[i][-1]
            continue

        # |is_first_term_reached| is a flag used to prevent + from appearing in the first coefficient of an equation.
        is_first_term_reached = False

        for j in range(number_of_variables):

            if matrix[i][j] == 0:
                # No term is added if the coefficient is 0. Skip to the next coefficient.
                # Do not set the flag to True if it hasn't already been set.
                continue

            if matrix[i][j] < -1:
                # If the coefficient is -2 or smaller, it can be at the beginning of an equation.
                latex_output += '%d x_%d ' % (matrix[i][j], j + 1)
            elif matrix[i][j] == -1:
                # If the coefficient is -1, it shouldn't appear as an explicit coefficient and should show up as a - sign instead.
                latex_output += '-x_%d ' % (j + 1)
            elif matrix[i][j] == 1:
                '''
                If the coefficient is 1, it shouldn't appear as an explicit coefficient.
                If 1 is not the first term, then it must have a + sign.
                '''
                if is_first_term_reached:
                    latex_output += '+ x_%d ' % (j + 1)
                else:
                    latex_output += 'x_%d ' % (j + 1)
            elif matrix[i][j] > 1:
                # If the term is not the first, then it needs a + sign.
                if is_first_term_reached:
                    latex_output += '+ %d x_%d ' % (matrix[i][j], j + 1)
                else:
                    latex_output += '%d x_%d ' % (matrix[i][j], j + 1)

            # The first term has now been reached if it hasn't already.
            is_first_term_reached = True

        latex_output += '&= %d' % matrix[i][number_of_variables]
        latex_output += ' \\\\ '
    latex_output += '\\end{align}'
    return latex_output


def transpose_matrix(matrix):
    '''
    Returns the transpose of a matrix.
    '''
    return map(list, zip(*matrix))


def get_minor_matrix(matrix, row_in_matrix, column_in_matrix):
    '''
    Returns the submatrix of matrix used to calculate the minor corresponding to matrix[row_in_matrix][column_in_matrix].
    Example: Let matrix = [ [1, 2, 3], [4, 5, 6], [7, 8, 9] ], row_in_matrix = 0, column_in_matrix = 0
    Function returns: [ [5, 6], [8, 9] ]
    More info: https://en.wikipedia.org/wiki/Minor_(linear_algebra)
    '''
    return [ 
        row[:column_in_matrix] + row[column_in_matrix + 1:] 
        for row in (matrix[:row_in_matrix] + matrix[row_in_matrix + 1:]) 
    ]


def get_determinant(matrix):
    '''
    Recursively finds the determinant of a matrix using the Laplace expansion.
    Base case: the determinant of a 1 x 1 matrix is the single entry of the matrix.
    More info: https://en.wikipedia.org/wiki/Laplace_expansion
    Raises ValueError if the matrix is non-square.
    '''
    if len(matrix) != len(matrix[0]):
        raise ValueError('Determinant of a non-square matrix is undefined')

    size_of_matrix = len(matrix)

    # Base case: the determinant of a 1 x 1 matrix is the single entry of the matrix
    if size_of_matrix == 1:
        return matrix[0][0]

    # Recursive case: the determinant of an n x n matrix is the sum of cofactors along the top row
    determinant_of_minors = [
        ((-1) ** cofactor ) * matrix[0][cofactor] * get_determinant(get_minor_matrix(matrix, 0, cofactor))
        for cofactor in range(size_of_matrix)
    ]
    return sum(determinant_of_minors)


def invert_matrix(matrix):
    '''
    Finds the inverse of a matrix using the adjugate method.
    Raises ValueError if the matrix is non-square.
    Raises ValueError if the matrix is singular i.e. determinant is 0.
    More info: https://en.wikipedia.org/wiki/Invertible_matrix#Analytic_solution
    '''
    if len(matrix) != len(matrix[0]):
        raise ValueError('Inverse of a non-square matrix is undefined')

    determinant = get_determinant(matrix)
    if determinant == 0:
        raise ValueError('Matrix is singular, inverse does not exist')

    size_of_matrix = len(matrix)
    adjugate_matrix = [
        [ 
            get_determinant(get_minor_matrix(matrix, column, row)) * ((-1) ** (column + row)) 
            for column in range(size_of_matrix) 
        ] 
        for row in range(size_of_matrix) 
    ]
    return [ 
        [
            adjugate_matrix[row][column] / float(determinant)
            for column in range(size_of_matrix)
        ] 
        for row in range(size_of_matrix)
    ]


def matrix_to_ints(matrix):
    '''
    Converts all of the entries in a matrix to integers.
    This is useful so that student responses in matrix questions are checked precisely.
    Ex:
    matrix = [ [1.0, 2.0], [-1.0, 0.0] ]
    int_matrix = matrix_to_ints(matrix)
    int_matrix is [ [1, 2], [-1, 0] ]
    '''
    return [ 
        [
            int(element) for element in row_elements
        ]
        for row_elements in matrix
    ]


def copy_matrix(matrix):
    '''
    Makes a deep copy of a matrix (2D list), particularly useful when augmenting with another matrix or a vector (1D list).
    '''
    return [
        [ element for element in row ]
        for row in matrix
    ]


def augment_matrix_to_matrix(left_matrix, right_matrix):
    '''
    Appends right_matrix (2D list) to left_matrix (2D list).
    Ex: 
    left_matrix = [ [1, 0, 0], [0, 1, 0], [0, 0, 1] ]
    right_matrix = [ [1, 2, 3], [4, 5, 6], [7, 8, 9] ]
    augment_matrix_to_matrix(left_matrix, right_matrix)
    [ [1, 0, 0, 1, 2, 3],
      [0, 1, 0, 4, 5, 6],
      [0, 0, 1, 7, 8, 9] ]
    More info: https://en.wikipedia.org/wiki/Augmented_matrix#To_find_the_inverse_of_a_matrix
    '''
    # The two matrices must have the same number of rows
    if len(left_matrix) != len(right_matrix):
        raise TypeError, "Matrices must have the same number of rows"
        
    # Different function should be used to augment two matrices
    if type(right_matrix) is not list:
        raise TypeError, "Right matrix should be a matrix, not a list. To augment a vector, use augment_vector_to_matrix_as_column() instead"

    # Deep copy the matrix to allow the original matrix to remain as is
    augmented_matrix = copy_matrix(left_matrix)
    
    # Append elements of right_matrix to augmented_matrix row by row
    for row, matrix_row in enumerate(augmented_matrix):
        for column in range(len(right_matrix)):
            matrix_row.append(right_matrix[row][column])

    return augmented_matrix


def augment_vector_to_matrix_as_column(matrix, vector):
    '''
    Append a vector (1D list) to a matrix (2D list) as the rightmost column.
    Ex: 
    matrix = [ [1, 0, 0], [0, 1, 0], [0, 0, 1] ]
    vector = [1, 2, 3]
    append_vector_as_column_to_matrix(matrix, vector)
    [ [1, 0, 0, 1],
      [0, 1, 0, 2],
      [0, 0, 1, 3] ]
    More info: https://en.wikipedia.org/wiki/Augmented_matrix
    '''
    # Matrix length (number of rows) must match vector length
    if len(matrix) != len(vector):
        raise TypeError, "Number of rows in matrix must match number of elements in matrix"

    # Different function should be used to augment two matrices
    if type(vector[row]) is list:
        raise TypeError, "Vector should be a list, not a matrix. To augment matrices, use augment_matrix_to_matrix() instead"

    # Deep copy the matrix to allow the original matrix to remain as is
    augmented_matrix = copy_matrix(matrix)
    
    # Append vector as columns to augmented_matrix
    for row_index, matrix_row in enumerate(augmented_matrix):
        matrix_row.append(vector[row_index])

    return augmented_matrix


def get_column_from_matrix_as_vector(matrix, column):
    '''
    Returns the 1-indexed column of a matrix (2D list) as a vector (1D list).
    Ex: To get the 2nd column of the matrix:
    matrix = [ [1, 2, 3], [4, 5, 6], [7, 8, 9] ]
    get_column_as_vector_from_matrix(matrix, 2)
    [2, 5, 8]
    '''
    return [ row[column - 1] for row in matrix ]