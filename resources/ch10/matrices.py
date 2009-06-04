def mult_lists(a, b):
    sum = 0
    for i in range(len(a)):
        sum += a[i] * b[i]
    return sum


def row_times_column(m1, row, m2, col):
    vector1 = m1[row]
    vector2 = []
    for i in range(len(m1[0])):
        vector2 += [m2[i][col]]
    print "vector1:", vector1, "vector2:", vector2
    return mult_lists(vector1, vector2)


row_times_column([[1, 2], [3, 4], [5, 6]], 0, [[1, 0, 1, 2], [2, 2, 1, 0]], 3)
