var deprecatedError = new Sk.builtin.ExternalError("Sk.builtin.nmber is deprecated.");

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ constructors instead.
 * If you do not know at complile time which type of number, use Sk.builtin.assk$.
 */
Sk.builtin.nmber = function (x, skType)    /* number is a reserved word */ {
    throw new Sk.builtin.ExternalError("Sk.builtin.nmber is deprecated. Please replace with Sk.builtin.int_, Sk.builtin.float_, or Sk.builtin.assk$.");
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.tp$index = function () {
    return this.v;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.tp$hash = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.fromInt$ = function (ival) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.clone = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.toFixed = function (x) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$add = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$subtract = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$multiply = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$divide = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$floor_divide = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$remainder = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$divmod = function (other) {
    throw deprecatedError;

};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$power = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$and = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$or = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$xor = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$lshift = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$rshift = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_add = Sk.builtin.nmber.prototype.nb$add;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_subtract = Sk.builtin.nmber.prototype.nb$subtract;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_multiply = Sk.builtin.nmber.prototype.nb$multiply;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_divide = Sk.builtin.nmber.prototype.nb$divide;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_remainder = Sk.builtin.nmber.prototype.nb$remainder;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_floor_divide = Sk.builtin.nmber.prototype.nb$floor_divide;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_power = Sk.builtin.nmber.prototype.nb$power;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_and = Sk.builtin.nmber.prototype.nb$and;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_or = Sk.builtin.nmber.prototype.nb$or;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_xor = Sk.builtin.nmber.prototype.nb$xor;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_lshift = Sk.builtin.nmber.prototype.nb$lshift;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$inplace_rshift = Sk.builtin.nmber.prototype.nb$rshift;

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$negative = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$positive = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$nonzero = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$isnegative = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.nb$ispositive = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.numberCompare = function (other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.__eq__ = function (me, other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.__ne__ = function (me, other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.__lt__ = function (me, other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.__le__ = function (me, other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.__gt__ = function (me, other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.__ge__ = function (me, other) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.__round__ = function (self, ndigits) {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype["$r"] = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.tp$str = function () {
    throw deprecatedError;
};

/**
 * @deprecated Please use Sk.builtin.int_ or Sk.builtin.float_ instead.
 */
Sk.builtin.nmber.prototype.str$ = function (base, sign) {
    throw deprecatedError;
};

goog.exportSymbol("Sk.builtin.nmber", Sk.builtin.nmber);
