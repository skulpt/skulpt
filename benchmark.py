branch = '_branch'
branches = ['master', '_branch', 'this_branch', 'Cpython', 'brython', 'brython_chrome']



benchmark = {'range_no_ops': {'Cpython': 5, 'brython_chrome': 141, 'brython': 5}, 'assignment': {'this_branch': 178, 'Cpython': 12, 'master': 234, 'brython_chrome': 170, 'brython': 6}, 'augm_assign': {'this_branch': 242, 'Cpython': 24, 'master': 396, 'brython_chrome': 388, 'brython': 12}, 'assign_float': {'this_branch': 179, 'Cpython': 9, 'master': 217, 'brython_chrome': 210, 'brython': 16}, 'build_dict': {'this_branch': 324, 'Cpython': 20, 'master': 566, 'brython_chrome': 371, 'brython': 65}, 'set_dict_item': {'this_branch': 352, 'Cpython': 21, 'master': 443, 'brython_chrome': 319, 'brython': 26}, 'set_dict_item_str': {'this_branch': 276, 'Cpython': 17, 'master': 331, 'brython_chrome': 332, 'brython': 46}, 'build_list': {'this_branch': 297, 'Cpython': 28, 'master': 377, 'brython_chrome': 180, 'brython': 15}, 'set_list_item': {'this_branch': 381, 'Cpython': 17, 'master': 390, 'brython_chrome': 272, 'brython': 16}, 'get_list_slice': {'this_branch': 459, 'Cpython': 28, 'master': 1122, 'brython_chrome': 14846, 'brython': 10789}, 'add_integers': {'this_branch': 400, 'Cpython': 23, 'master': 669, 'brython_chrome': 234, 'brython': 26}, 'add_strings': {'this_branch': 468, 'Cpython': 31, 'master': 711, 'brython_chrome': 225, 'brython': 42}, 'add_int_float': {'this_branch': 420, 'Cpython': 28, 'master': 674, 'brython_chrome': 279, 'brython': 103}, 'compare_int_int': {'this_branch': 400, 'Cpython': 14, 'master': 599, 'brython_chrome': 258, 'brython': 11}, 'compare_int_float': {'this_branch': 448, 'Cpython': 19, 'master': 634, 'brython_chrome': 401, 'brython': 32}, 'str_of_int': {'this_branch': 83, 'Cpython': 3, 'master': 115, 'brython_chrome': 52, 'brython': 6}, 'create_function': {'this_branch': 475, 'Cpython': 18, 'master': 564, 'brython_chrome': 524, 'brython': 347}, 'function_call': {'this_branch': 511, 'Cpython': 19, 'master': 560, 'brython_chrome': 996, 'brython': 286}, 'create_class': {'this_branch': 863, 'Cpython': 130, 'master': 875, 'brython_chrome': 907, 'brython': 946}, 'descr_class': {'this_branch': 526, 'Cpython': 9, 'master': 610, 'brython_chrome': 325, 'brython': 34}, 'get_class_attr': {'this_branch': 538, 'Cpython': 13, 'master': 653, 'brython_chrome': 496, 'brython': 70}, 'init_class': {'this_branch': 881, 'Cpython': 48, 'master': 1679, 'brython_chrome': 1283, 'brython': 718}, 'set_instance_attr': {'this_branch': 531, 'Cpython': 16, 'master': 990, 'brython_chrome': 576, 'brython': 56}, 'Total': {'this_branch': 9245, 'Cpython': 564, 'master': 13426, 'brython_chrome': 23807, 'brython': 13703}, 'fields': {'Cpython': 255, 'master': 4500, 'this_branch': 1982, 'brython_chrome': 23685, 'brython': 17996}}




tests = [
    "range_no_ops",
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
    "fields",
]
tmp = {}
for test in tests:
    tmp[test] = benchmark.get(test, {})
benchmark = tmp

import time

tstart = time.time()

t0 = time.time()
for i in range(100000):
    pass
