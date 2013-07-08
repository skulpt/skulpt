def helper(func,x):
    print func(x), func(-x), func(long(x)), func(-long(x))

big = 123456789123456789123456789123456789

print "\nHEX"
helper(hex,10)
helper(hex,0xff)
helper(hex,034)
helper(hex,0b1110011)
helper(hex,big)

print "\nOCT"
helper(oct,10)
helper(oct,0xff)
helper(oct,034)
helper(oct,0b1110011)
helper(oct,big)

print "\nBIN"
helper(bin,10)
helper(bin,0xff)
helper(bin,034)
helper(bin,0b1110011)
helper(bin,big)
