/**
 * @namespace Sk
 *
 */

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
    } else {
        co = Sk.compile(module, path, "exec", true);
    }

    Sk.externalLibraryCache[name] = co;

    return co;
};

/**
 * @param {string} name to look for
 * @param {string} ext extension to use (.py or .js)
 * @param {Object=} searchPath an iterable set of path strings
 */
Sk.importSearchPathForName = function (name, ext, searchPath) {
    var fn;
    var j;
    var fns = [];
    var nameAsPath = name.replace(/\./g, "/");
    var it, i;

    var tryPathAndBreakOnSuccess = function(filename, packagePath) {
        return Sk.misceval.chain(
            Sk.misceval.tryCatch(function() {
                return Sk.read(filename);
            }, function(e) { /* Exceptions signal "not found" */ }),
            function(code) {
                if (code !== undefined) {
                    // This will cause the iterFor() to return the specified value
                    return new Sk.misceval.Break({filename: filename, code: code, packagePath: packagePath});
                }
            }
        );
    };

    if (searchPath === undefined) {
        searchPath = Sk.realsyspath;
    }

    return Sk.misceval.iterFor(searchPath.tp$iter(), function(pathStr) {
        // For each element of path, try loading the module, and if that
        // doesn't work, try the corresponding package.
        return Sk.misceval.chain(
            tryPathAndBreakOnSuccess(pathStr.v + "/" + nameAsPath + ext, false), // module
            function(r) {
                return r ? r : tryPathAndBreakOnSuccess(pathStr.v + "/" + nameAsPath + "/__init__" + ext,
                                                        pathStr.v + "/" + nameAsPath); // package
            }
        );
    });
};

/**
 * Complete any initialization of Python classes which relies on internal
 * dependencies.
 *
 * This includes making Python classes subclassable and ensuring that the
 * {@link Sk.builtin.object} magic methods are wrapped inside Python functions.
 *
 * @return {undefined}
 */
