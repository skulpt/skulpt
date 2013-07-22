#map 
seq = range(8)
newseq = map(lambda x : x*x, seq);
print newseq

#reduce
rseq = range(16)
rnewseq = reduce(lambda x,y: x + y, rseq)
print rnewseq
rnewseq2 = reduce(lambda x,y: x + y, [], 8)
print rnewseq2

#filter
fseq = range(16)
fnewseq = filter(lambda x: x % 2 == 0, fseq)
print fnewseq