import re

pattern = r"\n"

print re.findall(pattern, "\n")

print re.findall(pattern, "\n\n")

print re.findall(pattern, "x\nx")

print re.findall(pattern, "x\nx\n")

pattern = r"\t"

print re.findall(pattern, "\t")

print re.findall(pattern, "\t\t")

print re.findall(pattern, "x\tx")

print re.findall(pattern, "x\tx\t")
