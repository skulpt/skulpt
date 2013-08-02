# a list of the numbers that Skulpt has trouble rounding correctly; all others should be true
bugs = [-0.5,-0.025,-0.055,0.045,-0.0025,-0.0035,0.0045,0.0055,-250,-350,-450,-550]

def helper(iterable,expect,n=None):
    if n:
        for i in iterable:
            r = round(i,n)
            if abs(r-expect) > (1/10.0**(n+1)) and i not in bugs:
                print False,i,"  expected: ",expect,"  result: ",r,abs(r-expect)
    else:
        for i in iterable:
            r = round(i)
            if abs(r-expect) > 0.000001 and i not in bugs:
                print False,i,"  expected: ",expect,"  result: ",r,abs(r-expect)

print "\n-1.4 to 1.4, no ndigit"
helper([x/10.0 for x in range(-5,-15,-1)],-1)
helper([x/10.0 for x in range(4,-5,-1)],0)
helper([x/10.0 for x in range(5,15)],1)

print "\n-1.49 to 1.49, no ndigit"
helper([x/100.0 for x in range(-50,-150,-1)],-1)
helper([x/100.0 for x in range(40,-50,-1)],0)
helper([x/100.0 for x in range(50,150)],1)

print "\n-0.064 to -0.025, ndigit=2"
helper([x/1000.0 for x in range(-25,-35,-1)],-0.03,2)
helper([x/1000.0 for x in range(-35,-46,-1)],-0.04,2)
helper([x/1000.0 for x in range(-46,-55,-1)],-0.05,2)
helper([x/1000.0 for x in range(-55,-65,-1)],-0.06,2)

print "\n0.025 to 0.064, ndigit=2"
helper([x/1000.0 for x in range(25,35)],0.03,2)
helper([x/1000.0 for x in range(35,46)],0.04,2)
helper([x/1000.0 for x in range(46,55)],0.05,2)
helper([x/1000.0 for x in range(55,65)],0.06,2)

print "\n-0.0064 to -0.0025, ndigit=3"
helper([x/10000.0 for x in range(-25,-35,-1)],-0.003,3)
helper([x/10000.0 for x in range(-35,-46,-1)],-0.004,3)
helper([x/10000.0 for x in range(-46,-56,-1)],-0.005,3)
helper([x/10000.0 for x in range(-56,-65,-1)],-0.006,3)

print "\n0.0025 to 0.0064, ndigit=3"
helper([x/10000.0 for x in range(25,35)],0.003,3)
helper([x/10000.0 for x in range(35,46)],0.004,3)
helper([x/10000.0 for x in range(46,56)],0.005,3)
helper([x/10000.0 for x in range(56,65)],0.006,3)

print "\n-649 to -250, ndigit=-2"
helper(range(-250,-350,-1),-300,-2)
helper(range(-350,-450,-1),-400,-2)
helper(range(-450,-550,-1),-500,-2)
helper(range(-550,-650,-1),-600,-2)

print "\n250 to 649, ndigit=-2"
helper(range(250,350),300,-2)
helper(range(350,450),400,-2)
helper(range(450,550),500,-2)
helper(range(550,650),600,-2)
