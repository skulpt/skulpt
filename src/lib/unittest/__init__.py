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
        self.verbosity = 1
        self.tlist = []
        testNames = {}
        for name in dir(self):
            if name[:4] == 'test' and name not in testNames:
                self.tlist.append(getattr(self,name))
                testNames[name]=True

    def setUp(self):
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
            if self.verbosity > 1:
                print('Running %s' % self.cleanName(func))
            try:
                self.setUp()
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
        if not res and feedback == "":
            feedback = "Expected %s to equal %s" % (str(actual),str(expected))
        self.appendResult(res, actual ,expected, feedback)

    def assertNotEqual(self, actual, expected, feedback=""):
        res = actual != expected
        if not res and feedback == "":
            feedback = "Expected %s to not equal %s" % (str(actual),str(expected))
        self.appendResult(res, actual, expected, feedback)

    def assertTrue(self,x, feedback=""):
        res = bool(x) is True
        if not res and feedback == "":
            feedback = "Expected %s to be True" % (str(x))
        self.appendResult(res, x, True, feedback)

    def assertFalse(self,x, feedback=""):
        res = not bool(x)
        if not res and feedback == "":
            feedback = "Expected %s to be False" % (str(x))
        self.appendResult(res, x, False, feedback)

    def assertIs(self,a,b, feedback=""):
        res = a is b
        if not res and feedback == "":
            feedback = "Expected %s to be the same object as %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertIsNot(self,a,b, feedback=""):
        res = a is not b
        if not res and feedback == "":
            feedback = "Expected %s to not be the same object as %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertIsNone(self,x, feedback=""):
        res = x is None
        if not res and feedback == "":
            feedback = "Expected %s to be None" % (str(x))
        self.appendResult(res, x, None, feedback)

    def assertIsNotNone(self,x, feedback=""):
        res = x is not None
        if not res and feedback == "":
            feedback = "Expected %s to not be None" % (str(x))
        self.appendResult(res, x, None, feedback)

    def assertIn(self, a, b, feedback=""):
        res = a in b
        if not res and feedback == "":
            feedback = "Expected %s to be in %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertNotIn(self, a, b, feedback=""):
        res = a not in b
        if not res and feedback == "":
            feedback = "Expected %s to not be in %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertIsInstance(self,a,b, feedback=""):
        res = isinstance(a,b)
        if not res and feedback == "":
            feedback = "Expected %s to be an instance of %s" % (str(a), str(b))
        self.appendResult(res, a, b, feedback)

    def assertNotIsInstance(self,a,b, feedback=""):
        res = not isinstance(a,b)
        if not res and feedback == "":
            feedback = "Expected %s to not be an instance of %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertAlmostEqual(self, a, b, places=7, feedback="", delta=None):

        if delta is not None:
            res = abs(a-b) <= delta
        else:
            if places is None:
                places = 7
            res = round(a-b, places) == 0
        
        if not res and feedback == "":
            feedback = "Expected %s to equal %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertNotAlmostEqual(self, a, b, places=7, feedback="", delta=None):

        if delta is not None:
            res = not (a == b) and abs(a - b) > delta
        else:
            if places is None:
                places = 7
            res = round(a-b, places) != 0

        if not res and feedback == "":
            feedback = "Expected %s to not equal %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)


    def assertGreater(self,a,b, feedback=""):
        res = a > b
        if not res and feedback == "":
            feedback = "Expected %s to be greater than %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertGreaterEqual(self,a,b, feedback=""):
        res = a >= b
        if not res and feedback == "":
            feedback = "Expected %s to be >= %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertLess(self, a, b, feedback=""):
        res = a < b
        if not res and feedback == "":
            feedback = "Expected %s to be less than %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertLessEqual(self,a,b, feedback=""):
        res = a <= b
        if not res and feedback == "":
            feedback = "Expected %s to be <= %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def appendResult(self,res,actual,expected,feedback):
        if res:
            msg = 'Pass'
            self.assertPassed += 1
        else:
            msg = 'Fail: ' +  feedback
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



def main(verbosity=1):
    glob = globals() # globals() still needs work
    for name in glob:
        if issubclass(glob[name],TestCase):
            try:
                tc = glob[name]()
                tc.verbosity = verbosity
                tc.main()
            except:
                print("Uncaught Error in: ", name)
