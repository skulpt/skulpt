/* 
 * @fileoverview
 * Defines a Sound class for PyAngelo, wrapping Howler.js to load,
 * play, pause, stop, and manipulate audio. Methods return None for
 * setters, and appropriate values for getters.
 */

/**
 * Constructor: load audio via Howl and return a Suspension.
 *
 * @param {Sound} self   The new Sound instance
 * @param {string} file  Path to the audio file
 * @returns {Sk.misceval.Suspension} Resolves to None when loaded
 */
const initSound = function(self, file) {
    Sk.builtin.pyCheckArgsLen("__init__", arguments.length, 2, 2);
    const susp = new Sk.misceval.Suspension();
    susp.resume = function() {
        if (susp.data.error) {
            throw new Sk.builtin.IOError(susp.data.error.message);
        }
        return susp.data.result;
    };
    susp.data = {
        type: "Sk.promise",
        promise: new Promise((resolve) => {
            const howl = new Howl({
                src: [Sk.ffi.remapToJs(file)],
                onload: () => {
                    self.sound = howl;
                    self.file = Sk.ffi.remapToJs(file);
                    Sk.PyAngelo.sounds[self.file] = howl;
                    Sk.PyAngelo.soundInstances.push(self.sound);
                    resolve(Sk.builtin.none.none$);
                },
                onloaderror: (_id, _err) => {
                    // capture error but resolve to avoid unhandled promise
                    susp.data.error = new Error("Could not load sound " + Sk.ffi.remapToJs(file));
                    resolve(Sk.builtin.none.none$);
                }
            });
        }).catch(err => {
            susp.data.error = err;
            return Sk.builtin.none.none$;
        })
    };
    return susp;
};
initSound.co_name     = "__init__";
initSound.co_varnames = ["self","file"];
initSound.co_argcount = 2;
initSound.func_doc =
    "__init__(file: str) -> None\n\n" +
    "Loads an audio file asynchronously via Howl and stores it as .sound.";

/**
 * Start playback
 *
 * @param {Sound} self          The Sound instance
 * @returns {None}
 */
const playMethod = function(self) {
    Sk.builtin.pyCheckArgsLen("play", arguments.length, 1, 1);
    // resume if we have an ID, or start fresh
    if (self._soundId !== undefined) {
        self.sound.play(self._soundId);
    } else {
        self._soundId = self.sound.play();
    }
    return Sk.builtin.none.none$;
};
playMethod.co_name    = "play";
playMethod.co_argcount = 1;
playMethod.func_doc  =
   "play() -> None\n\n" +
   "Start or resume playback (uses stored loop/volume settings).";

/**
 * Pause playback.
 *
 * @param {Sound} self  The Sound instance
 * @returns {None}
 */
const pauseMethod = function(self) {
    Sk.builtin.pyCheckArgsLen("pause", arguments.length, 1, 1);
    // pause the current playback instance (if we know its ID)
    if (self._soundId !== undefined) {
        self.sound.pause(self._soundId);
    } else {
        self.sound.pause();
    }
    return Sk.builtin.none.none$;
};
pauseMethod.co_name     = "pause";
pauseMethod.co_argcount = 1;
pauseMethod.func_doc =
    "pause() -> None\n\n" +
    "Pause playback.";

/**
 * Stop playback and reset position.
 *
 * @param {Sound} self  The Sound instance
 * @returns {None}
 */
const stopMethod = function(self) {
    Sk.builtin.pyCheckArgsLen("stop", arguments.length, 1, 1);
    // stop and clear our stored ID so next play() starts from zero
    if (self._soundId !== undefined) {
        self.sound.stop(self._soundId);
        delete self._soundId;
    } else {
        self.sound.stop();
    }
    return Sk.builtin.none.none$;
};
stopMethod.co_name      = "stop";
stopMethod.co_argcount  = 1;
stopMethod.func_doc =
    "stop() -> None\n\n" +
    "Stop playback and reset position.";

/**
 * Check if the sound is currently playing.
 *
 * @param {Sound} self  The Sound instance
 * @returns {boolean}   True if playing, False otherwise
 */
const isPlayingMethod = function(self) {
    Sk.builtin.pyCheckArgsLen("isPlaying", arguments.length, 1, 1);
    return Sk.ffi.remapToPy(self.sound.playing());
};
isPlayingMethod.co_name     = "isPlaying";
isPlayingMethod.co_varnames  = ["self"];
isPlayingMethod.co_argcount  = 1;
isPlayingMethod.func_doc =
    "isPlaying() -> bool\n\n" +
    "Return True if the sound is playing, False otherwise.";

