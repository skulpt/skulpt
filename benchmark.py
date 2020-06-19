branch = 'this_branch'
branches = ['master', 'this_branch', 'Cpython', 'brython', 'brython_chrome']


benchmark = {'range_no_ops': {'Cpython': 5, 'brython_chrome': 141, 'brython': 5, 'this_branch': 133, 'master': 167}, 'assignment': {'Cpython': 12, 'brython_chrome': 170, 'brython': 6, 'this_branch': 173, 'master': 223}, 'augm_assign': {'Cpython': 24, 'brython_chrome': 388, 'brython': 12, 'this_branch': 230, 'master': 396}, 'assign_float': {'Cpython': 9, 'brython_chrome': 210, 'brython': 16, 'this_branch': 175, 'master': 251}, 'build_dict': {'Cpython': 20, 'brython_chrome': 371, 'brython': 65, 'this_branch': 408, 'master': 489}, 'set_dict_item': {'Cpython': 21, 'brython_chrome': 319, 'brython': 26, 'this_branch': 262, 'master': 413}, 'set_dict_item_str': {'Cpython': 17, 'brython_chrome': 332, 'brython': 46, 'this_branch': 287, 'master': 355}, 'build_list': {'Cpython': 28, 'brython_chrome': 180, 'brython': 15, 'this_branch': 309, 'master': 369}, 'set_list_item': {'Cpython': 17, 'brython_chrome': 272, 'brython': 16, 'this_branch': 315, 'master': 381}, 'get_list_slice': {'Cpython': 28, 'brython_chrome': 14846, 'brython': 10789, 'this_branch': 387, 'master': 1117}, 'add_integers': {'Cpython': 23, 'brython_chrome': 234, 'brython': 26, 'this_branch': 341, 'master': 669}, 'add_strings': {'Cpython': 31, 'brython_chrome': 225, 'brython': 42, 'this_branch': 447, 'master': 718}, 'add_int_float': {'Cpython': 28, 'brython_chrome': 279, 'brython': 103, 'this_branch': 434, 'master': 666}, 'compare_int_int': {'Cpython': 14, 'brython_chrome': 258, 'brython': 11, 'this_branch': 465, 'master': 578}, 'compare_int_float': {'Cpython': 19, 'brython_chrome': 401, 'brython': 32, 'this_branch': 470, 'master': 620}, 'str_of_int': {'Cpython': 3, 'brython_chrome': 52, 'brython': 6, 'this_branch': 74, 'master': 111}, 'create_function': {'Cpython': 18, 'brython_chrome': 524, 'brython': 347, 'this_branch': 533, 'master': 599}, 'function_call': {'Cpython': 19, 'brython_chrome': 996, 'brython': 286, 'this_branch': 486, 'master': 580}, 'create_class': {'Cpython': 130, 'brython_chrome': 907, 'brython': 946, 'this_branch': 694, 'master': 914}, 'descr_class': {'Cpython': 9, 'brython_chrome': 325, 'brython': 34, 'this_branch': 522, 'master': 548}, 'get_class_attr': {'Cpython': 13, 'brython_chrome': 496, 'brython': 70, 'this_branch': 515, 'master': 625}, 'init_class': {'Cpython': 48, 'brython_chrome': 1283, 'brython': 718, 'this_branch': 684, 'master': 1612}, 'set_instance_attr': {'Cpython': 16, 'brython_chrome': 576, 'brython': 56, 'this_branch': 551, 'master': 939}, 'Total': {'Cpython': 564, 'brython_chrome': 23807, 'brython': 13703, 'this_branch': 8904, 'master': 13354}, 'fields': {'Cpython': 255, 'brython_chrome': 23685, 'brython': 17996, 'this_branch': 1500, 'master': 4439}}


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