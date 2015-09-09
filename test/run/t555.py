from time import sleep

def sleeping_generator():
    for i in range(5):
        sleep(0.01)
        yield i

x = (i for i in sleeping_generator())

print list(x)

