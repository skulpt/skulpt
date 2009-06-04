prefixes = "JKLMNOPQ"
suffix = "ack"
   
for letter in prefixes:
    if letter in "OQ":
        letter += "u"
    print letter + suffix
