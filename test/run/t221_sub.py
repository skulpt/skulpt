x = 444
def f(arg):
    return "OK: " + arg + ", " + str(x)

import dis
print dis.dis(f)
