import re

print re.findall("^\s*$", "")
print re.findall("\s*|a", "   a  b")
print re.findall("a|\s*", "   a  b")
print re.findall("\s*|a", "   ba  b")
print re.findall("a|\s*", "   ba  b")
