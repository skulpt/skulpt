import unittest

class CtxMgr:
	def __init__(self, swallow_exception=False):
		self.n_enter = self.n_exit = 0
		self.exc_info = None
		self.swallow_exception = swallow_exception

	def __enter__(self):
		self.n_enter += 1
		return 42

	def __exit__(self, x, y, z):
		self.n_exit += 1
		if x is not None:
			self.exc_info = (x, y, z)
		return self.swallow_exception

	def check_inside(self, testcase):
		testcase.assertEqual(self.n_enter, 1, "__enter__ not called before body")
		testcase.assertEqual(self.n_exit, 0, "__exit__ called before body")

	def check(self, testcase, expect_exception = False):
		testcase.assertEqual(self.n_enter, 1, "__enter__ called wrong number of times")
		testcase.assertEqual(self.n_exit, 1, "__exit__ called wrong number of times")
		if expect_exception:
			testcase.assertIsNotNone(self.exc_info, "No exception passed to __exit__")
		else:
			testcase.assertIsNone(self.exc_info, "Unexpected exception passed to __exit__")


class WithTest(unittest.TestCase):
	def test_with(self):
		# Straightforward execution
		ctxmgr = CtxMgr()
		with ctxmgr as foo:
			self.assertEqual(foo, 42)
			ctxmgr.check_inside(self)
		ctxmgr.check(self)

		# Exception handling
		ctxmgr = CtxMgr()
		def with_exc():
			with ctxmgr:
				raise Exception
			self.assertFalse(True, "Execution continued after raise-within-with")
		self.assertRaises(Exception, with_exc)
		ctxmgr.check(self, expect_exception=True)
		self.assertEqual(ctxmgr.exc_info[0], Exception)

		# Exception swallowing
		ctxmgr = CtxMgr(swallow_exception=True)
		with ctxmgr:
			raise Exception()
		ctxmgr.check(self, expect_exception=True)

		# Break from within 'with'
		ctxmgr = CtxMgr()
		while True:
			with ctxmgr:
				break
		ctxmgr.check(self)

		# Chain correctly to and from other 'finally' clauses
		# (also test 'continue' while we're at it)
		ctxmgr = CtxMgr()
		finally_ran = [False, False, False]
		code_continued = False
		try:
			while not finally_ran[0]:
				try:
					with ctxmgr:
						try:
							continue
						finally:
							finally_ran[0] = True
						self.assertFalse(True, "Execution got past 'continue' statement (within 'with')")
					self.assertFalse(True, "Execution got past 'continue' statement (outside 'with')")
				finally:
					finally_ran[1] = True
			code_continued = True
		finally:
			pass
		ctxmgr.check(self)
		self.assertTrue(code_continued)


if __name__ == "__main__":
    unittest.main()
