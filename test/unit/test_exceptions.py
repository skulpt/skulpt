import unittest

class ExceptionTest(unittest.TestCase):
	def test_finally(self):
		finally_ran = False
		try:
			pass
		finally:
			finally_ran = True
		self.assertTrue(finally_ran)


		finally_ran = False
		try:
			raise Exception()
		except:
			pass
		else:
			self.assertFalse(True, "'else' should not fire if exception raised")
		finally:
			finally_ran = True
		self.assertTrue(finally_ran)


		finally_ran = False
		try:
			try:
				raise Exception()
			finally:
				finally_ran = True

			self.assertTrue(False, "No re-raise after 'finally'")
		except:
			pass
		self.assertTrue(finally_ran)

if __name__ == "__main__":
    unittest.main()