/**
 * Get or set playback position in seconds.
 *
 * @param {Sound} self          The Sound instance
 * @param {number} [position]   New position (omit to query)
 * @returns {number|None}  Returns position if querying, else None
 */
const seekMethod = function(self, position) {
    // Allow either seek() or seek(position)
    Sk.builtin.pyCheckArgsLen("seek", arguments.length, 1, 2);

    // — setter: if the user passed a real number (not the default None)
    if (position !== Sk.builtin.none.none$) {
        const jsPos = Sk.ffi.remapToJs(position);
        if (typeof jsPos !== "number" || !Number.isFinite(jsPos)) {
            throw new Sk.builtin.TypeError("position must be a finite number");
        }
        const dur = self.sound.duration();
        if (jsPos < 0.0 || jsPos > dur) {
            throw new Sk.builtin.ValueError(
                `seek position must be between 0.0 and ${dur.toFixed(3)}`
            );
        }
        if (self._soundId !== undefined) {
            // Seek on the existing playback instance
            self.sound.seek(jsPos, self._soundId);
        } else {
            // No instance yet → seek on the default/first sound
            self.sound.seek(jsPos);
        }
        return Sk.builtin.none.none$;
    }

    // — getter: before play() → 0.0, otherwise query our playback id
    const jsTime = (self._soundId !== undefined)
        ? self.sound.seek(undefined, self._soundId)
        : self.sound.seek();
    return Sk.ffi.remapToPy(jsTime);
};
seekMethod.co_name     = "seek";
seekMethod.co_varnames = ["self", "position"];
seekMethod.co_argcount = 2;
// Supply a default of None for the 'position' parameter
seekMethod.$defaults   = [null, Sk.builtin.none.none$];
seekMethod.func_doc    =
    "seek(position: float=None) -> float or None\n\n" +
    "Without args, returns current playback time (0.0 before play()).\n" +
    "With position, jumps to that time and returns None.";

/**
 * Get or set playback rate (speed multiplier).
 *
 * @param {Sound} self          The Sound instance
 * @param {number} [speed]      New rate (omit to query)
 * @returns {number|None}  Returns rate if querying, else None
 */
const rateMethod = function(self, speed) {
    Sk.builtin.pyCheckArgsLen("rate", arguments.length, 1, 2);

    // — setter: only when caller passed a real number (not the default None)
    if (speed !== Sk.builtin.none.none$) {
        const jsRate = Sk.ffi.remapToJs(speed);
        if (typeof jsRate !== "number" || !Number.isFinite(jsRate)) {
            throw new Sk.builtin.TypeError("rate must be a finite number");
        }
        if (jsRate <= 0.0) {
            throw new Sk.builtin.ValueError("rate must be greater than 0");
        }
        self.sound.rate(jsRate);
        return Sk.builtin.none.none$;
    }

    // — getter: query the rate for our instance (or default)
    const current = self.sound.rate();
    return Sk.ffi.remapToPy(current);
};
rateMethod.co_name     = "rate";
rateMethod.co_varnames = ["self","speed"];
rateMethod.co_argcount = 2;
rateMethod.$defaults = [null, Sk.builtin.none.none$];
rateMethod.func_doc =
    "rate(speed: float=None) -> float or None\n\n" +
    "If speed provided, set and return None; otherwise return current playback rate.";

/**
 * Get or set playback volume (0.0–1.0).
 *
 * @param {Sound} self          The Sound instance
 * @param {number} [level]      New volume (omit to query)
 * @returns {number|None}  Returns volume if querying, else None
 */
const volumeMethod = function(self, level) {
    Sk.builtin.pyCheckArgsLen("volume", arguments.length, 1, 2);
    // setter: only when a real number (not the default None) is passed
    if (level !== Sk.builtin.none.none$) {
        const jsLevel = Sk.ffi.remapToJs(level);
        // validate
        if (typeof jsLevel !== "number" || !Number.isFinite(jsLevel)) {
            throw new Sk.builtin.TypeError("volume must be a finite number");
        }
        if (jsLevel < 0.0 || jsLevel > 1.0) {
            throw new Sk.builtin.ValueError("volume must be between 0.0 and 1.0");
        }
        self.sound.volume(jsLevel);
        return Sk.builtin.none.none$;
    }
    const v = self.sound.volume();
    return Sk.ffi.remapToPy(v);
};
volumeMethod.co_name     = "volume";
volumeMethod.co_varnames = ["self","level"];
volumeMethod.co_argcount = 2;
volumeMethod.$defaults = [null, Sk.builtin.none.none$];
volumeMethod.func_doc =
    "volume(level: float=None) -> float or None\n\n" +
    "If level provided, set and return None; otherwise return current volume.";

