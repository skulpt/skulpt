class Point:
    def __init__(self, initX, initY):
        self.x = initX
        self.y = initY

    def __str__(self):
        return str(self.x) + "," + str(self.y)


p = Point(1,2)

print(p)
print str(p)
