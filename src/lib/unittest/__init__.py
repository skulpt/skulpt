__author__ = 'bmiller'

import document


class unittest:
    def __init__(self):
        self.numPassed = 0
        self.numFailed = 0
        self.divid = document.currentDiv()
        self.mydiv = document.getElementById(self.divid)
        res = document.getElementById(self.divid+'_unit_results')
        if res:
            self.resdiv = res
            res.innerHTML = ''
        else:
            self.resdiv = document.createElement('div')
            self.resdiv.setAttribute('id',self.divid+'_unit_results')
            self.resdiv.setAttribute('class','unittest-results')
        self.mydiv.appendChild(self.resdiv)

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

    def main(self):
        l = document.createElement('ul')
        self.resdiv.appendChild(l)
        self.resList = l

        for func in self.tlist:
            try:
                self.setup()
                func()
                self.tearDown()
            except:
                self.appendResult('Error')
                self.numFailed += 1
        self.showSummary()

    def assertEqual(self, actual, expected, feedback=""):
        res = actual==expected
        self.appendResult(res,str(actual)+' to be equal to ',expected, feedback)

    def assertNotEqual(actual, expected, feedback=""):
        res = actual != expected
        self.appendResult(res,str(actual)+' to not equal ',expected,feedback)

    def assertTrue(self,x, feedback=""):
        res = x
        self.appendResult(res,str(x)+' to be ',True,feedback)

    def assertFalse(self,x, feedback=""):
        res = not x
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

    def assertAlmostEqual(self,a,b, feedback=""):
        res = round(a-b,7) == 0
        self.appendResult(res,str(a)+' to equal ',b,feedback)

    def assertNotAlmostEqual(self,a,b, feedback=""):
        res = round(a-b,7) != 0
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
        if res == 'Error':
            msg = 'Error'
        elif res:
            msg = 'Pass'
            self.numPassed += 1
        else:
            msg = 'Fail: expected %s  %s ' % (str(actual),str(expected)) + feedback
            self.numFailed += 1

        pTag = document.createElement('li')
        pTag.innerHTML = msg
        self.resList.appendChild(pTag)

    def showSummary(self):
        pct = self.numPassed / (self.numPassed+self.numFailed) * 100
        pTag = document.createElement('p')
        pTag.innerHTML = "You passed: " + str(pct) + "% of the tests"
        self.resdiv.appendChild(pTag)
        if pct < 90:
            self.resdiv.setCSS('background-color','#de8e96')
        else:
            self.resdiv.setCSS('background-color','#83d382')



