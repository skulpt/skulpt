// this is stored into sys specially, rather than created by sys
Sk.sysmodules = new Sk.builtin.dict([]);
Sk.realsyspath = undefined;
Sk.externalLibraryCache = {};

Sk.loadExternalLibraryInternal_ = function (path, inject) {
    var scriptElement;
    var request, result;

    if (path == null) {
        return void(0);
    }

    if (Sk.externalLibraryCache[path]) {
        return Sk.externalLibraryCache[path];
    }

    request = new XMLHttpRequest();
    request.open("GET", path, false);
    request.send();

    if (request.status !== 200) {
        return void(0);
    }

    result = request.responseText;

    if (inject) {
        scriptElement = document.createElement("script");
        scriptElement.type = "text/javascript";
        scriptElement.text = result;
        document.getElementsByTagName("head")[0].appendChild(scriptElement);
    }

    return result;
};

Sk.loadExternalLibrary = function (name) {
    var i;
    var externalLibraryInfo, path,  module,
        dependencies, dep, ext, extMatch, co;

    // check if the library has already been loaded and cached
    if (Sk.externalLibraryCache[name]) {
        return Sk.externalLibraryCache[name];
    }

    externalLibraryInfo = Sk.externalLibraries && Sk.externalLibraries[name];

    // if no external library info can be found, bail out
    if (!externalLibraryInfo) {
        return void(0);
    }

    // if the external library info is just a string, assume it is the path
    // otherwise dig into the info to find the path
    path = typeof externalLibraryInfo === "string" ?
        externalLibraryInfo :
        externalLibraryInfo.path;

    if (typeof path !== "string") {
        throw new Sk.builtin.ImportError("Invalid path specified for " + name);
    }

    // attempt to determine the type of the library (js or py)
    // which is either specified explicitly in the library info
    // or inferred from the file extension
    ext = externalLibraryInfo.type;
    if (!ext) {
        extMatch = path.match(/\.(js|py)$/);
        ext = extMatch && extMatch[1];
    }

    if (!ext) {
        throw new Sk.builtin.ImportError("Invalid file extension specified for " + name);
    }

    module = Sk.loadExternalLibraryInternal_(path, false);

    if (!module) {
        throw new Sk.builtin.ImportError("Failed to load remote module '" + name + "'");
    }

    // if the library has any js dependencies, load them in now
    dependencies = externalLibraryInfo.dependencies;
    if (dependencies && dependencies.length) {
        for (i = 0; i < dependencies.length; i++) {
            dep = Sk.loadExternalLibraryInternal_(dependencies[i], true);
            if (!dep) {
                throw new Sk.builtin.ImportError("Failed to load dependencies required for " + name);
            }
        }
    }

    if (ext === "js") {
        co = { funcname: "$builtinmodule", code: module };
    }
    else {
        co = Sk.compile(module, path, "exec", true);
    }

    Sk.externalLibraryCache[name] = co;

    return co;
};

/**
 * @param {string} name to look for
 * @param {string} ext extension to use (.py or .js)
 * @param {boolean=} failok will throw if not true
 * @param {boolean=} canSuspend can we suspend?
 */
Sk.importSearchPathForName = function (name, ext, failok, canSuspend) {
    var fn;
    var j;
    var fns = [];
    var nameAsPath = name.replace(/\./g, "/");
    var L = Sk.realsyspath;
    var it, i;

    for (it = L.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        fns.push(i.v + "/" + nameAsPath + ext);                 // module
        fns.push(i.v + "/" + nameAsPath + "/__init__" + ext);   // package
    }

    j = 0;

    return (function tryNextPath() {
        var handleRead = function handleRead(s) {
            var ns;
            if (s instanceof Sk.misceval.Suspension) {
                ns = new Sk.misceval.Suspension(undefined, s);
                ns.resume = function() {
                    try {
                        return handleRead(s.resume());
                    } catch (e) {
                        j++;
                        return tryNextPath();
                    }
                };
                return ns;
            } else {
                return {filename: fns[j], code: s};
            }
        };
        var s;

        while (j < fns.length) {
            // Ew, this is the only way to check for existence.
            // Even worse, it reports non-existence through exceptions, so we have to
            // write a custom resume() function to catch downstream exceptions and interpret
            // them as "file not found, move on".
            try {
                s = Sk.read(fns[j]);

                if (!canSuspend) {
                    s = Sk.misceval.retryOptionalSuspensionOrThrow(s);
                }

                return handleRead(s);
            } catch (e) {
                j++;
            }
        }

        if (failok) {
            return null;
        } else {
            throw new Sk.builtin.ImportError("No module named " + name);
        }
    })();
};

