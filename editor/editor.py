def simplebuffer():
    b = Buffer("*scratch*")
    b.lines = ["this is line 1", "this is line 2"]
    return b

def test_SetPoint(b):
    assert b.GetPoint() == (0, 0)
    assert b.GetChar() == "t"
    b.SetPoint(3, 0)
    assert b.GetPoint() == (3, 0)
    assert b.GetChar() == "s"
    b.SetPoint(8, 1)
    assert b.GetChar() == "l"
    b.SetPoint(13, 1)
    assert b.GetChar() == "2"

def test_PointMove(b):
    b.SetPoint(0, 0)
    b.PointMove(3, 0)
    assert b.GetChar() == "s"
    b.PointMove(-3, 0)
    assert b.GetChar() == "t"
    b.PointMove(0, 1)
    assert b.GetChar() == "t"
    b.PointMove(9, 0)
    assert b.GetChar() == "i"

def test_Insert(b):
    b.SetPoint(8, 1)
    assert b.GetChar() == "l"
    b.InsertChar('d')
    assert b.GetChar() == "l"
    b.SetPoint(b.GetPoint()[0] - 1, b.GetPoint()[1])
    assert b.GetChar() == "d"
    b.SetPoint(14, 1)
    assert b.GetChar() == "2"

def test_BeginningOfLineInsert(b):
    b.SetPoint(0, 0)
    assert b.GetChar() == 't'
    b.InsertChar('X')
    assert b.GetChar() == 't'
    b.SetPoint(0, 0)
    assert b.GetChar() == 'X'

def test_EndOfLineInsert(b):
    b.SetPoint(b.LineLength(1), 1)
    b.InsertChar('Y')
    assert b.GetChar() == '\n'
    b.SetPoint(b.LineLength(1) - 1, 1)
    assert b.GetChar() == 'Y'

def test_Delete(b):
    b.SetPoint(8, 0)
    b.Delete(5)
    assert b.lines[0] == "this is 1"
    b.SetPoint(4, 1)
    b.Delete(-4)
    assert b.lines[1] == " is line 2"

def test_Movement():
    ci = CommandInterpreter(simplebuffer())
    ci.SetMode("normal")
    assert ci.buffer.GetChar() == 't'
    ci.HandleInput('l')
    assert ci.buffer.GetChar() == 'h'
    ci.HandleInput('j')
    assert ci.buffer.GetChar() == 'h'
    for i in range(12): ci.HandleInput('l')
    assert ci.buffer.GetChar() == '2'
    ci.HandleInput('h', shift=True)
    assert ci.buffer.GetChar() == 't'

def tests():
    b = simplebuffer()
    test_SetPoint(b)
    test_PointMove(b)
    test_Insert(b)
    test_BeginningOfLineInsert(b)
    test_EndOfLineInsert(b)
    #print b.lines

    b = simplebuffer()
    test_Delete(b)
    #print b.lines

    test_Movement()

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

    def PointMove(self, dx, dy):
        # todo; lines totally wrong
        self.px += dx
        self.py += dy

    def PointMoveBeginningOfLine(self):
        self.px = 0

    def PointMoveEndOfLine(self):
        self.px = self.LineLength(self.py) - 1

    def GetChar(self):
        """get char at point. None if at end of buffer"""
        l = self.lines[self.py]
        if len(l) == self.px:
            return "\n"
        return l[self.px]

    def LineLength(self, line):
        return len(self.lines[line])

    def InsertChar(self, char):
        assert len(char) == 1 # todo; just make this Insert
        if char == '\n':
            print "TODO: insert \\n"
        else:
            line = self.lines[self.py]
            self.lines[self.py] = line[:self.px] + char + line[self.px:]
            self.px += 1

    def Delete(self, count):
        l = self.lines[self.py]
        # todo; line crossing?
        if count < 0:
            to = self.px + count
            if to < 0: to = 0
            self.lines[self.py] = l[:to] + l[self.px:]
        else:
            self.lines[self.py] = l[:self.px] + l[self.px + count:]

class CommandInterpreter:
    def __init__(self, buffer):
        self.buffer = buffer
        self.modes = {
                'normal': self.SetNormalMode
                }
        self.map = {}

    def SetNormalMode(self):
        b = self.buffer
        self.map = {}
        self.map['i'] = lambda: self.SetMode('insert')
        self.map['h'] = lambda: b.PointMove(-1, 0)
        self.map['j'] = lambda: b.PointMove(0, 1)
        self.map['k'] = lambda: b.PointMove(0, -1)
        self.map['l'] = lambda: b.PointMove(1, 0)
        self.map['H'] = lambda: b.PointMoveBeginningOfLine()
        self.map['L'] = lambda: b.PointMoveEndOfLine()
        self.map['w'] = lambda: b.PointMoveWordForward(charsWord)
        self.map['W'] = lambda: b.PointMoveWordForward(charsWORD)
        self.map['b'] = lambda: b.PointMoveWordBackward(charsWord)
        self.map['B'] = lambda: b.PointMoveWordBackward(charsWORD)
        self.map['e'] = lambda: b.PointMoveEndOfWordForward(charsWord)
        self.map['E'] = lambda: b.PointMoveEndOfWordForward(charsWORD)
        self.map['d'] = lambda: self.SetMode('normal-d')
        self.map['y'] = lambda: self.SetMode('normal-y')

    def SetMode(self, name):
        self.modes[name]()

    def keyToExpanded(self, key, shift, ctrl, alt):
        assert key.lower() == key
        if shift: key = key.upper()
        ret = key
        if alt: ret = "A-" + ret
        if ctrl: ret = "C-" + ret
        return ret

    def HandleInput(self, key, shift=False, ctrl=False, alt=False):
        name = self.keyToExpanded(key, shift, ctrl, alt)
        if name in self.map:
            self.map[name]()

tests()
