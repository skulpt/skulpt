from time import sleep;

def doSleep(param):
	x = 42
	print "Sleeping for .01 seconds"
	print "Sleep returned "+str(sleep(0.01))
	print "Woke up; x = " + str(x)
	print "param = " + str(param)


doSleep(7)
