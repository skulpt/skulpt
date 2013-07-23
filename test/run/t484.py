class calculator:

    def __init__(self): pass

    def div(self, x, y):
        try:
            return x / y
        except ZeroDivisionError:
            return "ZeroDivisionError: can't divide by zero"
        except NameError as e:
            return e
        except TypeError as e:
            return e
        except TypeError:
            print "DID NOT CATCH 'TypeError as e'"
            return "TypeError"
        except:
            return "OTHER ERROR"

c = calculator();
print c.div(10,1)
print c.div(10,0)
print c.div('12','6')

try:
    print c.div('10','1') / 2
except:
    print "ERROR"

try:
    print c.div(x,12)
except NameError as e:
    print e

