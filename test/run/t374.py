import re

def f(a, b=3, c=None):
    print a, b, c
    
f(1, c=4)
print re.split("a", "A stitch in time saves nine.", flags=re.IGNORECASE)
print re.findall(string="A stitch in time saves nine.", flags=re.IGNORECASE, pattern="a")


