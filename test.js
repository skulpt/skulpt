load("json2.js");
load("tokens.js");

function testTokenize(src, expected)
{
    // lame, done twice seems to canonicalize
    var got = JSON.stringify(JSON.parse(JSON.stringify(src.tokens())), null, 2);
    var expectedAsStr = JSON.stringify(JSON.parse(JSON.stringify(expected)), null, 2);
    if (got != expectedAsStr)
    {
        print("FAILED: " + src);
        print("got\n-----\n" + got + "\n-----\n");
        print("expected\n-----\n" + expectedAsStr + "\n-----\n");
    }
}

testTokenize("a", [
            {from: 0, to: 1, value: 'a', type: 'name'},
            {from: 1, to: 1, value: '\n', type: 'nl'}
        ]);
