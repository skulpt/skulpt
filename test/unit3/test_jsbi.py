"""Selected existing numeric tests for Skulpt's JSBI fallback backend."""
import unittest

# The coordinator selects JSBI before Skulpt starts: npm test -- jsbi.
# Inspect the actual integer representation, rather than browser capabilities.
if jseval("typeof Sk.global.JSBI.BigInt(0) === 'object'"):
    import test_pow
    import test_fractions

    # Reuse individual methods to keep the fallback selection explicit.
    class JSBINumericTests(unittest.TestCase):
        test_modular_power = test_pow.PowTest.test_other
        test_fraction_hash = test_fractions.FractionTest.testHash

    import test_skulpt_decimal_bugs as decimal_tests

    class JSBIDecimalTests(unittest.TestCase):
        setUp = decimal_tests.DecimalRegressionTests.setUp
        tearDown = decimal_tests.DecimalRegressionTests.tearDown
        test_integer_power = decimal_tests.DecimalRegressionTests.test_integer_power_and_modulus
        test_numeric_hashes = decimal_tests.DecimalRegressionTests.test_equal_numbers_are_interchangeable_dict_keys
        test_rounding = decimal_tests.DecimalRegressionTests.test_context_precision_and_rounding
        test_quantize = decimal_tests.DecimalRegressionTests.test_quantize_preserves_scale_and_reports_lost_digits

else:
    print("JSBI tests skipped: native BigInt is active")

if __name__ == '__main__':
    unittest.main()