Sk.doOneTimeInitialization = function () {
    var proto, name, i, x, func;
    var builtins = [];

    // can't fill these out when making the type because tuple/dict aren't
    // defined yet.
    Sk.builtin.type.basesStr_ = new Sk.builtin.str("__bases__");
    Sk.builtin.type.mroStr_ = new Sk.builtin.str("__mro__");

    // Register a Python class with an internal dictionary, which allows it to
    // be subclassed
    var setUpClass = function (child) {
        var parent = child.tp$base;
        var bases = [];
        var base;

        for (base = parent; base !== undefined; base = base.tp$base) {
            bases.push(base);
        }

        child["$d"] = new Sk.builtin.dict([]);
        child["$d"].mp$ass_subscript(Sk.builtin.type.basesStr_, new Sk.builtin.tuple(bases));
        child["$d"].mp$ass_subscript(Sk.builtin.type.mroStr_, new Sk.builtin.tuple([child]));
    };

    for (x in Sk.builtin) {
        func = Sk.builtin[x];
        if ((func.prototype instanceof Sk.builtin.object ||
             func === Sk.builtin.object) && !func.sk$abstract) {
            setUpClass(func);
        }
    }

    // Wrap the inner Javascript code of Sk.builtin.object's Python methods inside
    // Sk.builtin.func, as that class was undefined when these functions were declared
    proto = Sk.builtin.object.prototype;

    for (i = 0; i < Sk.builtin.object.pythonFunctions.length; i++) {
        name = Sk.builtin.object.pythonFunctions[i];

        if (proto[name] instanceof Sk.builtin.func) {
            // If functions have already been initialized, do not wrap again.
            break;
        }

        proto[name] = new Sk.builtin.func(proto[name]);
    }

    proto = Sk.builtin.type.prototype;

    for (i = 0; i < Sk.builtin.type.pythonFunctions.length; i++) {
        name = Sk.builtin.type.pythonFunctions[i];

        if (proto[name] instanceof Sk.builtin.func) {
            // If functions have already been initialized, do not wrap again.
            break;
        }

        proto[name] = new Sk.builtin.func(proto[name]);
    }

    // compile internal python files and add them to the __builtin__ module
    for (var file in Sk.internalPy.files) {
        var fileWithoutExtension = file.split(".")[0].split("/")[1];
        var mod = Sk.importBuiltinWithBody(fileWithoutExtension, false, Sk.internalPy.files[file], true);
        mod = Sk.misceval.retryOptionalSuspensionOrThrow(mod);
        goog.asserts.assert(mod["$d"][fileWithoutExtension] !== undefined, "Should have imported name " + fileWithoutExtension);
        Sk.builtins[fileWithoutExtension] = mod["$d"][fileWithoutExtension];
    }
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
 * @param {Object=} relativeToPackage perform import relative to this package
 * @param {boolean=} returnUndefinedOnNotFound return 'undefined' rather than throwing ImportError if the load failed
 * @param {boolean=} canSuspend whether we may return a Suspension object
 */
Sk.importModuleInternal_ = function (name, dumpJS, modname, suppliedPyBody, relativeToPackage, returnUndefinedOnNotFound, canSuspend) {
    //dumpJS = true;
    var filename;
    var prev;
    var parentModName;
    var parentModule;
    var modNameSplit;
    var ret;
    var module;
    var topLevelModuleToReturn = null;
    var relativePackageName = relativeToPackage !== undefined ? relativeToPackage.tp$getattr("__name__") : undefined;
    var absolutePackagePrefix = relativePackageName !== undefined ? relativePackageName.v + "." : "";
    var searchPath = relativeToPackage !== undefined ? relativeToPackage.tp$getattr("__path__") : undefined;
    Sk.importSetUpPath();

    // if no module name override, supplied, use default name
    if (modname === undefined) {
        modname = absolutePackagePrefix + name;
    }

    modNameSplit = name.split(".");

    // if leaf is already in sys.modules, early out
    try {
        prev = Sk.sysmodules.mp$subscript(modname);
        // if we're a dotted module, return the top level, otherwise ourselves
        if (modNameSplit.length > 1) {
            return Sk.sysmodules.mp$subscript(absolutePackagePrefix + modNameSplit[0]);
        } else {
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
        topLevelModuleToReturn = Sk.importModuleInternal_(parentModName, dumpJS, undefined, undefined, relativeToPackage, returnUndefinedOnNotFound, canSuspend);
    }

    ret = Sk.misceval.chain(topLevelModuleToReturn, function(topLevelModuleToReturn_) {
        var codeAndPath, co, googClosure, external;
        var searchFileName = name;
        var result;

        topLevelModuleToReturn = topLevelModuleToReturn_;

        // If we're inside a package, look search using its __path__
        if (modNameSplit.length > 1) {
            parentModule = Sk.sysmodules.mp$subscript(absolutePackagePrefix + parentModName);
            searchFileName = modNameSplit[modNameSplit.length-1];
            searchPath = parentModule.tp$getattr("__path__");
        }

        // otherwise:
        // - create module object
        // - add module object to sys.modules
        // - compile source to (function(){...});
        // - run module and set the module locals returned to the module __dict__
        module = new Sk.builtin.module();

        if (suppliedPyBody) {
            filename = name + ".py";
            co = Sk.compile(suppliedPyBody, filename, "exec", canSuspend);
        } else {
            // If an onBeforeImport method is supplied, call it and if
            // the result is false or a string, prevent the import.
            // This allows for a user to conditionally prevent the usage
            // of certain libraries.
            if (Sk.onBeforeImport && typeof Sk.onBeforeImport === "function") {
                result = Sk.onBeforeImport(name);
                if (result === false) {
                    throw new Sk.builtin.ImportError("Importing " + name + " is not allowed");
                } else if (typeof result === "string") {
                    throw new Sk.builtin.ImportError(result);
                }
            }

            // check first for an externally loaded library
            external = Sk.loadExternalLibrary(name);
            if (external) {
                co = external;
                if (Sk.externalLibraries) {
                    filename = Sk.externalLibraries[name].path; // get path from config
                } else {
                    filename = "unknown";
                }
                // ToDo: check if this is a dotted name or import from ...
            } else {
                // Try loading as a builtin (i.e. already in JS) module, then try .py files
                co = Sk.misceval.chain(Sk.importSearchPathForName(searchFileName, ".js", searchPath), function(codeAndPath) {
                    if (codeAndPath) {
                        return {funcname: "$builtinmodule", code: codeAndPath.code,
                                filename: codeAndPath.filename, packagePath: codeAndPath.packagePath};
                    } else {
                        return Sk.misceval.chain(Sk.importSearchPathForName(searchFileName, ".py", searchPath), function(codeAndPath_) {
                            codeAndPath = codeAndPath_; // We'll want it in a moment
                            if (codeAndPath) {
                                return Sk.compile(codeAndPath.code, codeAndPath.filename, "exec", canSuspend);
                            }
                        }, function(co) {
                            if (co) {
                                co.packagePath = codeAndPath.packagePath;
                                return co;
                            }
                        });
                    }
                });

            }
        }
        return co;

    }, function(co) {

        var finalcode;
        var withLineNumbers;
        var modscope;

        if (!co) {
            return undefined;
        }

        // Now we know this module exists, we can add it to the cache
        Sk.sysmodules.mp$ass_subscript(modname, module);

        module.$js = co.code; // todo; only in DEBUG?
        finalcode = co.code;

        if (filename == null) {
            filename = co.filename;
        }

        if (Sk.dateSet == null || !Sk.dateSet) {
            finalcode = "Sk.execStart = Sk.lastYield = new Date();\n" + co.code;
            Sk.dateSet = true;
        }

        // if (!COMPILED)
        // {
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
        // }

        finalcode += "\n" + co.funcname + ";";

        modscope = goog.global["eval"](finalcode);

        module["$d"] = {
            "__name__": new Sk.builtin.str(modname),
            "__doc__": Sk.builtin.none.none$,
            "__package__": co.packagePath ? new Sk.builtin.str(modname) :
                                parentModName ? new Sk.builtin.str(absolutePackagePrefix + parentModName) :
                                relativePackageName ? relativePackageName : Sk.builtin.none.none$
        };
        if (co.packagePath) {
            module["$d"]["__path__"] = new Sk.builtin.tuple([new Sk.builtin.str(co.packagePath)]);
        }

        return modscope(module["$d"]);

    }, function (modlocs) {
        var i;

        if (modlocs === undefined) {
            if (returnUndefinedOnNotFound) {
                return undefined;
            } else {
                throw new Sk.builtin.ImportError("No module named " + name);
            }
        }

        // Some builtin modules replace their globals entirely.
        // For their benefit, we copy over any of the standard
        // dunder-values they didn't supply.
        if (modlocs !== module["$d"]) {
            for (i in module["$d"]) {
                if (!modlocs[i]) {
                    modlocs[i] = module["$d"][i];
                }
            }
            module["$d"] = modlocs;
        }

        // If an onAfterImport method is defined on the global Sk
        // then call it now after a library has been successfully imported
        // and compiled.
        if (Sk.onAfterImport && typeof Sk.onAfterImport === "function") {
            try {
                Sk.onAfterImport(name);
            } catch (e) {
            }
        }

        if (topLevelModuleToReturn) {
            // if we were a dotted name, then we want to return the top-most
            // package. we store ourselves into our parent as an attribute
            parentModule.tp$setattr(modNameSplit[modNameSplit.length - 1], module);
            //print("import returning parent module, modname", modname, "__name__", toReturn.tp$getattr("__name__").v);
            return topLevelModuleToReturn;
        }

        if (relativeToPackage) {
            relativeToPackage.tp$setattr(name, module);
        }

        //print("name", name, "modname", modname, "returning leaf");
        // otherwise we return the actual module that we just imported
        return module;
    });

    return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
};

/**
 * @param {string} name the module name
 * @param {boolean=} dumpJS print out the js code after compilation for debugging
 * @param {boolean=} canSuspend can this function suspend and return a Suspension object?
 */
Sk.importModule = function (name, dumpJS, canSuspend) {
    return Sk.importModuleInternal_(name, dumpJS, undefined, undefined, undefined, false, canSuspend);
};

Sk.importMain = function (name, dumpJS, canSuspend) {
    Sk.dateSet = false;
    Sk.filesLoaded = false;
    //	Added to reset imports
    Sk.sysmodules = new Sk.builtin.dict([]);
    Sk.realsyspath = undefined;

    Sk.resetCompiler();

    return Sk.importModuleInternal_(name, dumpJS, "__main__", undefined, undefined, false, canSuspend);
};

/**
 * **Run Python Code in Skulpt**
 *
 * When you want to hand Skulpt a string corresponding to a Python program this is the function.
 *
 * @param name {string}  File name to use for messages related to this run
 * @param dumpJS {boolean} print out the compiled javascript
 * @param body {string} Python Code
 * @param canSuspend {boolean}  Use Suspensions for async execution
 *
 */
Sk.importMainWithBody = function (name, dumpJS, body, canSuspend) {
    Sk.dateSet = false;
    Sk.filesLoaded = false;
    //	Added to reset imports
    Sk.sysmodules = new Sk.builtin.dict([]);
    Sk.realsyspath = undefined;

    Sk.resetCompiler();

    return Sk.importModuleInternal_(name, dumpJS, "__main__", body, undefined, false, canSuspend);
};

/**
 * Imports internal python files into the `__builin__` module. Used during startup 
 * to compile and import all *.py files from the src/ directory. 
 * 
 * @param name {string}  File name to use for messages related to this run
 * @param dumpJS {boolean} print out the compiled javascript
 * @param body {string} Python Code
 * @param canSuspend {boolean}  Use Suspensions for async execution
 *
 */
Sk.importBuiltinWithBody = function (name, dumpJS, body, canSuspend) {
    return Sk.importModuleInternal_(name, dumpJS, "__builtin__."+name, body, undefined, false, canSuspend);
};

Sk.builtin.__import__ = function (name, globals, locals, fromlist) {
    // Save the Sk.globals variable importModuleInternal_ may replace it when it compiles
    // a Python language module.  for some reason, __name__ gets overwritten.
    var saveSk = Sk.globals;
    var isPackageRelative = false;

    // This might be a relative import, so first we get hold of the module object
    // representing this module's package (so we can search its __path__).
    // module.__package__ contains its name, so we use that to look it up in sys.modules.

    var currentPackage;
    var absolutePackagePrefix = "";

    if (globals["__package__"] && globals["__package__"] !== Sk.builtin.none.none$) {
        try {
            currentPackage = Sk.sysmodules.mp$subscript(globals["__package__"].v);
        } catch(e) {}
    }

    // This is a hack to emulate the actual Python behaviour. If the first name
    // can be found relatively, we do the whole lookup relatively. If not, we fall
    // back to global.

    var dottedName = name.split(".");
    var firstDottedName = dottedName[0];

    return Sk.misceval.chain(undefined, function() {
            if (currentPackage !== undefined) {
                isPackageRelative = true;
                absolutePackagePrefix = globals["__package__"].v + ".";
                return Sk.misceval.chain(
                    Sk.importModuleInternal_(firstDottedName, undefined, absolutePackagePrefix + firstDottedName, undefined, currentPackage, true, true),
                    function(ret) {
                        // Did relative import of the top package succeed?
                        if (ret === undefined) {
                            return undefined; // No; fall back to absolute import
                        } else if (dottedName.length == 1) {
                            return ret; // yes, and we've already done all we need to do
                        } else {
                            // Yes, and now we need to do the rest of the import.
                            // If this fails now, the whole import fails.
                            return  Sk.importModuleInternal_(name, undefined, absolutePackagePrefix + name, undefined, currentPackage, false, true);
                        }
                    }
                );
            }
        }, function(ret) {
            if (ret === undefined) {
                // If that didn't work, try an absolute import
                isPackageRelative = false;
                absolutePackagePrefix = "";
                return Sk.importModuleInternal_(name, undefined, undefined, undefined, undefined, false, true);
            } else {
                return ret;
            }
        }, function(ret) {
            // There is no fromlist, so we have reached the end of the lookup, return
            if (!fromlist || fromlist.length === 0) {
                return ret;
            } else {
                // try to load the module from the file system if it is not present on the module itself
                var i;
                var fromName; // name of current module for fromlist
                var fromImportName, fromImportModName; // dotted name
                var lastDottedName = dottedName[dottedName.length-1];
                
                var found; // Contains sysmodules the "name"
                var foundFromName; // Contains the sysmodules[name] the current item from the fromList
                var importChain;

                for (i = 0; i < fromlist.length; i++) {
                    fromName = fromlist[i];

                    foundFromName = false;
                    found = Sk.sysmodules.sq$contains(name); // Check if "name" is inside sysmodules
                    if (found) {
                        // Check if the current fromName is already in the "name" module
                        foundFromName = Sk.sysmodules.mp$subscript(name)["$d"][fromName] != null;
                    }

                    // Only import from file system if we have not found the fromName in the current module
                    if (!foundFromName && fromName != "*" && ret["$d"][fromName] == null && (ret["$d"][lastDottedName] != null || ret["$d"].__name__.v == lastDottedName)) {
                        // add the module name to our requiredImport list
                        fromImportName = "" + name + "." + fromName;
                        fromImportModName = absolutePackagePrefix + fromImportName;
                        importChain = Sk.misceval.chain(importChain,
                            Sk.importModuleInternal_.bind(null, fromImportName, undefined, fromImportModName, undefined, isPackageRelative ? currentPackage: undefined, false, true)
                        );
                    }
                }

                return Sk.misceval.chain(importChain, function() {
                    // if there's a fromlist we want to return the actual module, not the
                    // toplevel namespace
                    ret = Sk.sysmodules.mp$subscript(absolutePackagePrefix + name);
                    goog.asserts.assert(ret);
                    return ret;
                });
            }

        }, function(ret) {
            if (saveSk !== Sk.globals) {
                Sk.globals = saveSk;
            }
            return ret;
        }
    );
};

Sk.importStar = function (module, loc, global) {
    var i;
    var props = Object["getOwnPropertyNames"](module["$d"]);
    for (i in props) {
        if (props[i].charAt(0) != "_") {
            loc[props[i]] = module["$d"][props[i]];
        }
    }
};

goog.exportSymbol("Sk.importMain", Sk.importMain);
goog.exportSymbol("Sk.importMainWithBody", Sk.importMainWithBody);
goog.exportSymbol("Sk.importBuiltinWithBody", Sk.importBuiltinWithBody);
goog.exportSymbol("Sk.builtin.__import__", Sk.builtin.__import__);
goog.exportSymbol("Sk.importStar", Sk.importStar);
