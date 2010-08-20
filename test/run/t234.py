
def loc(): pass
def gbl(): pass
def free(): pass
def cell(): pass
def gen(): pass
def true(): pass
def var(): pass
def volatile(): pass
def package():
    loc = 4
    gbl = 42
    cell = 19
    instanceof = gbl * cell
    static = instanceof
    print loc, gbl, cell, instanceof, static
    print true == var
    print volatile != package


package()
