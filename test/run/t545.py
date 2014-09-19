from time import sleep;

def sleepFiveTimes(param):
	v = 0
	for i in range(5):
		sleep(0.01)
		yield v
		v += param


for v in sleepFiveTimes(5):
	print v

