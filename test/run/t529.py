class test:
	def __hash__(self):
		return 1

a = test()
b = test()
d = { a: 5 }
d[b] = 6
print d
