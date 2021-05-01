Sk.builtin.print = function print(args, kwargs) {
    /** @todo flush is allowed but has no effect */
    let [sep, end, file] = Sk.abstr.copyKeywordsToNamedArgs("print", ["sep", "end", "file", "flush"], [], kwargs);

    // check for sep; string or None
    if (sep === undefined || Sk.builtin.checkNone(sep)) {
        sep = " ";
    } else if (Sk.builtin.checkString(sep)) {
        sep = sep.$jsstr();
    } else {
        throw new Sk.builtin.TypeError("sep must be None or a string, not " + Sk.abstr.typeName(sep));
    }

    // check for end; string or None
    if (end === undefined || Sk.builtin.checkNone(end)) {
        end = "\n";
    } else if (Sk.builtin.checkString(end)) {
        end = end.$jsstr();
    } else {
        throw new Sk.builtin.TypeError("end must be None or a string, not " + Sk.abstr.typeName(end));
    }

    // check for file and get the file_write function if it exists
    let file_write;
    if (file !== undefined && !Sk.builtin.checkNone(file)) {
        file_write = Sk.abstr.lookupSpecial(file, Sk.builtin.str.$write);
        if (file_write === undefined) {
            throw new Sk.builtin.AttributeError("'" + Sk.abstr.typeName(file) + "' object has no attribute 'write'");
        }
    }

    // loop through outputs and create output string
    const output = new Sk.builtin.str(args.map((x) => new Sk.builtin.str(x).toString()).join(sep) + end);

    if (file_write !== undefined) {
        // currently not tested, though it seems that we need to see how we should access the write function in a correct manner
        Sk.misceval.callsimArray(file_write, [output]);
    } else {
        return Sk.misceval.chain(Sk.importModule("sys", false, true), (sys) => {
            file_write = Sk.abstr.lookupSpecial(sys.$d.stdout, Sk.builtin.str.$write);
            return file_write && Sk.misceval.callsimOrSuspendArray(file_write, [output]);
        });
    }
};

// add this flag so that if Sk.misceval.call(Sk.builtin.print) is used then it knows how to deal with args
Sk.builtin.print.co_fastcall = 1;