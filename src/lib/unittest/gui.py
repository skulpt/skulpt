import document
from unittest import TestCase


def _accept_feedback(assertion):
    def check(self, *args, **kwargs):
        if 'feedback' in kwargs:
            if 'msg' in kwargs:
                raise TypeError('use either feedback or msg')
            kwargs['msg'] = kwargs.pop('feedback')
        return assertion(self, *args, **kwargs)
    return check


class TestCaseGui(TestCase):
     _legacy_assertions = True

     # Existing Runestone exercises pass feedback by name and display it as the note.
     longMessage = False
     assertEqual = _accept_feedback(TestCase.assertEqual)
     assertNotEqual = _accept_feedback(TestCase.assertNotEqual)
     assertTrue = _accept_feedback(TestCase.assertTrue)
     assertFalse = _accept_feedback(TestCase.assertFalse)
     assertIs = _accept_feedback(TestCase.assertIs)
     assertIsNot = _accept_feedback(TestCase.assertIsNot)
     assertIsNone = _accept_feedback(TestCase.assertIsNone)
     assertIsNotNone = _accept_feedback(TestCase.assertIsNotNone)
     assertIn = _accept_feedback(TestCase.assertIn)
     assertNotIn = _accept_feedback(TestCase.assertNotIn)
     assertIsInstance = _accept_feedback(TestCase.assertIsInstance)
     assertNotIsInstance = _accept_feedback(TestCase.assertNotIsInstance)
     assertRegex = _accept_feedback(TestCase.assertRegex)
     assertNotRegex = _accept_feedback(TestCase.assertNotRegex)
     assertAlmostEqual = _accept_feedback(TestCase.assertAlmostEqual)
     assertNotAlmostEqual = _accept_feedback(TestCase.assertNotAlmostEqual)
     assertGreater = _accept_feedback(TestCase.assertGreater)
     assertGreaterEqual = _accept_feedback(TestCase.assertGreaterEqual)
     assertLess = _accept_feedback(TestCase.assertLess)
     assertLessEqual = _accept_feedback(TestCase.assertLessEqual)

     def __init__(self):
          TestCase.__init__(self)
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


     def main(self):
         t = document.createElement('table')
         self.resTable = t
         self.resdiv.appendChild(self.resTable)

         headers = ['Result','Actual Value','Expected Value','Notes']
         row = document.createElement('tr')
         for item in headers:
             head = document.createElement('th')
             head.setAttribute('class','ac-feedback')
             head.innerHTML = item
             head.setCSS('text-align','center')
             row.appendChild(head)
         self.resTable.appendChild(row)

         for func in self.tlist:
             try:
                 self.setUp()
                 func()
                 self.tearDown()
             except Exception as e:
                 self.appendResult('Error', None, None, e)
                 self.numFailed += 1
                 self.showSummary()

     def appendResult(self,res,actual,expected,param):
         trimActual = False
         if len(str(actual)) > 15:
             trimActual = True
             actualType = type(actual)
         trimExpected = False
         if len(str(expected)) > 15:
             trimExpected = True
             expectedType = type(expected)
         row = document.createElement('tr')
         err = False
         if res == 'Error':
             err = True
             msg = 'Error: %s' % param
             errorData = document.createElement('td')
             errorData.setAttribute('class','ac-feedback')
             errorData.innerHTML = 'ERROR'
             errorData.setCSS('background-color','#de8e96')
             errorData.setCSS('text-align','center')
             row.appendChild(errorData)
         elif res:
             passed = document.createElement('td')
             passed.setAttribute('class','ac-feedback')
             passed.innerHTML = 'Pass'
             passed.setCSS('background-color','#83d382')
             passed.setCSS('text-align','center')
             row.appendChild(passed)
             self.numPassed += 1
         else:
             fail = document.createElement('td')
             fail.setAttribute('class','ac-feedback')
             fail.innerHTML = 'Fail'
             fail.setCSS('background-color','#de8e96')
             fail.setCSS('text-align','center')
             row.appendChild(fail)
             self.numFailed += 1


         act = document.createElement('td')
         act.setAttribute('class','ac-feedback')
         if trimActual:
             actHTML = str(actual)[:5] + "..." + str(actual)[-5:]
             if actualType == str:
                 actHTML = repr(actHTML)
             act.innerHTML = actHTML
         else:
             act.innerHTML = repr(actual)
         act.setCSS('text-align','center')
         row.appendChild(act)

         expect = document.createElement('td')
         expect.setAttribute('class','ac-feedback')

         if trimExpected:
             expectedHTML = str(expected)[:5] + "..." + str(expected)[-5:]
             if expectedType == str:
                 expectedHTML = repr(expectedHTML)
             expect.innerHTML = expectedHTML
         else:
             expect.innerHTML = repr(expected)
         expect.setCSS('text-align','center')
         row.appendChild(expect)
         inp = document.createElement('td')
         inp.setAttribute('class','ac-feedback')

         if err:
             inp.innerHTML = msg
         else:
             inp.innerHTML = param
         inp.setCSS('text-align','center')
         row.appendChild(inp)
         self.resTable.appendChild(row)


     def showSummary(self):
         pct = self.numPassed / (self.numPassed+self.numFailed) * 100
         pTag = document.createElement('p')
         pTag.innerHTML = "You passed: " + str(pct) + "% of the tests"
         self.resdiv.appendChild(pTag)
