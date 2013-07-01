import re

val = re.findall("From","dlkjdsljkdlkdsjlk")
print val
if len(val) == 0 : print "Correct 1"
else : print "InCorrect 1"

val = re.findall("From","dlkjd From kdsjlk")
print val
if len(val) == 1 : print "Correct 2"
else : print "InCorrect 2"

val = re.findall("From","From dlkjd From kdsjlk")
print val
if len(val) == 2 : print "Correct 3"
else : print "InCorrect 3"

val = re.findall("[0-9]+/[0-9]+","1/2 1/3 3/4 1/8 fred 10/0")
print val
if len(val) == 5 : print "Correct 4"
else : print "InCorrect 4"

# Won't work because JS match does not deal with ()
# print re.findall("From .*@(\\S*)","From csev@umich.edu Sat 09:25:14")

# These return either None or a trivial MatchObject with no methods

val = re.search("From","dlkjdsljkdlkdsjlk")
if val is None: print "Correct 5"
else : print "InCorrect 5",val

val = re.search("From","dlkjd From kdsjlk")
if val is not None: print "Correct 6"
else : print "InCorrect 6",val

val =  re.search("From","From dlkjd From kdsjlk")
if val is not None: print "Correct 7"
else : print "InCorrect 7",val

val = re.match("From","dlkjdsljkdlkdsjlk")
if val is None: print "Correct 8"
else : print "InCorrect 8",val

val = re.match("From","dlkjd From kdsjlk")
if val is None: print "Correct 9"
else : print "InCorrect 9",val

val = re.match("From","From dlkjd From kdsjlk")
if val is not None: print "Correct 10"
else : print "InCorrect 10",val

