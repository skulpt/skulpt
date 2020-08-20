""" Unit test for error handling"""
import unittest

class TryExceptFinallyTest(unittest.TestCase):
    def test_try(self):
        a,b,c,d,e,f,g = False, False, False, False, False, False, False
        try:
            a = True
            try:
                b = True
                i = int('badint');
                c = True
            except:
                d = True
            e = True
            i = float('otherbadint')
            f = True
        except:
            g = True
        self.assertTrue(a)
        self.assertTrue(b)
        self.assertFalse(c)
        self.assertTrue(d)
        self.assertTrue(e)
        self.assertFalse(f)
        self.assertTrue(g)

    def test_except(self):
        def test(i):
            f = 3
            try:
                return f == 5
            except ValueError:
                return True
        self.assertFalse(test(12))

    def test_errors(self):
        error1, error2, error3, error4, error5, error6, error7 = None, None, None, None, None, None, None
        try:
            assert 1 > 10
        except AssertionError:
            error1 = "caught error"
        except:
            error1 = "missed error"
        self.assertEqual(error1, "caught error")
        try:
            error2 = None.notAnAttribute
        except AttributeError:
            error2 = "Caught AttributeError"
        except:
            error2 = "Did not catch AttributeError"
        self.assertEqual(error2, "Caught AttributeError")
        try:
            import notAModule
        except ImportError:
            error3 = "Caught ImportError"
        except:
            error3 = "Did not catch ImportError"
        self.assertEqual(error3, "Caught ImportError")
        try:
            error4 = [0,1,2,3,4][5]
        except IndexError:
            error4 = "Caught IndexError"
        except:
            error4 = "Did not catch IndexError"
        self.assertEqual(error4, "Caught IndexError")
        try:
            print({1:2, 3:4}[5])
        except KeyError:
            error5 = "Caught KeyError"
        except:
            error5 = "Did not catch KeyError"
        self.assertEqual(error5, "Caught KeyError")
        try:
            error6 = x
        except NameError:
            error6 = "Caught NameError"
        except:
            error6 = "Did not catch NameError"
        self.assertEqual(error6, "Caught NameError")
        try:
            print(0.0000000000000000000000000000000000000000000000000000000000000001**-30)
        except OverflowError:
            error7 = "Caught OverflowError"
        except:
            error7 = "Did not catch OverflowError"
        self.assertEqual(error7, "Caught OverflowError")


    def test_exception(self):
        class C:
            def __init__(self):
              try:
                raise Exception("Oops")
              except:
                self.x = "Caught"
        c = C()
        self.assertEqual(c.x, "Caught")

    def test_bad_exception(self):
        # Skulpt Bug
        class InvalidException:
            # does not inherit from BaseException
            pass

        with self.assertRaises(TypeError) as c:
            raise InvalidException
        self.assertIn("BaseException", c.exception.args[0])
        
        with self.assertRaises(TypeError):
            raise InvalidException()

        with self.assertRaises(TypeError):
            raise 1

if __name__ == '__main__':
    unittest.main()
            
