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

else:
    print("JSBI tests skipped: native BigInt is active")

if __name__ == '__main__':
    unittest.main()
