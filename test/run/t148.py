class Test:
    def __init__(self, v):
        self.value = v
    def __call__(self):
        print self.value
x = Test('OK')
x()
