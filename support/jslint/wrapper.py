# JSLint doesn't allow/support disabling the requirement for braces around
# blocks, and that's one uglification I refuse to perform in the service of a
# lint.
#
# There are of course lots of other intelligent things JSLint has to say
# because it's just too easy in JS to do something that (e.g.) IE won't like.
# So, this dumb script filters out any output messages from running JSLint
# that look like they're complaints about '{' around braces.
#
# Also, takes an optional file describing the line mapping from the source
# files to the combined distribution file, and outputs error messages in a
# format suitable for vim (or whatever) pointing back to the source file.

from subprocess import Popen, PIPE
import sys
import re

def remapError(linestarts, line, col, err):
    if len(linestarts) == 0:
        # none supplied on command line
        return "%s:%d:%d: %s" % (sys.argv[1], line, col - 1, err)

    for i in range(len(linestarts)):
        if line > linestarts[i][0] and (i + 1 == len(linestarts) or (line <= linestarts[i + 1][0])):
            return "%s:%d:%d: %s" % (linestarts[i][1],
                    line - linestarts[i][0],
                    col - 1,
                    err)
    raise Exception("Couldn't remap error!\n%s\n%s\n%s\n%s" % (linestarts, line, col, err))

def main():

    p = Popen("support/d8/d8 support/jslint/fulljslint.js support/jslint/d8.js -- %s" % sys.argv[1],
            shell=True, stdout=PIPE)

    linestarts = []
    if len(sys.argv) > 2:
        linemaps = open(sys.argv[2]).read().split("\n")
        for l in linemaps:
            if len(l.strip()) == 0: continue
            start, fn = l.split(":")
            linestarts.append((int(start), fn))

    out, err = p.communicate()
    result = []
    report = []
    skip = 0
    mode = 'errors'
    for line in out.split("\n"):
        if line == "---REPORT":
            mode = 'report'
            continue
        if mode == "report":
            report.append(line)
        else:
            if skip > 0:
                skip -= 1
            else:
                if re.search(r"^.*Expected '{' and instead saw.*", line):
                    skip = 2
                else:
                    m = re.search("^Lint at line (\d+) character (\d+): (.*)$", line)
                    if m:
                        result.append(remapError(linestarts, int(m.group(1)),
                            int(m.group(2)), m.group(3)))
                    else:
                        if line.strip() != "":
                            result.append(line)
    if len(result) > 0:
        print '\n'.join(result)
        sys.exit(p.returncode)

    #open("dist/report.html", "w").write('\n'.join(report))
    sys.exit(0)


if __name__ == "__main__": main()
