class obj:
    def __init__(self):
        self.num = 2

    def delete(self):
        print self.num

    def abc(self):
        print self.num + 1

a = obj()
a.abc()
a.delete()
