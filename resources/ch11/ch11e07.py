def readposint(prompt="Please enter a positive integer: "):
    while True:
        numstr = raw_input(prompt)

        try:
            for digit in numstr:
                if not digit.isdigit():  raise ValueError
            return int(numstr) 

        except ValueError:
            print "%s is not a positive integer.  Try again." % numstr
