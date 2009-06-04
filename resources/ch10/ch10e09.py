def myreplace(old, new, s):
    """
    Replace all occurances of old with new in the string s.

      >>> myreplace(',', ';', 'this, that, and, some, other, thing')
      'this; that; and; some; other; thing'
      >>> myreplace(' ', '**', 'Words will now be seperated by stars.')
      'Words**will**now**be**seperated**by**stars.'
    """
    return new.join(s.split(old))


if __name__ == '__main__':
    import doctest
    doctest.testmod()