benchmark['range_no_ops'][branch] = int(1000*(time.time()-t0))

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

import time
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


# Field
# Mike

import math
import random
import time

SCW,SCH = 900,250

# helper fn
def distance(p1, p2):
    return math.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)


class Vec:
    def __init__(self, x, y, pos=[0,0]):
        self.position = pos
        self.mag = distance([x,y],[0,0])
        self.normal = self.normalized(x,y)
        self.wid = SCH*0.035
    def __str__(self):
        return "Position:%s\nMagnitude:%s\nNormal:%s\nVec:%s\n"%(self.position, self.mag, self.normal, self.get_vec())
    def vec_head(self):
        return [self.position[0]+self.normal[0]*self.mag,
                self.position[1]+self.normal[1]*self.mag]
    def dot(self,other):
        return self.normal[0]*other[0]+self.normal[1]*other[1]
    def get_vec(self):
        h = self.vec_head()
        return [h[0]-self.position[0], h[1]-self.position[1]]
    def normalized(self, x, y):
        return [x/self.mag, y/self.mag]
    def rotate(self, ang):
        new_ang = ang + math.atan2(self.normal[1],self.normal[0])
        self.normal = [math.cos(new_ang), math.sin(new_ang)]
    def draw(self):
        r = int(distance(self.position, b.position))
        col = (255*r/400)


class Vec2:
    def __init__(self, x, y, pos=[0,0]):
        self.position = pos
        self.head = [x,y]
    def magnitude(self):
        return max(distance(self.head,self.position),.000000001)
    def normal(self):
        v = [self.head[0]-self.position[0], self.head[1]-self.position[1]]
        m = self.magnitude()
        return [v[0]/m, v[1]/m]

a = []
for y in range(0,SCH,int(SCH*.06)+2):
    for x in range(0,SCW,int(SCW*.06)+2):
        a.append(Vec(35,0,[x,y]))

b = Vec(5.2,5.5,[50,50])

c = Vec2(b.position[0],b.position[1], a[0].position)
c.head = b.position

def update():
    #draw field
    [pt.draw() for pt in a]
    #update rotations
    for pt in a:
        c.position = pt.position
        d = 900/c.magnitude()**2
        cn = c.normal()
        theta = pt.dot([cn[1], -cn[0]])
        pt.rotate(d*theta)
    #update ball
    b.position[0] = min(max(b.position[0]+b.normal[0]*b.mag,0),SCW)
    b.position[1] = min(max(b.position[1]+b.normal[1]*b.mag,0),SCH)
    if b.position[0] == 0 or b.position[0] == SCW:
        b.normal[0] = -b.normal[0]
    if b.position[1] == 0 or b.position[1] == SCH:
        b.normal[1] = -b.normal[1]



TICKS = 100
start = time.time()
for i in range(TICKS):
    update()
end = time.time()
duration = end - start
print("time elapsed:", duration)



benchmark['fields'][branch] = int(1000*(time.time()-t0))







headers = f"{'Test':>18}|" + '|'.join(f"{branch:>14}" for branch in branches)
rows = []
for test, performance in list(benchmark.items())[:-2]:
    row = f"{test:>18}|" + '|'.join(f"{str(performance.get(branch)) + 'ms':>14}" for branch in branches)
    rows.append(row)

performance = benchmark['Total']
total = f"{'Total':>18}|" +'|'.join(f"{str(performance.get(branch)) + 'ms':>14}" for branch in branches)
performance = benchmark['fields']
fields = f"{'fields.py':>18}|" +'|'.join(f"{str(performance.get(branch)) + 'ms':>14}" for branch in branches)
sep = '='*18 + "|" + '|'.join(['='*14]*len(list(branches)))

print('## BenchMarks ##')
print(headers)
print(sep)
print('\n'.join(rows))
print(sep)
print(total)
print(sep)
print(fields)


print()
print()

print(f'benchmark = {benchmark}')
print()
print(f'Execution Time Including Print = {int(1000*(time.time()-tstart))}')