/**
 * Get or set loop state.
 *
 * @param {Sound}    self  The Sound instance
 * @param {boolean} [loop] True to enable looping, False to disable
 * @returns {boolean|None}  Returns current looping state if no arg, else None
 */
const loopMethod = function(self, loop) {
    Sk.builtin.pyCheckArgsLen("loop", arguments.length, 1, 2);

    // setter: only when caller passed a real boolean (not the default None)
    if (loop !== Sk.builtin.none.none$) {
        const jsLoop = Sk.ffi.remapToJs(loop);
        if (typeof jsLoop !== "boolean") {
            throw new Sk.builtin.TypeError("loop state must be a boolean");
        }
        self.sound.loop(jsLoop);
        return Sk.builtin.none.none$;
    }

    // getter: return the current looping state
    return Sk.ffi.remapToPy(self.sound.loop());
};
loopMethod.co_name     = "loop";
loopMethod.co_varnames = ["self","loop"];
loopMethod.co_argcount = 2;
loopMethod.$defaults   = [null, Sk.builtin.none.none$];
loopMethod.func_doc    =
    "loop(state: bool=None) -> bool or None\n\n" +
    "If state provided, set looping; otherwise return current loop state.";

/**
 * Get or set muted state.
 *
 * @param {Sound} self            The Sound instance
 * @param {boolean} [muted]       True to mute, False to unmute
 * @returns {boolean|None}  Returns muted state if querying, else None
 */
const muteMethod = function(self, muted) {
    Sk.builtin.pyCheckArgsLen("mute", arguments.length, 1, 2);

    // setter: only when caller passed a real boolean (not default None)
    if (muted !== Sk.builtin.none.none$) {
        const jsMuted = Sk.ffi.remapToJs(muted);
        if (typeof jsMuted !== "boolean") {
            throw new Sk.builtin.TypeError("mute state must be a boolean");
        }
        self.sound.mute(jsMuted);
        return Sk.builtin.none.none$;
    }

    // getter: return the current muted state
    return Sk.ffi.remapToPy(self.sound.mute());
};
muteMethod.co_name     = "mute";
muteMethod.co_varnames = ["self","muted"];
muteMethod.co_argcount = 2;
muteMethod.$defaults = [null, Sk.builtin.none.none$];
muteMethod.func_doc =
    "mute(muted: bool=None) -> bool or None\n\n" +
    "If muted provided, set mute and return None; otherwise return current muted state.";

/**
 * Fade volume from one level to another over a duration.
 *
 * @param {Sound} self        The Sound instance
 * @param {number} fromVol    Starting volume (0.0–1.0)
 * @param {number} toVol      Ending volume (0.0–1.0)
 * @param {number} duration   Duration in milliseconds
 * @returns {None}
 */
const fadeMethod = function(self, fromVol, toVol, duration) {
    Sk.builtin.pyCheckArgsLen("fade", arguments.length, 4, 4);
    // — setter: fade from “from” → “to” over “duration” seconds
    const jsFrom   = Sk.ffi.remapToJs(fromVol);
    const jsTo     = Sk.ffi.remapToJs(toVol);
    const jsDurSec = Sk.ffi.remapToJs(duration);
    [jsFrom, jsTo].forEach(v => {
        if (typeof v !== "number" || v < 0.0 || v > 1.0) {
            throw new Sk.builtin.ValueError("fade levels must be 0.0–1.0");
        }
    });
    if (typeof jsDurSec !== "number" || jsDurSec < 0.0) {
        throw new Sk.builtin.ValueError("fade duration must be ≥ 0");
    }
    // convert to milliseconds for Howler
    const jsDurMs = Math.round(jsDurSec * 1000);
    self.sound.fade(jsFrom, jsTo, jsDurMs);
    return Sk.builtin.none.none$;
};
fadeMethod.co_name      = "fade";
fadeMethod.co_varnames  = ["self","fromVol","toVol","duration"];
fadeMethod.co_argcount  = 4;
fadeMethod.func_doc =
    "fade(fromVol: float, toVol: float, duration: int) -> None\n\n" +
    "Fade volume from fromVol to toVol (both 0.0-1.0) over duration (seconds).";

