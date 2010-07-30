(function() {
var globalsAtEnd = [];
for (var i in this)
    if (i !== "Sk" && i !== "JSON2" && i !== "sprintf" && i !== "COMPILED" && i !== "goog")
        globalsAtEnd.push(i);
globalsAtEnd.sort();
if (___initialglobalslist.toString() !== globalsAtEnd.toString())
{
    print("FAILED: new globals other than 'Sk' and 'goog'");
    print("initial:", ___initialglobalslist);
    print("at end:", globalsAtEnd);
}
}());
