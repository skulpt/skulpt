import string
from wordtools import *

infile = open('alice_in_wonderland.txt', 'r')
text = infile.read()
infile.close()

wordlist = extract_words(text)
words = wordset(wordlist)

wordcounts = []

for word in words:
    wordcounts.append(wordcount(word, wordlist))

outfile = open('alice_words.txt', 'w')
outfile.write("%-18s%s\n" % ("Word", "Count"))
outfile.write("=======================\n")

for word in wordcounts:
    if word[0] and word[0][0] in string.ascii_letters:
        outfile.write("%-18s%d\n" % (word[0], word[1]))

outfile.close()
