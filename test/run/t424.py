l = range(10)
print l
print slice(6), l[slice(6)]
print slice(1,6), l[slice(1,6)]
print slice(1,6,2), l[slice(1,6,2,)]
print slice(-6), l[slice(-6)]
print slice(1,-6), l[slice(1,-6)]
print slice(-1,-6), l[slice(-1,-6)]
print slice(-1,6), l[slice(-1,6)]
print slice(-1,-6,3), l[slice(-1,-6,3)]
print slice(-1,-6,-3), l[slice(-1,-6,-3)]
