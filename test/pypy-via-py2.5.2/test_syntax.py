"""This module tests SyntaxErrors.

Here's an example of the sort of thing that is tested.

>>> def f(x):
...     global x # doctest: +ELLIPSIS
Traceback (most recent call last):
SyntaxError: name 'x' is ... global...

The tests are all raise SyntaxErrors.  They were created by checking
each C call that raises SyntaxError.  There are several modules that
raise these exceptions-- ast.c, compile.c, future.c, pythonrun.c, and
symtable.c.

The parser itself outlaws a lot of invalid syntax.  None of these
errors are tested here at the moment.  We should add some tests; since
there are infinitely many programs with invalid syntax, we would need
to be judicious in selecting some.

The compiler generates a synthetic module name for code executed by
doctest.  Since all the code comes from the same module, a suffix like
[1] is appended to the module name, As a consequence, changing the
order of tests in this module means renumbering all the errors after
it.  (Maybe we should enable the ellipsis option for these tests.)

In ast.c, syntax errors are raised by calling ast_error().

Errors from set_context():

TODO(jhylton): "assignment to None" is inconsistent with other messages

>>> obj.None = 1 # doctest: +ELLIPSIS
Traceback (most recent call last):
SyntaxError: assignment to None ...(<doctest test.test_syntax[1]>, line 1)

>>> None = 1 # doctest: +ELLIPSIS
Traceback (most recent call last):
SyntaxError: assignment to None ...(<doctest test.test_syntax[2]>, line 1)

It's a syntax error to assign to the empty tuple.  Why isn't it an
error to assign to the empty list?  It will always raise some error at
runtime.

>>> () = 1 # doctest: +ELLIPSIS
Traceback (most recent call last):
SyntaxError: ... (<doctest test.test_syntax[3]>, line 1)

>>> f() = 1 # doctest: +ELLIPSIS
Traceback (most recent call last):
SyntaxError: can't assign to function call (<doctest test.test_syntax[4]>, line 1)

>>> del f()
Traceback (most recent call last):
SyntaxError: can't delete function call (<doctest test.test_syntax[5]>, line 1)

>>> a + 1 = 2 # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: can't assign to ... (<doctest test.test_syntax[6]>, line 1)

>>> (x for x in x) = 1 # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: ... (<doctest test.test_syntax[7]>, line 1)

>>> 1 = 1 # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: can't assign ... (<doctest test.test_syntax[8]>, line 1)

>>> "abc" = 1 # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: can't assign to ... (<doctest test.test_syntax[9]>, line 1)

>>> `1` = 1 # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: can't assign to ... (<doctest test.test_syntax[10]>, line 1)

If the left-hand side of an assignment is a list or tuple, an illegal
expression inside that contain should still cause a syntax error.
This test just checks a couple of cases rather than enumerating all of
them.

>>> (a, "b", c) = (1, 2, 3) # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: can't assign to ... (<doctest test.test_syntax[11]>, line 1)

>>> [a, b, c + 1] = [1, 2, 3] # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: can't assign to ... (<doctest test.test_syntax[12]>, line 1)

>>> a if 1 else b = 1 # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: can't assign ... (<doctest test.test_syntax[13]>, line 1)

From compiler_complex_args():

>>> def f(None=1):
...     pass # doctest: +ELLIPSIS
Traceback (most recent call last):
SyntaxError: assignment to None... (<doctest test.test_syntax[14]>, line 1)


From ast_for_arguments():

>>> def f(x, y=1, z):
...     pass
Traceback (most recent call last):
SyntaxError: non-default argument follows default argument (<doctest test.test_syntax[15]>, line 1)

>>> def f(x, None):
...     pass # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: assignment to None... (<doctest test.test_syntax[16]>, line 1)

>>> def f(*None):
...     pass # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: assignment to None... (<doctest test.test_syntax[17]>, line 1)

>>> def f(**None):
...     pass # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: assignment to None... (<doctest test.test_syntax[18]>, line 1)


From ast_for_funcdef():

>>> def None(x):
...     pass # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: assignment to None... (<doctest test.test_syntax[19]>, line 1)


From ast_for_call():

>>> def f(it, *varargs):
...     return list(it)
>>> L = range(10)
>>> f(x for x in L)
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
>>> f(x for x in L, 1) # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: ... (<doctest test.test_syntax[23]>, line 1)
>>> f((x for x in L), 1)
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

>>> f(lambda x: x[0] = 3) # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: ... (<doctest test.test_syntax[25]>, line 1)

The grammar accepts any test (basically, any expression) in the
keyword slot of a call site.  Test a few different options.

>>> f(x()=2) # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: ... (<doctest test.test_syntax[26]>, line 1)
>>> f(a or b=1) # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: ... (<doctest test.test_syntax[27]>, line 1)
>>> f(x.y=1) # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: ... (<doctest test.test_syntax[28]>, line 1)


From ast_for_expr_stmt():

>>> (x for x in x) += 1 # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: augmented assign...generator expression not possible (<doctest test.test_syntax[29]>, line 1)
>>> None += 1 # doctest: +ELLIPSIS 
Traceback (most recent call last):
SyntaxError: assignment to None... (<doctest test.test_syntax[30]>, line 1)
>>> f() += 1
Traceback (most recent call last):
SyntaxError: illegal expression for augmented assignment (<doctest test.test_syntax[31]>, line 1)


Test continue in finally in weird combinations.

continue in for loop under finally shouuld be ok.

    >>> def test():
    ...     try:
    ...         pass
    ...     finally:
    ...         for abc in range(10):
    ...             continue
    ...     print abc
    >>> test()
    9

Start simple, a continue in a finally should not be allowed.

    >>> def test():
    ...    for abc in range(10):
    ...        try:
    ...            pass
    ...        finally:
    ...            continue
    ...
    Traceback (most recent call last):
      ...
    SyntaxError: 'continue' not supported inside 'finally' clause (<doctest test.test_syntax[34]>, line 6)

This is essentially a continue in a finally which should not be allowed.

    >>> def test():
    ...    for abc in range(10):
    ...        try:
    ...            pass
    ...        finally:
    ...            try:
    ...                continue
    ...            except:
    ...                pass
    Traceback (most recent call last):
      ...
    SyntaxError: 'continue' not supported inside 'finally' clause (<doctest test.test_syntax[35]>, line 7)

    >>> def foo():
    ...   try:
    ...     pass
    ...   finally:
    ...     continue
    Traceback (most recent call last):
      ...
    SyntaxError: 'continue' not supported inside 'finally' clause (<doctest test.test_syntax[36]>, line 5)

    >>> def foo():
    ...   for a in ():
    ...     try: pass
    ...     finally: continue
    Traceback (most recent call last):
      ...
    SyntaxError: 'continue' not supported inside 'finally' clause (<doctest test.test_syntax[37]>, line 4)

    >>> def foo():
    ...  for a in ():
    ...   try: pass
    ...   finally:
    ...    try:
    ...     continue
    ...    finally: pass
    Traceback (most recent call last):
      ...
    SyntaxError: 'continue' not supported inside 'finally' clause (<doctest test.test_syntax[38]>, line 6)

    >>> def foo():
    ...  for a in ():
    ...   try: pass
    ...   finally:
    ...    try:
    ...     pass
    ...    except:
    ...     continue
    Traceback (most recent call last):
      ...
    SyntaxError: 'continue' not supported inside 'finally' clause (<doctest test.test_syntax[39]>, line 8)

There is one test for a break that is not in a loop.  The compiler
uses a single data structure to keep track of try-finally and loops,
so we need to be sure that a break is actually inside a loop.  If it
isn't, there should be a syntax error.

   >>> try:
   ...     print 1
   ...     break
   ...     print 2
   ... finally:
   ...     print 3
   Traceback (most recent call last):
     ...
   SyntaxError: 'break' outside loop (<doctest test.test_syntax[40]>, line 3)

This tests assignment-context; there was a bug in Python 2.5 where compiling
a complex 'if' (one with 'elif') would fail to notice an invalid suite,
leading to spurious errors.

   >>> if 1:
   ...   x() = 1
   ... elif 1:
   ...   pass
   Traceback (most recent call last):
     ...
   SyntaxError: can't assign to function call (<doctest test.test_syntax[41]>, line 2)

   >>> if 1:
   ...   pass
   ... elif 1:
   ...   x() = 1
   Traceback (most recent call last):
     ...
   SyntaxError: can't assign to function call (<doctest test.test_syntax[42]>, line 4)

   >>> if 1:
   ...   x() = 1
   ... elif 1:
   ...   pass
   ... else:
   ...   pass
   Traceback (most recent call last):
     ...
   SyntaxError: can't assign to function call (<doctest test.test_syntax[43]>, line 2)

   >>> if 1:
   ...   pass
   ... elif 1:
   ...   x() = 1
   ... else:
   ...   pass
   Traceback (most recent call last):
     ...
   SyntaxError: can't assign to function call (<doctest test.test_syntax[44]>, line 4)

   >>> if 1:
   ...   pass
   ... elif 1:
   ...   pass
   ... else:
   ...   x() = 1
   Traceback (most recent call last):
     ...
   SyntaxError: can't assign to function call (<doctest test.test_syntax[45]>, line 6)

"""

