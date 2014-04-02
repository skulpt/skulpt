class Comparable:    
    def __init__(self,value):
        self.value = value
 
    def __lt__(self,other):
        return self.value < other.value
 
    def __repr__(self):
        return "Value :" + str(self.value)
 
 
lst = [5,9,2,7]
otherLst = [Comparable(a) for a in lst]
 
 
print lst
print otherLst
 
print min(lst)
print min(otherLst)
