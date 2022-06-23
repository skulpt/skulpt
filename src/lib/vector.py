from  math import sqrt, cos, sin
from random import random
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return "Vector (" + str(self.x) + ", " + str(self.y) + ")"
    
    def __str__(self):
        return "Vector (" + str(self.x) + ", " + str(self.y) + ")"
    
    def __add__(self, v):
        x = self.x + v.x
        y = self.y + v.y
        return Vector(x, y)
    
    def add(self, v):
        self.x += v.x
        self.y += v.y
    
    def __radd__(self, v):
        if other == 0:
            return self
        else:
            return self.__add__(v)
    
    def __sub__(self, v):
        x = self.x - v.x
        y = self.y - v.y
        return Vector(x, y)
    
    def sub(self, v):
        self.x -= v.x
        self.y -= v.y
    
    def __mul__(self, n):
        x = self.x * n
        y = self.y * n
        return Vector(x, y)
    
    def mult(self, n):
        self.x *= n
        self.y *= n

    def __div__(self, n):
        x = self.x / n
        y = self.y / n
        return Vector(x, y)
        
    def div(self, n):
        self.x /= n
        self.y /= n
    
    def mag(self):
        return sqrt(self.x ** 2 + self.y ** 2)
        
    def normalise(self):
        m = self.mag()
        if m != 0:
            self.div(m)
    
    def limit(self, limit):
        if self.mag() > limit:
            self.normalise()
            self.mult(limit)
            
    @staticmethod
    def random2D():
        angleRadians = random() * TWO_PI
        return Vector(cos(angleRadians), sin(angleRadians))

    @staticmethod
    def fromAngle(angleRadians, length = 1):
        return Vector(length * cos(angleRadians), length * sin(angleRadians))
