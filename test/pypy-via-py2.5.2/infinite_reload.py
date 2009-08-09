# For testing http://python.org/sf/742342, which reports that Python
#  segfaults (infinite recursion in C) in the presence of infinite
#  reload()ing. This module is imported by test_import.py:test_infinite_reload
#  to make sure this doesn't happen any more.

print 1
import infinite_reload
print 2
reload(infinite_reload)
print 3
