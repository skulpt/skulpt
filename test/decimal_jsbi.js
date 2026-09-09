// Run the public Decimal regressions through Skulpt's arbitrary-precision fallback.
global.BigInt = undefined;
process.argv = [process.execPath, __filename, "--python3", "--module", "skulpt_decimal_bugs"];
require("./testunit.js");
