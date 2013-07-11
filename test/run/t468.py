class Matrix(object):
    """
    Represents a matrix
    """

    def __init__(self, matrix=None):
        """
        """
        #check if all rows same size

        self.mat = matrix

    #identity matrix initilization

    #scalar matrix multiplication

    def __getitem__(self, index):
        """
        """
        #print index
        return self.mat[index[0]][index[1]]
        

    def __setitem__(self, index, item):
        """
        """

        self.mat[index[0]][index[1]] = item

trial=Matrix([[543]])
trial[0,0]=100
print trial[0,0]
