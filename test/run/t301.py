# Test the comparison of sets

print '# actual super & subsets'

sup = set([1,2,3,4,100])
print sup

sub = set([2,3,4])
print sub

print '# forwards'
print sup.isdisjoint(sub)
print sup > sub
print sup.issuperset(sub)
print sup >= sub
print sup == sub
print sup != sub
print sup.issubset(sub)
print sup <= sub
print sup < sub
print '# backwards'
print sub.isdisjoint(sup)
print sub > sup
print sub.issuperset(sup)
print sub >= sup
print sub == sup
print sub != sup
print sub.issubset(sup)
print sub <= sup
print sub < sup
