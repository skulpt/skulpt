from gasp import *

number = random_between(0, 1000)
guesses = 1
guess = input("Guess the number between 0 and 1000: ")

while guess != number:
    if guess > number:
        print "Too high!"
    else:
        print "Too low!"
    guess = input("Guess the number between 0 and 1000: ")
    guesses += 1

print "\n\nCongratulations, you got it in %d guesses!\n\n" % guesses
