import math as module



module = int
meth = type(str.count) 
for x in module.__dict__: 
    bltin = getattr(module, x) 
    if isinstance(bltin, meth): 
            print(\
f"{x}: {'{'}\n"
f"\t$meth: methods.{x},\n" 
f"\t$flags:{'{}'},\n"
f"\t$textsig: { bltin.__text_signature__.__repr__() if bltin.__text_signature__ != None else 'null' },\n"
f"\t$doc: \"{bltin.__doc__.__repr__()[1:-1]}\" {'}' },")


sw = type(property.__repr__)
this = list
other = tuple

for x in this.__dict__.keys() - other.__dict__.keys():
    bltin = getattr(this, x)
    if isinstance(bltin, sw):
       print(\
f"slots.{x} = {'{'}\n"
f"\t$name: \"{x}\",\n" 
f"\t$slot_func: function () {'{ }'},\n" 
f"\t$wrapper: function {x} () {'{ }'},\n"
f"\t$flags: {'{ }'},\n"
f"\t$textsig: \"{ bltin.__text_signature__.__repr__()[1:-1] }\",\n"
f"\t$doc: \"{bltin.__doc__.__repr__()[1:-1]}\",\n" 
f"{'};'}")





branch = 'this_branch'
benchmark = {'assignment': {'this_branch': 1659, 'Cpython': 99, 'brython': 59}, 'augm_assign': {'this_branch': 1334, 'Cpython': 209, 'brython': 124}, 'assign_float': {'this_branch': 1163, 'Cpython': 98, 'brython': 175}, 'build_dict': {'this_branch': 1794, 'Cpython': 209, 'brython': 696}, 'set_dict_item': {'this_branch': 2222, 'Cpython': 176, 'brython': 226}, 'build_list': {'this_branch': 1343, 'Cpython': 182, 'brython': 118}, 'set_list_item': {'this_branch': 1399, 'Cpython': 184, 'brython': 138}, 'add_integers': {'this_branch': 1513, 'Cpython': 233, 'brython': 352}, 'add_strings': {'this_branch': 1900, 'Cpython': 328, 'brython': 367}, 'str_of_int': {'this_branch': 478, 'Cpython': 48, 'brython': 41}, 'create_function': {'this_branch': 1833, 'Cpython': 211, 'brython': 965}, 'function_call': {'this_branch': 1817, 'Cpython': 223, 'brython': 1641}, 'Total': {'Cpython': 2205, 'this_branch': 18459, 'brython': 4914}}



import time

tstart = time.time()

t0 = time.time()
for i in range(1000000):
    a = 1
benchmark['assignment'][branch] = int(1000*(time.time()-t0))

t0 = time.time()
a = 0
for i in range(1000000):
    a += 1
benchmark['augm_assign'][branch] = int(1000*(time.time()-t0))



t0 = time.time()
for i in range(1000000):
    a = 1.0
benchmark['assign_float'][branch] = int(1000*(time.time()-t0))


t0 = time.time()
for i in range(1000000):
    a = {0:0}
benchmark['build_dict'][branch] = int(1000*(time.time()-t0))

t0 = time.time()
a = {0:0}

for i in range(1000000):
    a[0] = i

assert a[0]==999999
benchmark['set_dict_item'][branch] = int(1000*(time.time()-t0))


t0 = time.time()
for i in range(1000000):
    a = [1, 2, 3]
benchmark['build_list'][branch] = int(1000*(time.time()-t0))


t0 = time.time()
a = [0]

for i in range(1000000):
    a[0] = i
benchmark['set_list_item'][branch] = int(1000*(time.time()-t0))


t0 = time.time()
a, b, c = 1, 2, 3
for i in range(1000000):
    a + b + c
benchmark['add_integers'][branch] = int(1000*(time.time()-t0))


t0 = time.time()
a, b, c = 'a', 'b', 'c'
for i in range(1000000):
    a + b + c
benchmark['add_strings'][branch] = int(1000*(time.time()-t0))


t0 = time.time()
for _i in range(100000):
    str(_i)
benchmark['str_of_int'][branch] = int(1000*(time.time()-t0))


t0 = time.time()
for i in range(1000000):
    def f():
        pass
benchmark['create_function'][branch] = int(1000*(time.time()-t0))


t0 = time.time()
def f(x):
    return x
for i in range(1000000):
    f(i)
benchmark['function_call'][branch] = int(1000*(time.time()-t0))

benchmark['Total'][branch] = int(1000*(time.time()-tstart))


branches = benchmark['assignment'].keys()
headers = f"{'Test':>16} |" + ''.join(f"{branch:>14} |" for branch in branches)
rows = []
for test, performance in list(benchmark.items())[:-1]:
    row = f"{test:>16} |"

    for branch in branches:
       row += f"{str(performance[branch]) + 'ms':>14} |"
    rows.append(row)

performance = benchmark['Total']
total = f"{'Total':>16} |" +''.join(f"{str(performance.get(branch)) + 'ms':>14} |" for branch in branches)


print('## BenchMarks ##')
print(headers)
print('='*17 + "|" + '|'.join(['='*15]*len(list(branches))))
print('\n'.join(rows))
print('='*17 + "|" + '|'.join(['='*15]*len(list(branches))))
print(total)



print()
print()

print(f'benchmark = {benchmark}')
print()
print(f'Execution Time Including Print = {int(1000*(time.time()-tstart))}')