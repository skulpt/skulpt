if(0) {
goog.writeScriptTag_ = function(src)
{
    if (!goog.dependencies_.written[src])
    {
        goog.dependencies_.written[src] = true;
        goog.global.eval(goog.global.read("support/closure-library/closure/goog/" + src));
    }
};
}
