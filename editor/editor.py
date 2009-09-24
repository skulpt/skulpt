def simplebuffer():
    b = Buffer("*scratch*")
    b.lines = ["this is line 1", "this is line 2"]
    return b
    
def tests():
    b = simplebuffer()

    # unchanged, test setting
    assert b.GetPoint() == (0, 0)
    assert b.GetChar() == "t"
    b.SetPoint(3, 0)
    assert b.GetPoint() == (3, 0)
    assert b.GetChar() == "s"
    b.SetPoint(8, 1)
    assert b.GetChar() == "l"
    b.SetPoint(13, 1)
    assert b.GetChar() == "2"


    # insert and test changes
    b.SetPoint(8, 1)
    assert b.GetChar() == "l"
    b.InsertChar('d')
    assert b.GetChar() == "l"
    b.SetPoint(b.GetPoint()[0] - 1, b.GetPoint()[1])
    assert b.GetChar() == "d"
    b.SetPoint(14, 1)
    assert b.GetChar() == "2"

    # insert at beginning of line
    b.SetPoint(0, 0)
    assert b.GetChar() == 't'
    b.InsertChar('X')
    assert b.GetChar() == 't'
    b.SetPoint(0, 0)
    assert b.GetChar() == 'X'

    # end of line
    b.SetPoint(len(b.lines[1]), 1) # todo; api func
    b.InsertChar('Y')
    assert b.GetChar() == '\n'
    b.SetPoint(len(b.lines[1]) - 1, 1) # todo; api func
    assert b.GetChar() == 'Y'
    print b.lines
    

class Buffer:
    def __init__(self, name):
        self.lines = []
        self.name = name
        self.filename = None
        self.px = 0
        self.py = 0

    def SetPoint(self, x, y):
        self.px = x
        self.py = y

    def GetPoint(self):
        return self.px, self.py

    def GetChar(self):
        """get char at point. None if at end of buffer"""
        l = self.lines[self.py]
        if len(l) == self.px:
            return "\n"
        return l[self.px]

    def InsertChar(self, char):
        assert len(char) == 1 # todo; just make this Insert
        if char == '\n':
            print "TODO: insert \\n"
        else:
            line = self.lines[self.py]
            self.lines[self.py] = line[:self.px] + char + line[self.px:]
            self.px += 1

    def Delete(self, count):
        pass

tests()
