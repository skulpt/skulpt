import re

print re.split("\W+", "Words, words, words.")
print re.split("(\W+)", "Words, words, words.")
print re.split("\W+", "Words, words, words.", 1)
print re.split('[a-f]+', '0a3B9', 0, re.IGNORECASE)
print re.split("(\W+)", '...words, words...')
print re.split('x*', 'foo')
#print re.split("(?m)^$", "foo\n\nbar\n")

print re.findall('\w+', "Words, words, words.")
print re.findall('(abc)(def)', 'abcdef')
print re.findall('(abc)(def)', 'abcdefabcdefjaabcdef3sabc')
print re.findall('(abc)', 'abcdef')
print re.findall('(abc)|(def)', 'abcdefabcdefjaabcdef3sabc')

