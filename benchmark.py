branch = 'Cpython'
benchmark = {'assignment': {'this_branch': 167, 'Cpython': 9, 'master': 1590, 'brython': 6}, 'augm_assign': {'this_branch': 216, 'Cpython': 19, 'master': 2956, 'brython': 12}, 'assign_float': {'this_branch': 172, 'Cpython': 13, 'master': 1704, 'brython': 24}, 'build_dict': {'this_branch': 337, 'Cpython': 27, 'master': 2864, 'brython': 79}, 'set_dict_item': {'this_branch': 296, 'Cpython': 16, 'master': 2728, 'brython': 26}, 'set_dict_item_str': {'Cpython': 14, 'this_branch': 274, 'brython': 46}, 'build_list': {'this_branch': 304, 'Cpython': 17, 'master': 1915, 'brython': 15}, 'set_list_item': {'this_branch': 325, 'Cpython': 14, 'master': 2184, 'brython': 17}, 'get_list_slice': {'Cpython': 27, 'this_branch': 453, 'brython': 9701}, 'add_integers': {'this_branch': 354, 'Cpython': 28, 'master': 3987, 'brython': 22}, 'add_strings': {'this_branch': 463, 'Cpython': 37, 'master': 5349, 'brython': 37}, 'add_int_float': {'Cpython': 21, 'this_branch': 417, 'brython': 99}, 'compare_int_int': {'Cpython': 22, 'this_branch': 398, 'brython': 10}, 'compare_int_float': {'Cpython': 15, 'this_branch': 454, 'brython': 32}, 'str_of_int': {'this_branch': 86, 'Cpython': 5, 'master': 759, 'brython': 6}, 'create_function': {'this_branch': 503, 'Cpython': 23, 'master': 3032, 'brython': 319}, 'function_call': {'this_branch': 502, 'Cpython': 27, 'master': 2692, 'brython': 230}, 'create_class': {'Cpython': 123, 'this_branch': 807, 'brython': 726}, 'descr_class': {'Cpython': 13, 'this_branch': 487, 'brython': 29}, 'get_class_attr': {'Cpython': 13, 'this_branch': 564, 'brython': 55}, 'init_class': {'Cpython': 54, 'this_branch': 837, 'brython': 776}, 'set_instance_attr': {'Cpython': 19, 'this_branch': 595, 'brython': 59}, 'Total': {'this_branch': 9022, 'Cpython': 567, 'master': 31768, 'brython': 12351}}



tests = [
    "assignment",
    "augm_assign",
    "assign_float",
    "build_dict",
    "set_dict_item",
    "set_dict_item_str",
    "build_list",
    "set_list_item",
    "get_list_slice",
    "add_integers",
    "add_strings",
    "add_int_float",
    "compare_int_int",
    "compare_int_float",
    "str_of_int",
    "create_function",
    "function_call",
    "create_class",
    "descr_class",
    "get_class_attr",
    "init_class",
    "set_instance_attr",
    "Total",
]
tmp = {}
for test in tests:
    tmp[test] = benchmark.get(test, {})
benchmark = tmp

import time

tstart = time.time()

t0 = time.time()
for i in range(100000):
    a = 1
benchmark['assignment'][branch] = int(1000*(time.time()-t0))

t0 = time.time()
a = 0
for i in range(100000):
    a += 1
benchmark['augm_assign'][branch] = int(1000*(time.time()-t0))



t0 = time.time()
for i in range(100000):
    a = 1.0
benchmark['assign_float'][branch] = int(1000*(time.time()-t0))


t0 = time.time()
for i in range(100000):
    a = {0:0}
benchmark['build_dict'][branch] = int(1000*(time.time()-t0))

t0 = time.time()
a = {0:0}

for i in range(100000):
    a[0] = i

assert a[0]==99999
benchmark['set_dict_item'][branch] = int(1000*(time.time()-t0))

t0 = time.time()
a = {'foo':'bar'}

