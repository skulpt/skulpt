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

	def test_finally_return(self):
		finally_ran = [False]
		def r1():
			try:
				return 42
				self.assertTrue(False, "Execution continued after return")
			finally:
				finally_ran[0] = True
		self.assertEqual(r1(), 42)
		self.assertTrue(finally_ran[0], "'finally' block did not run")

		def r2():
			try:
				return 42
				self.assertTrue(False, "Execution continued after return")
			finally:
				return 43
		self.assertEqual(r2(), 43)

		def r3():
			try:
				raise Exception()
			finally:
				return 42
		self.assertEqual(r3(), 42)

		finally_ran = [False]
		def r4():
			try:
				raise Exception()
			except:
				return 42
			finally:
				finally_ran[0] = True
		self.assertEqual(r4(), 42);
		self.assertTrue(finally_ran[0], "'finally' block did not run")

		def r5():
			try:
				raise Exception()
			except:
				return 42
			finally:
				return 43
		self.assertEqual(r5(), 43)

		finally_ran = [False, False]
		def r6():
			try:
				try:
					raise Exception()
				finally:
					finally_ran[0] = True
					return 42
			finally:
				finally_ran[1] = True
		self.assertEqual(r6(), 42)
		self.assertEqual(finally_ran, [True, True])

		def r7():
			try:
				return 42
			finally:
				raise Exception()
		self.assertRaises(Exception, r7)

	def test_finally_break_continue(self):
		finally_ran = [False,False]
		normal_execution_continued = False
		try:
			while True:
				try:
					try:
						break
					finally:
						finally_ran[0] = True
					self.assertFalse(True, "Execution got past 'break' statement")
				finally:
					finally_ran[1] = True
				self.assertFalse(True, "Execution got past 'break' statement")
			normal_execution_continued = True
		finally:
			self.assertEqual(finally_ran, [True, True]);
			self.assertTrue(normal_execution_continued, "'break' skipped too many finallies")


		finally_ran = [False,False]
		normal_execution_continued = False
		try:
			while not finally_ran[0]:
				try: 
					try:
						continue
					finally:
						finally_ran[0] = True
					self.assertFalse(True, "Execution got past 'continue' statement")
				finally:
					finally_ran[1] = True
				self.assertFalse(True, "Execution got past 'continue' statement")
			normal_execution_continued = True
		finally:
			self.assertEqual(finally_ran, [True, True]);
			self.assertTrue(normal_execution_continued, "'continue' skipped too many finallies")


if __name__ == "__main__":
    unittest.main()