Sk.doOneTimeInitialization = function () {
    // can't fill these out when making the type because tuple/dict aren't
    // defined yet.
    Sk.builtin.type.basesStr_ = new Sk.builtin.str("__bases__");
    Sk.builtin.type.mroStr_ = new Sk.builtin.str("__mro__");
    Sk.builtin.object["$d"] = new Sk.builtin.dict([]);
    Sk.builtin.object["$d"].mp$ass_subscript(Sk.builtin.type.basesStr_, new Sk.builtin.tuple([]));
    Sk.builtin.object["$d"].mp$ass_subscript(Sk.builtin.type.mroStr_, new Sk.builtin.tuple([Sk.builtin.object]));
};

/**
 * currently only pull once from Sk.syspath. User might want to change
 * from js or from py.
 */
Sk.importSetUpPath = function () {
    var i;
    var paths;
    if (!Sk.realsyspath) {
        paths = [
            new Sk.builtin.str("src/builtin"),
            new Sk.builtin.str("src/lib"),
            new Sk.builtin.str(".")
        ];
        for (i = 0; i < Sk.syspath.length; ++i) {
            paths.push(new Sk.builtin.str(Sk.syspath[i]));
        }
        Sk.realsyspath = new Sk.builtin.list(paths);

        Sk.doOneTimeInitialization();

    }
};

if (COMPILED) {
    var js_beautify = function (x) {
        return x;
    };
}

/**
 * @param {string} name name of module to import
 * @param {boolean=} dumpJS whether to output the generated js code
 * @param {string=} modname what to call the module after it's imported if
 * it's to be renamed (i.e. __main__)
 * @param {string=} suppliedPyBody use as the body of the text for the module
 * rather than Sk.read'ing it.
 * @param {boolean=} canSuspend whether we may return a Suspension object
 */
