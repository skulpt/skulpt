from time import sleep

class A(object):
	def __getattr__(self, name):
		sleep(0.001)
		print "Getting %s" % name
		return name

	def __setattr__(self, name, value):
		sleep(0.001)
		print "Setting %s to %s" % (name, value)
		object.__setattr__(self, name, value)

class B(A):
	pass


class C(A):
	def __getattribute__(self, name):
		sleep(0.001)
		print "Getting %s early" % name
		return "FOO"


b = B()
print "b.x = %s" % b.x
b.x = "BAR"
print "b.x = %s" % b.x

c = C()
print "c.x = %s" % c.x
c.x = "BAR"
print "c.x = %s" % c.x


