## test string module ##

import string

print string.ascii_lowercase
print string.ascii_uppercase
print string.ascii_letters

print string.lowercase
print string.uppercase
print string.letters

print string.digits
print string.hexdigits
print string.octdigits

print string.punctuation
print string.whitespace

print string.printable

s = "I frequently eat pizza; however, I don't particularly like it"
print string.split(s)
print string.split(s, ';')

s = "capitalize"
print string.capitalize(s)
s = "Capitalize"
print string.capitalize(s)

l = ["this", "will", "become", "a", "sentence"]
print string.join(l)
print string.join(l, "_")

s = "i frequently eat pizza; however, i don't particularly like it"
print string.capwords(s)
print string.capwords(s, '; ')
