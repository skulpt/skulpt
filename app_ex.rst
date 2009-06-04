


Complete Python Listings
========================


Point class
-----------

.. sourcecode:: python

    
    class Point:
        def __init__(self, x=0, y=0):
            self.x = x
            self.y = y
     
        def __str__(self):
            return '(' + str(self.x) + ', ' + str(self.y) + ')'
     
        def __add__(self, other):
            return Point(self.x + other.x, self.y + other.y)
     
        def __sub__(self, other):
            return Point(self.x - other.x, self.y - other.y)
     
        def __mul__(self, other):
            return self.x * other.x + self.y * other.y
     
        def __rmul__(self, other):
            return Point(other * self.x, other * self.y)
     
        def reverse(self):
            self.x, self.y = self.y, self.x
     
    
    # front_and_back function
    
    def front_and_back(front):
        from copy import copy
        back = copy(front)
        back.reverse()
        print str(front) + str(back)



Time class
----------

.. sourcecode:: python

    
    class Time:
        def __init__(self, hours=0, minutes=0, seconds=0):
            self.hours = hours
            self.minutes = minutes
            self.seconds = seconds
     
        def __str__(self):
           return str(self.hours) + ":" + str(self.minutes) + ":" + str(self.seconds)
     
        def convert_to_seconds(self):
            minutes = self.hours * 60 + self.minutes
            seconds = self.minutes * 60 + self.seconds
            return seconds
     
        def increment(self, secs):
            secs = secs + self.seconds
     
            self.hours = self.hours + secs/3600
            secs = secs % 3600
            self.minutes = self.minutes + secs/60
            secs = secs % 60
            self.seconds = secs
     
        def make_time(secs):
            time = Time()
            time.hours = secs/3600
            secs = secs - time.hours * 3600
            time.minutes = secs/60
            secs = secs - time.minutes * 60
            time.seconds = secs
            return time



Cards, decks and games
----------------------

.. sourcecode:: python

    
    import random
       
    class Card:
        suits = ["Clubs", "Diamonds", "Hearts", "Spades"]
        ranks = ["narf", "Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10",
                 "Jack", "Queen", "King"]
       
        def __init__(self, suit=0, rank=0):
            self.suit = suit
            self.rank = rank
       
        def __str__(self):
            return self.ranks[self.rank] + " of " + self.suits[self.suit]
       
        def __cmp__(self, other):
            # check the suits
            if self.suit > other.suit: return 1
            if self.suit < other.suit: return -1
            # suits are the same... check ranks
            if self.rank > other.rank: return 1
            if self.rank < other.rank: return -1
            # ranks are the same... it's a tie
            return 0
       
    class Deck:
        def __init__(self):
            self.cards = []
            for suit in range(4):
                for rank in range(1, 14):
                    self.cards.append(Card(suit, rank))
     
        def __str__(self):
            s = ""
            for i in range(len(self.cards)):
                s = s + " "*i + str(self.cards[i]) + "\n"
            return s
     
        def shuffle(self):
            import random
            num_cards = len(self.cards)
            for i in range(num_cards):
                j = random.randrange(i, num_cards)
                [self.cards[i], self.cards[j]] = [self.cards[j], self.cards[i]]
     
        def remove(self, card):
            if card in self.cards:
                self.cards.remove(card)
                return True 
            else:
                return False
       
        def pop(self):
            return self.cards.pop()
     
        def is_empty(self):
            return (len(self.cards) == 0)
      
        def deal(self, hands, nCards=999):
            num_hands = len(hands)
            for i in range(nCards):
                if self.is_empty(): break    # break if out of cards
                card = self.pop()       # take the top card
                hand = hands[i % num_hands]    # whose turn is next?
                hand.add(card)          # add the card to the hand
       
    class Hand(Deck):
        def __init__(self, name=""):
            self.cards = []
            self.name = name
       
        def add(self,card):
            self.cards.append(card)
       
        def __str__(self):
            s = "Hand " + self.name
            if self.is_empty():
                s = s + " is empty\n"
            else:
                s = s + " contains\n"
            return s + Deck.__str__(self)
       
    class CardGame:
        def __init__(self):
            self.deck = Deck()
            self.deck.shuffle()
       
    class OldMaidHand(Hand):
        def remove_matches(self):
            count = 0
            original_cards = self.cards[:]
            for card in original_cards:
                match = Card(3 - card.suit, card.rank)
                if match in self.cards:
                    self.cards.remove(card)
                    self.cards.remove(match)
                    print "Hand %s: %s matches %s" % (self.name,card,match)
                    count = count+1
            return count
       
    class OldMaidGame(CardGame):
        def play(self, names):
            # remove Queen of Clubs
            self.deck.remove(Card(0,12))
       
            # make hands base on names passed
            self.hands = []
            for name in names : self.hands.append(OldMaidHand(name))
       
            # deal the cards
            self.deck.deal(self.hands)
            print "---------- Cards have been dealt"
            self.print_hands()
       
            # Remove initial matches
            matches = self.remove_matches()
            print "---------- Matches discarded, play begins"
            self.print_hands()
       
            # Play until all 50 cards matched
            turn = 0
            num_hands = len(self.hands)
            while matches < 25:
                matches = matches + self.play_one_turn(turn)
                turn = (turn + 1) % num_hands
       
            print "---------- Game is Over"
            self.print_hands ()
       
        def remove_matches(self):
            count = 0
            for hand in self.hands:
                count = count + hand.remove_matches()
            return count
       
        def play_one_turn(self, i):
            if self.hands[i].is_empty():
                return 0
            neighbor = self.find_neighbor(i)
            picked = self.hands[neighbor].pop()
            self.hands[i].add(picked)
            print "Hand", self.hands[i].name, "picked", picked
            count = self.hands[i].remove_matches()
            self.hands[i].shuffle()
            return count
       
        def find_neighbor(self, i):
            num_hands = len(self.hands)
            for next in range(1,num_hands):
                neighbor = (i + next) % num_hands
                if not self.hands[neighbor].is_empty():
                    return neighbor
       
        def print_hands(self):
            for hand in self.hands:
                print hand
    
    
    if __name__ == '__main__':
        game = OldMaidGame()
        game.play(["Allen", "Jeff", "Chris"])



