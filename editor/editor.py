def simplebuffer():
    b = Buffer("*scratch*")
    b.lines = ["this is line 1",
               "this is line 2",
               "this is stuff and thi_ngs_-wee_waa",
               "@#$ $#@% !^*^ !@#$%^&*()45678",
               "",
               "",
               "this is line 6",
               ]
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

def test_MovementBasic():
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
    ci.HandleInput('l', shift=True)
    assert ci.buffer.GetChar() == '2'

    ci.buffer.SetPoint(0,0)

def test_MovementWords():
    ci = CommandInterpreter(simplebuffer())
    ci.SetMode("normal")
    assert ci.buffer.GetChar() == 't'
    ci.HandleInput('w')
    assert ci.buffer.GetChar() == 'i'
    ci.HandleInput('w')
    assert ci.buffer.GetChar() == 'l'
    ci.HandleInput('w')
    assert ci.buffer.GetChar() == '1'
    ci.HandleInput('w')
    assert ci.buffer.GetChar() == 't'
    ci.HandleInput('b')
    assert ci.buffer.GetChar() == '1'
    ci.HandleInput('b')
    assert ci.buffer.GetChar() == 'l'
    ci.HandleInput('b')
    assert ci.buffer.GetChar() == 'i'
    ci.HandleInput('b')
    assert ci.buffer.GetChar() == 't'
    assert ci.buffer.GetPoint() == (0, 0)

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

    test_MovementBasic()
    test_MovementWords()

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

    def PointMove(self, dx, dy, crossline=False):
        # todo; col saving wrong
        # todo; lines totally wrong
        if crossline:
            assert dy == 0
            assert dx == 1 or dx == -1
            if dx < 0:
                assert "todo;"
            else:
                self.px += 1
                if self.GetChar() == '\n':
                    self.px = 0
                    self.py += 1
        else: 
            self.px += dx
            self.py += dy

    def PointMoveBeginningOfLine(self):
        self.px = 0

    def PointMoveEndOfLine(self):
        self.px = self.LineLength(self.py) - 1

    def PointMoveWord(self, inword, dir=1):
        while True:
            c = self.GetChar()
            if c in inword:
                self.PointMove(dir, 0, crossline=True)
            else:
                break
        while True:
            c = self.GetChar()
            if c in (' ', '\t', '\n'):
                self.PointMove(dir, 0, crossline=True)
            else:
                break

    def PointMoveWordBackward(self, inword):
        pass

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
        charsWord = '0123456789_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
        charsWORD = charsWord + '!@#$%^&*()-=+<>,./?\\|[]{};:\'"'
        self.map = {}
        self.map['i'] = lambda: self.SetMode('insert')
        self.map['h'] = lambda: b.PointMove(-1, 0)
        self.map['j'] = lambda: b.PointMove(0, 1)
        self.map['k'] = lambda: b.PointMove(0, -1)
        self.map['l'] = lambda: b.PointMove(1, 0)
        self.map['H'] = lambda: b.PointMoveBeginningOfLine()
        self.map['L'] = lambda: b.PointMoveEndOfLine()
        self.map['w'] = lambda: b.PointMoveWord(charsWord, 1)
        self.map['W'] = lambda: b.PointMoveWord(charsWORD, 1)
        self.map['b'] = lambda: b.PointMoveWord(charsWord, -1)
        self.map['B'] = lambda: b.PointMoveWord(charsWORD, -1)
        #self.map['e'] = lambda: b.PointMoveWordForward(charsWord, 
        #self.map['E'] = lambda: b.PointMoveWordForward(charsWORD)
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
