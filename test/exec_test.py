a = 3
dummy_space = {'a': 5}
assert callable(execf)
execf('a=6', dummy_space)
assert a == 3, 'Make sure that the actual a is unchanged from 3'
assert dummy_space['a'] != 5, 'Make sure that the dummy a was not left at 5'
assert dummy_space['a'] == 6, 'Make sure that the dummy a is changed to 6'
print("All done")