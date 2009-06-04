from gasp import *

number = random_between(0, 1000)
guesses = 0

while True: 
    guess = input("Guess the number between 0 and 1000: ")
    guesses += 1
    if guess > number:
        print "Too high!"
    elif guess < number:
        print "Too low!"
    else:
        print "\n\nCongratulations, you got it in %d guesses!\n\n" % guesses
        break
