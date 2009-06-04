def find(strng, ch, index=0, step=1):
    while index < len(strng):
        if strng[index] == ch:
            return index
        index += step 
    return -1


def count_letters(word, ch):
    count = 0
    index = find(word, ch)
    while index != -1: 
        count += 1
        index = find(word, ch, index + 1)
    return count

print count_letters('Yorktown', 'o')
print count_letters('Yorktown', 'w')
print count_letters('Yorktown', 'x')