Sk.importModuleInternal_ = function (name, dumpJS, modname, suppliedPyBody, canSuspend) {
    //dumpJS = true;
    var parentModule;
    var modlocs;
    var namestr;
    var withLineNumbers;
    var finalcode;
    var result;
    var filename, codeAndPath, co, isPy, googClosure, external;
    var module;
    var prev;
    var parentModName;
    var modNameSplit;
    var toReturn;
    Sk.importSetUpPath();

    // if no module name override, supplied, use default name
    if (modname === undefined) {
        modname = name;
    }

    toReturn = null;
    modNameSplit = modname.split(".");

    // if leaf is already in sys.modules, early out
    try {
        prev = Sk.sysmodules.mp$subscript(modname);
        // if we're a dotted module, return the top level, otherwise ourselves
        if (modNameSplit.length > 1) {
            return Sk.sysmodules.mp$subscript(modNameSplit[0]);
        }
        else {
            return prev;
        }
    } catch (x) {
        // not in sys.modules, continue
    }

    if (modNameSplit.length > 1) {
        // if we're a module inside a package (i.e. a.b.c), then we'll need to return the
        // top-level package ('a'). recurse upwards on our parent, importing
        // all parent packages. so, here we're importing 'a.b', which will in
        // turn import 'a', and then return 'a' eventually.
        parentModName = modNameSplit.slice(0, modNameSplit.length - 1).join(".");
        toReturn = Sk.importModuleInternal_(parentModName, dumpJS, undefined, undefined, canSuspend);

        // If this suspends, we suspend. When that suspension is done, we can just
        // repeat this whole function call
        if (toReturn instanceof Sk.misceval.Suspension) {
            // no canSuspend check here; we'll only get a Suspension out of importModuleInternal_ if
            // canSuspend is true anyway
            return (function waitForPreviousLoad(susp) {
                if (susp instanceof Sk.misceval.Suspension) {
                    // They're still going
                    return new Sk.misceval.Suspension(waitForPreviousLoad, susp);
                } else {
                    // They're done!
                    // Re-call ourselves, and this time "toReturn = Sk.importModuleInternal_(...)"
                    // will hit the cache and complete immediately.
                    return Sk.importModuleInternal_(name, dumpJS, modname, suppliedPyBody, canSuspend);
                }
            })(toReturn);
        }
    }

    // otherwise:
    // - create module object
    // - add module object to sys.modules
    // - compile source to (function(){...});
    // - run module and set the module locals returned to the module __dict__
    module = new Sk.builtin.module();
    Sk.sysmodules.mp$ass_subscript(name, module);

    if (suppliedPyBody) {
        filename = name + ".py";
        co = Sk.compile(suppliedPyBody, filename, "exec", canSuspend);
    }
    else {
        // If an onBeforeImport method is supplied, call it and if
        // the result is false or a string, prevent the import.
        // This allows for a user to conditionally prevent the usage
        // of certain libraries.
        if (Sk.onBeforeImport && typeof Sk.onBeforeImport === "function") {
            result = Sk.onBeforeImport(name);
            if (result === false) {
                throw new Sk.builtin.ImportError("Importing " + name + " is not allowed");
            }
            else if (typeof result === "string") {
                throw new Sk.builtin.ImportError(result);
            }
        }

        // check first for an externally loaded library
        external = Sk.loadExternalLibrary(name);
        if (external) {
            co = external;
        } else {
            // Try loading as a builtin (i.e. already in JS) module, then try .py files
            codeAndPath = Sk.importSearchPathForName(name, ".js", true, canSuspend);

            co = (function compileReadCode(codeAndPath) {
                if (codeAndPath instanceof Sk.misceval.Suspension) {
                    return new Sk.misceval.Suspension(compileReadCode, codeAndPath);
                } else if (!codeAndPath) {
                    goog.asserts.assert(!isPy, "Sk.importReadFileFromPath did not throw when loading Python file failed");
                    isPy = true;
                    return compileReadCode(Sk.importSearchPathForName(name, ".py", false, canSuspend));
                } else {
                    return isPy ? Sk.compile(codeAndPath.code, codeAndPath.filename, "exec", canSuspend)
                        : { funcname: "$builtinmodule", code: codeAndPath.code };
                }
            })(codeAndPath);
        }
    }

    return (function importCompiledCode(co) {

        if (co instanceof Sk.misceval.Suspension) {
            return canSuspend ? new Sk.misceval.Suspension(importCompiledCode, co) : Sk.misceval.retryOptionalSuspensionOrThrow(co);
        }

        module.$js = co.code; // todo; only in DEBUG?
        finalcode = co.code;
        if (Sk.dateSet == null || !Sk.dateSet) {
            finalcode = "Sk.execStart = Sk.lastYield = new Date();\n" + co.code;
            Sk.dateSet = true;
        }

        //if (!COMPILED)
        {
            if (dumpJS) {
                withLineNumbers = function (code) {
                    var j;
                    var pad;
                    var width;
                    var i;
                    var beaut = js_beautify(code);
                    var lines = beaut.split("\n");
                    for (i = 1; i <= lines.length; ++i) {
                        width = ("" + i).length;
                        pad = "";
                        for (j = width; j < 5; ++j) {
                            pad += " ";
                        }
                        lines[i - 1] = "/* " + pad + i + " */ " + lines[i - 1];
                    }
                    return lines.join("\n");
                };
                finalcode = withLineNumbers(finalcode);
                Sk.debugout(finalcode);
            }
        }

        namestr = "new Sk.builtin.str('" + modname + "')";
        finalcode += "\n" + co.funcname + "(" + namestr + ");";

        modlocs = goog.global["eval"](finalcode);

        return (function finishLoading(modlocs) {

            if (modlocs instanceof Sk.misceval.Suspension) {

                if (canSuspend) {
                    return new Sk.misceval.Suspension(finishLoading, modlocs);
                } else {
                    modlocs = Sk.misceval.retryOptionalSuspensionOrThrow(modlocs, "Module \""+modname+"\" suspended or blocked during load, and it was loaded somewhere that does not permit this");
                }
            }

            // pass in __name__ so the module can set it (so that the code can access
            // it), but also set it after we're done so that builtins don't have to
            // remember to do it.
            if (!modlocs["__name__"]) {
                modlocs["__name__"] = new Sk.builtin.str(modname);
            }

            module["$d"] = modlocs;

            // If an onAfterImport method is defined on the global Sk
            // then call it now after a library has been successfully imported
            // and compiled.
            if (Sk.onAfterImport && typeof Sk.onAfterImport === "function") {
                try {
                    Sk.onAfterImport(name);
                } catch (e) {
                }
            }

            if (toReturn) {
                // if we were a dotted name, then we want to return the top-most
                // package. we store ourselves into our parent as an attribute
                parentModule = Sk.sysmodules.mp$subscript(parentModName);
                parentModule.tp$setattr(modNameSplit[modNameSplit.length - 1], module);
                //print("import returning parent module, modname", modname, "__name__", toReturn.tp$getattr("__name__").v);
                return toReturn;
            }

            //print("name", name, "modname", modname, "returning leaf");
            // otherwise we return the actual module that we just imported
            return module;
        })(modlocs);
    })(co);
};

