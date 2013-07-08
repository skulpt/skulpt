class SuperClass:
    def apply(self):
        return "SuperClass"
    
class SubClassA(SuperClass):
    def apply(self):
        return "SubClassA"
    

x = SubClassA()

print x.apply()

