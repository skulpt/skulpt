import re

print re.findall("[a-z]*ei[a-z]*", "Is Dr. Greiner your friend, Julie?", re.IGNORECASE)
print re.findall("[a-z]*(ei|ie)[a-z]*", "Is Dr. Greiner your friend, Julie?", re.IGNORECASE)
print re.findall("[a-z]*(ei|ie)([a-z]*)", "Is Dr. Greiner your friend, Julie?", re.IGNORECASE)
print re.findall("[a-z]*(?:ei|ie)[a-z]*", "Is Dr. Greiner your friend, Julie?", re.IGNORECASE)
