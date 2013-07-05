print set([]) == []
print set(["a"]) == ["a"]
print set(["a", "b"]) == ["a", "b"]
print set(["b", "a"]) == ["a", "b"]
print set(["a", "c", "b"]) == ["c", "b", "a"]

print set(['a']) == set(['a'])