Linked Lists
------------

.. sourcecode:: python

    
    def printList(node):
        while node:
            print node,
            node = node.next
        print
       
    def printBackward(list):
        if list == None: return
        head = list
        tail = list.next
        printBackward(tail)
        print head,
       
    def printBackwardNicely(list):
        print "(",
        if list != None:
            head = list
            tail = list.next
            printBackward(tail)
            print head,
        print ")",
       
    def removeSecond(list):
        if list == None: return
        first  = list
        second = list.next
        first.next = second.next
        second.next = None
        return second
       
    class Node:
        def __init__(self, cargo=None):
            self.cargo = cargo
            self.next  = None
     
        def __str__(self):
            return str(self.cargo)
     
        def printBackward(self):
            if self.next != None:
            tail = self.next
            tail.printBackward()
            print self.cargo,
     
    class LinkedList:
        def __init__(self):
            self.length = 0
            self.head   = None
     
        def printBackward(self):
            print "(",
            if self.head != None:
                self.head.printBackward()
            print ")",
     
        def addFirst(self, cargo):
            node = Node(cargo)
            node.next = self.head
            self.head = node
            self.length = self.length + 1



Stack class
-----------

.. sourcecode:: python

    
    class Stack:              # Python list implementation
        def __init__(self):
            self.items = []
     
        def push(self, item):
            self.items.append(item)
     
        def pop(self):
            return self.items.pop()
     
        def isEmpty(self):
            return(self.items == [])
     
        def evalPostfix(expr):
            import re
            expr = re.split("([^0-9])", expr)
            stack = Stack()
            for token in expr:
            if  token == '' or token == ' ':
                continue
            if  token == '+':
                sum = stack.pop() + stack.pop()
                stack.push(sum)
            elif token == '*':
                product = stack.pop() * stack.pop()
                stack.push(product)
            else:
                stack.push(int(token))
            return stack.pop()



Queues and priority queues
--------------------------

.. sourcecode:: python

    
    class Queue:
        def __init__(self):
            self.length = 0
            self.head   = None
     
        def empty(self):
            return (self.length == 0)
     
        def insert(self, cargo):
            node = Node(cargo)
            node.next = None
            if self.head == None:
                # If list is empty our new node is first
                self.head = node
            else:
                # Find the last node in the list
                last = self.head
                while last.next: last = last.next
            # Append our new node
            last.next = node
            self.length = self.length + 1
     
        def remove(self):
            cargo = self.head.cargo
            self.head = self.head.next
            self.length = self.length - 1
            return cargo
     
    class ImprovedQueue:
        def __init__(self):
            self.length = 0
            self.head   = None
            self.last   = None
     
        def empty(self) :
            return (self.length == 0)
    
        def insert(self, cargo):
            node = Node(cargo)
            node.next = None
            if self.length == 0:
                # If list is empty our new node is first
                self.head = self.last = node
            else:
                # Find the last node in the list
                last = self.last
            # Append our new node
            last.next = node
            self.last = node
            self.length = self.length + 1
     
        def remove(self):
            cargo       = self.head.cargo
            self.head   = self.head.next
            self.length = self.length - 1
            if self.length == 0: self.last = None
            return cargo
     
    class PriorityQueue:
        def __init__(self):
            self.items = []
     
        def empty(self):
            return self.items == []
     
        def insert(self, item):
            self.items.append(item)
     
        def remove(self):
            maxi = 0
            for i in range(1,len(self.items)):
            if self.items[i] > self.items[maxi]:
                maxi = i
                item = self.items[maxi]
                self.items[maxi:maxi+1] = []
            return item
    
    class Golfer:
        def __init__(self, name, score):
            self.name = name
            self.score= score
     
        def __str__(self):
            return "%-15s: %d" % (self.name, self.score)
    
        def __cmp__(self, other):
            if self.score < other.score : return  1   # less is more
            if self.score > other.score : return -1
            return 0



