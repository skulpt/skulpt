function publish(symbolSet)
{
    var allSymbols = symbolSet.toArray();
    for (var i = 0; i < allSymbols.length; ++i)
    {
        var sym = allSymbols[i];
        if (sym.isa === "CONSTRUCTOR")
        {
            var all = [];
            var parts = sym.alias.split(".");
            for (var j = 0; j < parts.length; ++j)
            {
                if (j === 0)
                    all.push("window." + parts[0]);
                else
                    all.push(parts.slice(0, j + 1).join("."));
            }
            print("if (" + all.join(" && ") + ") " + sym.alias + ".$isctor=true;");
        }
    }
}
