__author__ = 'Albert-Jan'

import unittest

class InputFunTests(unittest.TestCase):

    def setUp(self):
        jseval("""
            var oldInputFunTakesPrompt = Sk.inputfunTakesPrompt;
            var oldInputFun = Sk.inputfun
            Sk.inputfunTakesPrompt = true;
            Sk.inputfun = function (prompt) { 
                return new Promise(function (resolve, reject) {
                    if (prompt === "error") {
                        throw new Sk.builtin.ValueError("aarrrggg");
                    }
                    resolve(new Sk.builtin.str(prompt + "testing"));
                });
            }
        """)


    def test_input_fun_should_return_prompt_asynchronously(self):
        res = input(">>> ")
        self.assertEqual(res, ">>> testing")


    def test_error_on_input(self):
        threw = False
        try: 
            res = input("error")
        except ValueError as e:
            self.assertIsInstance(e, ValueError)
            threw = True

        self.assertTrue(threw)


    def tearDown(self):
        jseval("""
            Sk.inputfunTakesPrompt = oldInputFunTakesPrompt;
            Sk.inputfun = oldInputFun;
        """)

if __name__ == '__main__':
    unittest.main()