for i in range(100000):
    a['foo'] = 'bar'

benchmark['set_dict_item_str'][branch] = int(1000*(time.time()-t0))


t0 = time.time()
for i in range(100000):
    a = [1, 2, 3]
benchmark['build_list'][branch] = int(1000*(time.time()-t0))


t0 = time.time()
a = [0]

for i in range(100000):
    a[0] = i
benchmark['set_list_item'][branch] = int(1000*(time.time()-t0))

t0 = time.time()
a = [1,2,3]

for i in range(100000):
    a = a[:]
benchmark['get_list_slice'][branch] = int(1000*(time.time()-t0))



t0 = time.time()
a, b, c = 1, 2, 3
for i in range(100000):
    a + b + c
benchmark['add_integers'][branch] = int(1000*(time.time()-t0))


t0 = time.time()
a, b, c = 'a', 'b', 'c'
for i in range(100000):
    a + b + c
benchmark['add_strings'][branch] = int(1000*(time.time()-t0))

t0 = time.time()
a, b, c = 1, 2.0, 3.5
for i in range(100000):
    a + b + c
benchmark['add_int_float'][branch] = int(1000*(time.time()-t0))

t0 = time.time()
a, b = 1, 2
for i in range(100000):
    a < b 
benchmark['compare_int_int'][branch] = int(1000*(time.time()-t0))

t0 = time.time()
a, b = 1, 2.3
for i in range(100000):
    a < b 
benchmark['compare_int_float'][branch] = int(1000*(time.time()-t0))

t0 = time.time()
for _i in range(10000):
    str(_i)
benchmark['str_of_int'][branch] = int(1000*(time.time()-t0))


t0 = time.time()
for i in range(100000):
    def f():
        pass
benchmark['create_function'][branch] = int(1000*(time.time()-t0))


t0 = time.time()
def f(x):
    return x
for i in range(100000):
    f(i)
benchmark['function_call'][branch] = int(1000*(time.time()-t0))



t0 = time.time()
for i in range(10000):
    class A: 
        def __init__(self, foo):
            self.foo = 'bar'
        def eggs(self):
            return 'spam'
benchmark['create_class'][branch] = int(1000*(time.time()-t0))


class A: 
    def __init__(self, foo):
        self.foo = foo
    def eggs(self):
        return 'spam'

t0 = time.time()
for i in range(100000):
    A('bar')
benchmark['init_class'][branch] = int(1000*(time.time()-t0))

t0 = time.time()
for i in range(100000):
    A.__class__
benchmark['descr_class'][branch] = int(1000*(time.time()-t0))

t0 = time.time()
for i in range(100000):
    A.eggs
benchmark['get_class_attr'][branch] = int(1000*(time.time()-t0))


t0 = time.time()
a = A('bar')
for i in range(100000):
    a.foo = 'bar'
benchmark['set_instance_attr'][branch] = int(1000*(time.time()-t0))



benchmark['Total'][branch] = int(1000*(time.time()-tstart))


branches = ['master', 'this_branch', 'Cpython', 'brython']
headers = f"{'Test':>18}|" + '|'.join(f"{branch:>14}" for branch in branches)
rows = []
for test, performance in list(benchmark.items())[:-1]:
    row = f"{test:>18}|" + '|'.join(f"{str(performance.get(branch)) + 'ms':>14}" for branch in branches)
    rows.append(row)

performance = benchmark['Total']
total = f"{'Total':>18}|" +'|'.join(f"{str(performance.get(branch)) + 'ms':>14}" for branch in branches)


print('## BenchMarks ##')
print(headers)
print('='*18 + "|" + '|'.join(['='*14]*len(list(branches))))
print('\n'.join(rows))
print('='*18 + "|" + '|'.join(['='*14]*len(list(branches))))
print(total)



print()
print()

print(f'benchmark = {benchmark}')
print()
print(f'Execution Time Including Print = {int(1000*(time.time()-tstart))}')