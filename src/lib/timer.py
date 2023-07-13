from time import time
class DeltaTime:
    def __init__(self):
        self.lastTime = 0
        self.dt = 0

    def __repr__(self):
        return f"DeltaTime({self.lastTime}, {self.deltaTime})"

    def __str__(self):
        return f"DeltaTime Object - lastTime: {self.lastTime}, dt: {self.dt}"

    def update(self):
        if self.lastTime == 0:
            self.lastTime = time()
        else:
            curTime = time()
            self.dt = curTime - self.lastTime
            self.lastTime = curTime
