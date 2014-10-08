from time import sleep;

class SleepyClass:

  def __init__(self):
    print "Sleeping in __init__"
    print "Sleep returned "+str(sleep(0.01))

  def doSleep(self, param):
    x = 42
    print "Sleeping for .01 seconds"
    print "Sleep returned "+str(sleep(0.01))
    print "Woke up; x = " + str(x)
    print "param = " + str(param)


sleeper = SleepyClass()
sleeper.doSleep(7)

