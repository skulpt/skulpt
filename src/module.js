import { makeIntoTypeObj } from './type';
import { object } from './object';
export class module {
    /**
     * @constructor
     */

    ob$type = makeIntoTypeObj("module", module);
    tp$getattr = object.prototype.GenericGetAttr;
    tp$setattr = object.prototype.GenericSetAttr;
    tp$name = "module";
}