/**
 * @param {string} name the module name
 * @param {boolean=} dumpJS print out the js code after compilation for debugging
 * @param {boolean=} canSuspend can this function suspend and return a Suspension object?
 */
Sk.importModule = function (name, dumpJS, canSuspend) {
    return Sk.importModuleInternal_(name, dumpJS, undefined, undefined, canSuspend);
};

Sk.importMain = function (name, dumpJS, canSuspend) {
    Sk.dateSet = false;
    Sk.filesLoaded = false;
    //	Added to reset imports
    Sk.sysmodules = new Sk.builtin.dict([]);
    Sk.realsyspath = undefined;

    Sk.resetCompiler();

    return Sk.importModuleInternal_(name, dumpJS, "__main__", undefined, canSuspend);
};

Sk.importMainWithBody = function (name, dumpJS, body, canSuspend) {
    Sk.dateSet = false;
    Sk.filesLoaded = false;
    //	Added to reset imports
    Sk.sysmodules = new Sk.builtin.dict([]);
    Sk.realsyspath = undefined;

    Sk.resetCompiler();

    return Sk.importModuleInternal_(name, dumpJS, "__main__", body, canSuspend);
};

Sk.builtin.__import__ = function (name, globals, locals, fromlist) {
    // Save the Sk.globals variable importModuleInternal_ may replace it when it compiles
    // a Python language module.  for some reason, __name__ gets overwritten.
    var saveSk = Sk.globals;
    var tret;
    var ret = Sk.importModuleInternal_(name, undefined, undefined, undefined, true);

    return (function finalizeImport(ret) {
        if (ret instanceof Sk.misceval.Suspension) {
            return new Sk.misceval.Suspension(finalizeImport, ret);
        }

        if (saveSk !== Sk.globals) {
            Sk.globals = saveSk;
        }
        if (!fromlist || fromlist.length === 0) {
            return ret;
        }
        // if there's a fromlist we want to return the actual module, not the
        // toplevel namespace
        ret = Sk.sysmodules.mp$subscript(name);
        // But if there is a fromlist it might also be a module in a package
        // so we should try to import it
        if (fromlist.length == 1) {
            try {
                tret = Sk.importModuleInternal_(name+"."+fromlist[0]);
                //            Sk.abstr.sattr(ret,fromlist[i],tret);
                return  tret;
            } catch (x) {}
        }
        goog.asserts.assert(ret);
        return ret;
    })(ret);
};

Sk.importStar = function (module, loc, global) {
    // from the global scope, globals and locals can be the same.  So the loop below
    // could accidentally overwrite __name__, erasing __main__.
    var i;
    var nn = global["__name__"];
    var props = Object["getOwnPropertyNames"](module["$d"]);
    for (i in props) {
        loc[props[i]] = module["$d"][props[i]];
    }
    if (global["__name__"] !== nn) {
        global["__name__"] = nn;
    }
};

goog.exportSymbol("Sk.importMain", Sk.importMain);
goog.exportSymbol("Sk.importMainWithBody", Sk.importMainWithBody);
goog.exportSymbol("Sk.builtin.__import__", Sk.builtin.__import__);
goog.exportSymbol("Sk.importStar", Sk.importStar);
