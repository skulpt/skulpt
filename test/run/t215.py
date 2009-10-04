wee = lambda waa, woo=False, wii=True: ("OK", waa, woo, wii)

print wee("stuff")
print wee("stuff", "dog")
print wee("stuff", "dog", "cat")
print wee("stuff", wii="lamma")
print wee(wii="lamma", waa="pocky")
print wee(wii="lamma", waa="pocky", woo="blorp")
