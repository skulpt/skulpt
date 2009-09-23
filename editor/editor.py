def simplebuffer():
    b = Buffer("*scratch*")
    b.lines = ["this is line 1", "this is line 2"]
    return b
    
def tests():
    b = simplebuffer()
    assert b.GetPoint() == (0, 0)
    #assert b.GetChar() == "t"
    #b.SetPoint(3, 0)
    #assert b.GetChar() == "s"
    

class Buffer:
    def __init__(self, name):
        self.lines = []
        self.name = name
        self.filename = None
        self.point = 0, 0

    def SetPoint(self, x, y):
        self.point = x, y

    def GetPoint(self):
        return self.point

    def GetChar(self):
        """get char at point. None if at end of buffer"""
        return self.lines[self.point[1]][self.point[0]]

    def InsertChar(self, char):
        if char == '\n':
            print "TODO: insert \\n"
        else:
            line = self.lines[self.point[1]]
            x = self.point[0]
            y = self.point[y]
            self.lines[y] = line[:x] + char + line[x:]

    def Delete(self, count):
        pass

tests()