/**
 * Get total duration of the sound in seconds.
 *
 * @param {Sound} self    The Sound instance
 * @returns {number}    Total length in seconds
 */
const durationMethod = function(self) {
    Sk.builtin.pyCheckArgsLen("duration", arguments.length, 1, 1);
    const d = self.sound.duration();
    return Sk.ffi.remapToPy(d);
};
durationMethod.co_name     = "duration";
durationMethod.co_varnames  = ["self"];
durationMethod.co_argcount  = 1;
durationMethod.func_doc =
    "duration() -> float\n\nGet total duration of the sound in seconds.";

/**
 * Unload the sound and free resources.
 *
 * @param {Sound} self  The Sound instance
 * @returns {None}
 */
const disposeMethod = function(self) {
    Sk.builtin.pyCheckArgsLen("dispose", arguments.length, 1, 1);

    // 1) Stop & unload the Howler sound
    try {
        if (self._soundId !== undefined) {
            self.sound.stop(self._soundId);
        }
        if (typeof self.sound.unload === "function") {
            self.sound.unload();
        }
    } catch (e) {
        // ignore any teardown errors
    }

    // 2) Remove from the filename→instance registry if it still points here
    if (Sk.PyAngelo.sounds && Sk.PyAngelo.sounds[self.file] === self.sound) {
        delete Sk.PyAngelo.sounds[self.file];
    }

    // 3) Remove from the array of all instances
    if (Array.isArray(Sk.PyAngelo.soundInstances)) {
        Sk.PyAngelo.soundInstances =
            Sk.PyAngelo.soundInstances.filter(snd => snd !== self.sound);
    }

    return Sk.builtin.none.none$;
};
disposeMethod.co_name     = "dispose";
disposeMethod.co_argcount = 1;
disposeMethod.func_doc =
    "dispose() -> None\n\nUnload the sound and free resources.";

/**
 * Stop all playing sounds globally.
 *
 * Can be called as either:
 *   Sound.stopAll()
 *   music.stopAll()
 */
const stopAllMethod = function(self) {
    // Expect exactly one argument (the class or the instance)
    Sk.builtin.pyCheckArgsLen("stopAll", arguments.length, 1, 1);

    // Invoke the Skulpt helper to stop every Howler sound
    Sk.builtin.stopAllSounds();
    return Sk.builtin.none.none$;
};
stopAllMethod.co_name     = "stopAll";
stopAllMethod.co_varnames = ["self"];
stopAllMethod.co_argcount = 1;
stopAllMethod.$defaults   = [Sk.builtin.none.none$];

/**
 * Sound class definition and registration with Skulpt.
 *
 * @class Sound
 * @classdesc Wraps Howler.js to provide Pythonic audio control.
 */
const soundClass = function($gbl, $loc) {
    $loc.__init__   = new Sk.builtin.func(initSound);
    $loc.play       = new Sk.builtin.func(playMethod);
    $loc.pause      = new Sk.builtin.func(pauseMethod);
    $loc.stop       = new Sk.builtin.func(stopMethod);
    $loc.isPlaying  = new Sk.builtin.func(isPlayingMethod);
    $loc.seek       = new Sk.builtin.func(seekMethod);
    $loc.rate       = new Sk.builtin.func(rateMethod);
    $loc.volume     = new Sk.builtin.func(volumeMethod);
    $loc.loop       = new Sk.builtin.func(loopMethod);
    $loc.mute       = new Sk.builtin.func(muteMethod);
    $loc.fade       = new Sk.builtin.func(fadeMethod);
    $loc.duration   = new Sk.builtin.func(durationMethod);
    $loc.dispose    = new Sk.builtin.func(disposeMethod);
    $loc.stopAll    = new Sk.builtin.func(stopAllMethod);

    $loc.__repr__   = new Sk.builtin.func(function(self) {
        return new Sk.builtin.str("Sound(" + self.file + ")");
    });
};
Sk.builtin.Sound = soundClass;
Sk.builtins["Sound"] = Sk.misceval.buildClass(
    Sk.builtin, Sk.builtin.Sound, "Sound", []
);
Sk.builtins["Sound"].prototype.$doc =
    "Represents a sound that can be loaded, played, paused, stopped, " +
    "and manipulated via Howler.js. Methods return None for setters, " +
    "and appropriate values for getters.";
