def factorial(n):
    if n == 0:
        return 1
    else:
        print "factorial(%d) called." % n
        return n * factorial(n-1)


def fibonacci (n):
    if n == 0 or n == 1:
        return 1
    else:
        return fibonacci(n-1) + fibonacci(n-2)
