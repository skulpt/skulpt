(function() {
var globalsAtEnd = [];
for (var i in this)
    if (i !== "Sk" && i !== "JSON2" && i !== "sprintf")
        globalsAtEnd.push(i);
globalsAtEnd.sort();
if (___initialglobalslist.toString() !== globalsAtEnd.toString())
{
    print("FAILED: new globals other than 'Sk'");
    print("initial:", ___initialglobalslist);
    print("at end:", globalsAtEnd);
}
}());
