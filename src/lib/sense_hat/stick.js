/**
 * Internal SenseHat Module for reading and writing values from
 * JavaScript World to the Python World. This modules set ups
 * the commmunication and allows to read and write pixels. If the
 * "Sk.sense_hat_emit" config is present, we emit events when
 * values are changed: Python -> JavaScript
 */
var $builtinmodule = function (name) {
    var mod = {};
    
    /**
     * Named InputEvent tuple
     */
    var input_event_fields = {
        "timestamp": "", 
        "key": "", 
        "state": "", 
    };
    var input_event_f = Sk.builtin.make_structseq('SenseStick', 'InputEvent', input_event_fields);
    mod.InputEvent = Sk.builtin.make_structseq('SenseStick', 'InputEvent', input_event_fields);

    var senseStickClass = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self) {
            // internal value storage
            self.v = {
                _stick_file: Sk.sense_hat.sensestick,
                _eventQueue: []
            }; 

            // static class props
            // not working!
            Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('SENSE_HAT_EVDEV_NAME'), new Sk.builtin.str('Raspberry Pi Sense HAT Joystick'));
            Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('EVENT_FORMAT'), new Sk.builtin.str('llHHI'));
            Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('EVENT_SIZE'), new Sk.builtin.int_(-1)); // undefined

            Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('EV_KEY'), new Sk.builtin.int_(0x01));

            Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('STATE_RELEASE'), new Sk.builtin.int_(0));
            Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('STATE_PRESS'), new Sk.builtin.int_(1));
            Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('STATE_HOLD'), new Sk.builtin.int_(2));

            Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('KEY_UP'), new Sk.builtin.int_(103));
            Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('KEY_LEFT'), new Sk.builtin.int_(105));
            Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('KEY_RIGHT'), new Sk.builtin.int_(106));
            Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('KEY_DOWN'), new Sk.builtin.int_(108));
            Sk.abstr.objectSetItem(self['$d'], new Sk.builtin.str('KEY_ENTER'), new Sk.builtin.int_(28));
        })

        $loc.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;

        $loc.__setattr__ = Sk.builtin.object.prototype.GenericSetAttr;

        $loc.__str__ = new Sk.builtin.func(function (self) {
            return new Sk.builtin.str('SenseStick')
        });

        $loc.__repr__ = new Sk.builtin.func(function (self) {
            return new Sk.builtin.str('SenseStick')
        });

        $loc.close = new Sk.builtin.func(function (self) {
            // close...
            return Sk.builtin.none.none$;
        });

        $loc.__exit__ = new Sk.builtin.func(function (self) {
            return Sk.misceval.callsim(mod.SenseStick.close, self);
        });

        $loc.__enter__ = new Sk.builtin.func(function (self) {
            // nothing todo here
            return self;
        });

        $loc._stick_device = new Sk.builtin.func(function (self) {
            // special skulpt handling, we do not have a real input device!
            throw new Sk.builtin.AttributeError('Calling internal method not allowed');
        });

        /**
         * Our read impl. is a little bit smaller than the original one, as we do not support
         * other event keys then sensestick ones. So, there is not need for iterating until a
         * sensestick event has occured.
         */
        $loc.read = new Sk.builtin.func(function (self) {
            var inputEvent;
            var susp = new Sk.misceval.Suspension();
            susp.resume = function () {
                // Should the post image get stuff go here??
                if (susp.data["error"]) {
                    if (susp.data.error === 'KeyboardInterrupt') {
                        throw new Error('KeyboardInterrupt');
                    } else {
                        throw new Sk.builtin.IOError('SenseStickDevice Error');
                    }
                }

                var tup = new mod.InputEvent([
                    Sk.builtin.int_(inputEvent.timestamp),
                    Sk.builtin.int_(inputEvent.key),
                    Sk.builtin.int_(inputEvent.state)
                ]);
                return tup;
            };
            susp.data = {
                type: "Sk.promise",
                promise: new Promise(function (resolve, reject) {
                    // Read from internal eventQueue
                    if (self.v._eventQueue.length > 0) {
                        inputEvent = self.v._eventQueue.pop();
                        resolve();
                    } else {
                        // add eventlistener
                        self.v._stick_file.once('sensestick.input', function (event, inputData) {
                            // Interrupt handling, so that we do not need to wait until the users inputs something
                            if (inputData.type === 'keyboardinterrupt') {
                                reject('KeyboardInterrupt');
                            }

                            inputEvent = inputData;
                            resolve();
                        });
                    }
                })
            };
            return susp;
        });

        /**
         * Wait until our sense stick file descriptor is ready for reading (has new data!)
         * 
         * When the timeout is specified, we return early: https://github.com/RPi-Distro/python-sense-hat/blob/master/sense_hat/stick.py#L73
         */
        $loc.wait = new Sk.builtin.func(function (self, timeout) {
            var _timeout;
            if (!timeout || timeout instanceof Sk.builtin.none) {
                _timeout = null;
            } else if (Sk.builtin.checkNumber(timeout)) {
                _timeout = Sk.ffi.remapToJs(timeout);
            }

            var timeoutHandle;
            var hasEvent = false;
            var susp = new Sk.misceval.Suspension();
            susp.resume = function () {
                // Should the post image get stuff go here??
                if (susp.data["error"]) {
                    if (susp.data.error === 'KeyboardInterrupt') {
                        throw new Error('KeyboardInterrupt');
                    } else {
                        throw new Sk.builtin.IOError('SenseStickDevice Error');
                    }
                }
                return Sk.builtin.bool(hasEvent);
            };
            susp.data = {
                type: "Sk.promise",
                promise: new Promise(function (resolve, reject) {
                    //if (Sk.sense_hat.sensestick.hasEvent()) {
                    //    hasEvent = true;
                    //    resolve();
                    //} else {
                        // Listen to new one, once
                        function handleKeyInput (event, inputData) {
                            
                            // Clear timeout
                            if (timeoutHandle) {
                                window.clearTimeout(timeoutHandle);
                            }

                            if (inputData.type === 'keyboardinterrupt') {
                                reject('KeyboardInterrupt');
                            }

                            // Store event in the internal queue
                            self.v._eventQueue.push(inputData);

                            hasEvent = true; // Set return value
                            resolve();
                        }

                        self.v._stick_file.once('sensestick.input', handleKeyInput);

                        timeoutHandle = setTimeout(function() {
                            self.v._stick_file.off('sensestick.input', handleKeyInput);
                            hasEvent = false; // Timeout passed before callback occured
                            resolve()
                        }, _timeout * 1000);
                    //}
                })
            };
            return susp;
        });

        $loc.__iter__ = new Sk.builtin.func(function (self) {

            // can read?

            // 

            throw new Sk.builtin.AttributeError('Not implemented');
        });
    };

    mod.SenseStick = Sk.misceval.buildClass(mod, senseStickClass, 'SenseStick', []);

    return mod;
};