import re
import unittest
import warnings

from test import test_support

class SyntaxTestCase(unittest.TestCase):

    def _check_error(self, code, errtext,
                     filename="<testcase>", mode="exec", subclass=None):
        """Check that compiling code raises SyntaxError with errtext.

        errtest is a regular expression that must be present in the
        test of the exception raised.  If subclass is specified it
        is the expected subclass of SyntaxError (e.g. IndentationError).
        """
        try:
            compile(code, filename, mode)
        except SyntaxError, err:
            if subclass and not isinstance(err, subclass):
                self.fail("SyntaxError is not a %s" % subclass.__name__)
            mo = re.search(errtext, str(err))
            if mo is None:
                self.fail("SyntaxError did not contain '%r'" % (errtext,))
        else:
            self.fail("compile() did not raise SyntaxError")

    def test_assign_call(self):
        self._check_error("f() = 1", "assign")

    def test_assign_del(self):
        self._check_error("del f()", "delete")

    def test_global_err_then_warn(self):
        # Bug tickler:  The SyntaxError raised for one global statement
        # shouldn't be clobbered by a SyntaxWarning issued for a later one.
        source = re.sub('(?m)^ *:', '', """\
            :def error(a):
            :    global a  # SyntaxError
            :def warning():
            :    b = 1
            :    global b  # SyntaxWarning
            :""")
        warnings.filterwarnings(action='ignore', category=SyntaxWarning)
        self._check_error(source, "global")
        warnings.filters.pop(0)

    def test_break_outside_loop(self):
        self._check_error("break", "outside loop")

    def test_delete_deref(self):
        source = re.sub('(?m)^ *:', '', """\
            :def foo(x):
            :  def bar():
            :    print x
            :  del x
            :""")
        self._check_error(source, "nested scope")

    def test_unexpected_indent(self):
        self._check_error("foo()\n bar()\n", "unexpected indent",
                          subclass=IndentationError)

    def test_no_indent(self):
        self._check_error("if 1:\nfoo()", "expected an indented block",
                          subclass=IndentationError)

    def test_bad_outdent(self):
        self._check_error("if 1:\n  foo()\n bar()",
                          "unindent does not match .* level",
                          subclass=IndentationError)

    def test_kwargs_last(self):
        self._check_error("int(base=10, '2')", "non-keyword arg")

def test_main():
    test_support.run_unittest(SyntaxTestCase)
    from test import test_syntax
    test_support.run_doctest(test_syntax, verbosity=True)

if __name__ == "__main__":
    test_main()
