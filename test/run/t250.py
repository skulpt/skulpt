class A: pass
a = A()

print isinstance([], list)
print isinstance([], dict)
print isinstance([], str)
print isinstance([], tuple)
print isinstance([], A)
print "---"

print isinstance({}, list)
print isinstance({}, dict)
print isinstance({}, str)
print isinstance({}, tuple)
print isinstance({}, A)
print "---"

print isinstance("", list)
print isinstance("", dict)
print isinstance("", str)
print isinstance("", tuple)
print isinstance("", A)
print "---"

print isinstance((), list)
print isinstance((), dict)
print isinstance((), str)
print isinstance((), tuple)
print isinstance((), A)
print "---"

print isinstance(a, list)
print isinstance(a, dict)
print isinstance(a, str)
print isinstance(a, tuple)
print isinstance(a, A)
print "---"
