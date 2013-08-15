class MyTest:
	def __init__(self,s):
		self.w = s

	def length(self):
		return len(self.w)


x = MyTest("foo")

print x.length()
