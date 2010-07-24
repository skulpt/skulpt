def do(fmt, val):
    print fmt % val
do("%d", 42)
do("%x", 42)
do("%o", 42)
do("%d", 42L)
do("%x", 42L)
do("%o", 42L)
do("%d", 4200000000000L)
do("%x", 4200000000000L)
do("%o", 4200000000000L)
do("%d", 0x4200000000000L)
do("%x", 0x4200000000000L)
do("%o", 0x4200000000000L)
do("%d", 0o4200000000000L)
do("%x", 0o4200000000000L)
do("%o", 0o4200000000000L)
big = 012345670123456701234567012345670L  # 32 octal digits
print big
print repr(big)
print str(big)
