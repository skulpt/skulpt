__author__ = 'bmiller'
'''
This is the start of something that behaves like
the unittest module from cpython.

'''

class TestCase:
    def __init__(self):
        self.numPassed = 0
        self.numFailed = 0
        self.assertPassed = 0
        self.assertFailed = 0
        self.verbose = True
        self.tlist = []
        testNames = {}
        for name in dir(self):
            if name[:4] == 'test' and name not in testNames:
                self.tlist.append(getattr(self,name))
                testNames[name]=True

    def setup(self):
        pass

    def tearDown(self):
        pass
    def cleanName(self,funcName):
    # work around skulpts lack of an __name__ 
        funcName = str(funcName)
        funcName = funcName[13:]
        funcName = funcName[:funcName.find('<')-3]
        return funcName
        
    def main(self):

        for func in self.tlist:
            if self.verbose:
                print('Running %s' % self.cleanName(func))
            try:
                self.setup()
                self.assertPassed = 0
                self.assertFailed = 0
                func()
                self.tearDown()
                if self.assertFailed == 0:
                    self.numPassed += 1
                else:
                    self.numFailed += 1
                    print('Tests failed in %s ' % self.cleanName(func))
            except Exception as e:
                self.assertFailed += 1
                self.numFailed += 1
                print('Test threw exception in %s (%s)' % (self.cleanName(func), e))
        self.showSummary()

    def assertEqual(self, actual, expected, feedback=""):
        res = actual==expected
        self.appendResult(res,str(actual)+' to be equal to ',expected, feedback)

    def assertNotEqual(self, actual, expected, feedback=""):
        res = actual != expected
        self.appendResult(res,str(actual)+' to not equal ',expected,feedback)

    def assertTrue(self,x, feedback=""):
        res = bool(x) is True
        self.appendResult(res,str(x)+' to be ',True,feedback)

    def assertFalse(self,x, feedback=""):
        res = not bool(x)
        self.appendResult(res,str(x)+' to be ',False,feedback)

    def assertIs(self,a,b, feedback=""):
        res = a is b
        self.appendResult(res,str(a)+' to be the same object as ',b,feedback)

    def assertIsNot(self,a,b, feedback=""):
        res = a is not b
        self.appendResult(res,str(a)+' to not be the same object as ',b,feedback)

    def assertIsNone(self,x, feedback=""):
        res = x is None
        self.appendResult(res,x,None,feedback)

    def assertIsNotNone(self,x, feedback=""):
        res = x is not None
        self.appendResult(res,str(x)+' to not be ',None,feedback)

    def assertIn(self,a,b, feedback=""):
        res = a in b
        self.appendResult(res,str(a)+' to be in ',b,feedback)

    def assertNotIn(self,a,b, feedback=""):
        res = a not in b
        self.appendResult(res,str(a)+' to not be in ',b,feedback)

    def assertIsInstance(self,a,b, feedback=""):
        res = isinstance(a,b)
        self.appendResult(res,str(a)+' to be an instance of ',b,feedback)

    def assertNotIsInstance(self,a,b, feedback=""):
        res = not isinstance(a,b)
        self.appendResult(res,str(a)+' to not be an instance of ',b,feedback)

    def assertAlmostEqual(self, a, b, places=7, feedback=""):
        res = round(a-b, places) == 0
        self.appendResult(res,str(a)+' to equal ',b,feedback)

    def assertNotAlmostEqual(self, a, b, places=7, feedback=""):
        res = round(a-b, places) != 0
        self.appendResult(res,str(a)+' to not equal ',b,feedback)

    def assertGreater(self,a,b, feedback=""):
        res = a > b
        self.appendResult(res,str(a)+' to be greater than ',b,feedback)

    def assertGreaterEqual(self,a,b, feedback=""):
        res = a >= b
        self.appendResult(res,str(a)+' to be greater than or equal to ',b,feedback)

    def assertLess(self,a,b, feedback=""):
        res = a < b
        self.appendResult(res,str(a)+' to be less than ',b,feedback)

    def assertLessEqual(self,a,b, feedback=""):
        res = a <= b
        self.appendResult(res,str(a)+' to be less than or equal to ',b,feedback)

    def appendResult(self,res,actual,expected,feedback):
        if res:
            msg = 'Pass'
            self.assertPassed += 1
        else:
            msg = 'Fail: expected %s got %s ' % (str(actual),str(expected)) + feedback
            print(msg)
            self.assertFailed += 1

    def assertRaises(self, exception, callable=None, *args, **kwds):
        # with is currently not supported hence we just try and catch
        if callable is None:
            raise NotImplementedError("assertRaises does currently not support assert contexts")
        if kwds:
            raise NotImplementedError("assertRaises does currently not support **kwds")

        res = False
        actualerror = str(exception())
        try:
            callable(*args)
        except exception as ex:
            res = True
        except Exception as inst:
            actualerror = str(inst)
            print("ACT = ", actualerror, str(exception()))
        else:
            actualerror = "No Error"

        self.appendResult(res, str(exception()), actualerror, "")
        
    def fail(self, msg=None):
        if msg is None:
            msg = 'Fail'
        else:
            msg = 'Fail: ' + msg
        print(msg)
        self.assertFailed += 1

    def showSummary(self):
        pct = self.numPassed / (self.numPassed+self.numFailed) * 100
        print("Ran %d tests, passed: %d failed: %d\n" % (self.numPassed+self.numFailed,
                                               self.numPassed, self.numFailed))



def main(verbose=False, names=None):
    glob = globals() # globals() still needs work
    if names == None:
        names = glob
    for name in names:
        if issubclass(glob[name],TestCase):
            try:
                tc = glob[name]()
                tc.verbose = verbose
                tc.main()
            except:
                print("Uncaught Error in: ", name)