Trees
-----

.. sourcecode:: python

    
    class Tree:
        def __init__(self, cargo, left=None, right=None):
            self.cargo = cargo
            self.left  = left
            self.right = right
     
        def __str__(self):
            return str(self.cargo)
     
        def total(tree):
            if tree == None: return 0
            return total(tree.left) + total(tree.right) + tree.cargo
     
        def printTree(tree):
            if tree == None: return
            print tree.cargo,
            printTree(tree.left)
            printTree(tree.right)
     
        def printTreePostorder(tree):
            if tree == None: return
            printTreePostorder(tree.left)
            printTreePostorder(tree.right)
            print tree.cargo,
     
        def printTreeInorder(tree):
            if tree == None: return
            printTreeInorder(tree.left)
            print tree.cargo,
            printTreeInorder(tree.right)
     
        def printTreeIndented(tree, level=0):
            if tree == None: return
            printTreeIndented(tree.right, level+1)
            print '  '*level + str(tree.cargo)
            printTreeIndented(tree.left, level+1)



Expression trees
----------------

.. sourcecode:: python

    
    def getToken(tokenList, expected):
        if tokenList[0] == expected:
            tokenList[0:1] = []   # remove the token
            return 1
        else:
            return 0
     
    def getProduct(tokenList):
        a = getNumber(tokenList)
        if getToken(tokenList, '*'):
            b = getProduct(tokenList)
            return Tree('*', a, b)
        else:
            return a
     
    def getSum(tokenList) :
        a = getProduct(tokenList)
        if getToken(tokenList, '+'):
            b = getSum(tokenList)
            return Tree('+', a, b)
        else:
            return a
     
    def getNumber(tokenList):
        if getToken(tokenList, '('):
            x = getSum(tokenList)       # get subexpression
            getToken(tokenList, ')')    # eat the closing parenthesis
            return x
        else:
            x = tokenList[0]
            if type(x) != type(0): return None
            tokenList[0:1] = []     # remove the token
        return Tree(x, None, None)  # return a leaf with the number



Guess the animal
----------------

.. sourcecode:: python

    
    def yes(ques):
        ans = raw_input(ques).lower()
        return ans[0] == 'y'
    
    def animal():
        # start with a singleton
        root = Tree("bird")
    
        # loop until the user quits
        while True:
            print
            if not yes("Are you thinking of an animal? "): break
    
            # walk the tree
            tree = root
            while tree.left != None:
                prompt = tree.cargo + "? "
                if yes(prompt):
                    tree = tree.right
                else:
                    tree = tree.left
    
            # make a guess
            guess = tree.cargo
            prompt = "Is it a " + guess + "? "
            if yes(prompt):
                print "I rule!"
                continue
    
            # get new information
            prompt  = "What is the animal's name? "
            animal  = raw_input(prompt)
            prompt  = "What question would distinguish a %s from a %s? "
            question = raw_input(prompt % (animal, guess))
    
            # add new information to the tree
            tree.cargo = question
            prompt = "If the animal were %s the answer would be? "
            if yes(prompt % animal):
                tree.left = Tree(guess)
                tree.right = Tree(animal)
            else:
                tree.left = Tree(animal)
                tree.right = Tree(guess)



`Fraction` class
----------------

.. sourcecode:: python

    
    class Fraction:
        def __init__(self, numerator, denominator=1):
            g = gcd(numerator, denominator)
            self.numerator   = numerator   / g
            self.denominator = denominator / g
     
        def __mul__(self, object):
            if type(object) == type(5):
                object = Fraction(object)
                return Fraction(self.numerator*object.numerator,
                                self.denominator*object.denominator)
     
        __rmul__ = __mul__
     
        def __add__(self, object):
            if type(object) == type(5):
                object = Fraction(object)
     
            return Fraction(self.numerator*object.denominator +
                            self.denominator*object.numerator,
                            self.denominator * object.denominator)
     
        __radd__ = __add__
     
        def __cmp__(self, object):
            if type(object) == type(5):
                object = Fraction(object)
     
            diff = (self.numerator*object.denominator -
                    object.numerator*self.denominator)
            return diff
     
        def __repr__(self):
            return self.__str__()
     
        def __str__(self):
            return "%d/%d" % (self.numerator, self.denominator)
     
        def gcd(m,n):
            "return the greatest common divisor of 2 integer arguments"
            if m % n == 0:
                return n
            else:
                return gcd(n,m%n)



