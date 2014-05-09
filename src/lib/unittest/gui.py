import document
from unittest import TestCase

class TestCaseGui(TestCase):
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
