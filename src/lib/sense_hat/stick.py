from _internal_sense_hat import InputEvent, _wait, _read, _start_stick_thread, _stop_stick_thread, _inspectFunction

DIRECTION_UP     = 'up'
DIRECTION_DOWN   = 'down'
DIRECTION_LEFT   = 'left'
DIRECTION_RIGHT  = 'right'
DIRECTION_MIDDLE = 'middle'

ACTION_PRESSED  = 'pressed'
ACTION_RELEASED = 'released'
ACTION_HELD     = 'held'

class SenseStick(object):
    """
    Represents the joystick on the Sense HAT.
    """
    SENSE_HAT_EVDEV_NAME = 'Raspberry Pi Sense HAT Joystick'
    EVENT_FORMAT = str('llHHI')
    #EVENT_SIZE = struct.calcsize(EVENT_FORMAT)

    EV_KEY = 0x01

    STATE_RELEASE = 0
    STATE_PRESS = 1
    STATE_HOLD = 2

    KEY_UP = 103
    KEY_LEFT = 105
    KEY_RIGHT = 106
    KEY_DOWN = 108
    KEY_ENTER = 28

    def __init__(self):
        self._callbacks = {}
        #self._stick_file = io.open(self._stick_device(), 'rb', buffering=0)
        self._callback_thread = False
        #self._callback_event = Event()

    def close(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, exc_tb):
        self.close()

    def _stick_device(self):
        """
        Discovers the filename of the evdev device that represents the Sense
        HAT's joystick.
        """
        pass

    def _key_to_direction(self, key):
        return {
            self.KEY_UP:    DIRECTION_UP,
            self.KEY_DOWN:  DIRECTION_DOWN,
            self.KEY_LEFT:  DIRECTION_LEFT,
            self.KEY_RIGHT: DIRECTION_RIGHT,
            self.KEY_ENTER: DIRECTION_MIDDLE,
        }[key]

    def _state_to_action(self, state):
        return {
            self.STATE_PRESS:   ACTION_PRESSED,
            self.STATE_RELEASE: ACTION_RELEASED,
            self.STATE_HOLD:    ACTION_HELD,
        }[state]

    def _read(self):
        """
        Reads a single event from the joystick, blocking until one is
        available. Returns `None` if a non-key event was read, or an
        `InputEvent` tuple describing the event otherwise.
        """

        # Read from internal sense_hat module
        event = _read()
        (timestamp, key, state, key_type) = event
        if key_type == self.EV_KEY:
            return InputEvent([
                timestamp,
                self._key_to_direction(key),
                self._state_to_action(state)
                ])
        else:
            return None

    def _wait(self, timeout=None):
        """
        Waits *timeout* seconds until an event is available from the
        joystick. Returns `True` if an event became available, and `False`
        if the timeout expired.
        """
        # Return from internal sense_hat module
        return _wait(timeout)

    def _wrap_callback(self, fn):
        return fn
        """
        # Shamelessley nicked (with some variation) from GPIO Zero :)
        @wraps(fn)
        def wrapper(event):
            return fn()

        if fn is None:
            return None
        elif not callable(fn):
            raise ValueError('value must be None or a callable')
        elif inspect.isbuiltin(fn):
            # We can't introspect the prototype of builtins. In this case we
            # assume that the builtin has no (mandatory) parameters; this is
            # the most reasonable assumption on the basis that pre-existing
            # builtins have no knowledge of InputEvent, and the sole parameter
            # we would pass is an InputEvent
            return wrapper
        else:
            # Try binding ourselves to the argspec of the provided callable.
            # If this works, assume the function is capable of accepting no
            # parameters and that we have to wrap it to ignore the event
            # parameter
            try:
                inspect.getcallargs(fn)
                return wrapper
            except TypeError:
                try:
                    # If the above fails, try binding with a single tuple
                    # parameter. If this works, return the callback as is
                    inspect.getcallargs(fn, ())
                    return fn
                except TypeError:
                    raise ValueError(
                        'value must be a callable which accepts up to one '
                        'mandatory parameter')
        """

    def _start_stop_thread(self):
        if self._callbacks and not self._callback_thread:
            #self._callback_event.clear()
            #self._callback_thread = Thread(target=self._callback_run)
            #self._callback_thread.daemon = True
            #self._callback_thread.start()
            _start_stick_thread(self._callback_run)
            self._callback_thread = True
        elif not self._callbacks and self._callback_thread:
            #self._callback_event.set()
            _stop_stick_thread()
            self._callback_thread = False

    def _callback_run(self):
        # Use this as the internal callback function from our
        # JavaScript event based callback system
        event = self._read()
        if event:
            callback = self._callbacks.get(event.direction)
            if callback:
                argsLength = _inspectFunction(callback)
                if argsLength == 1:
                    callback(event)
                else:
                    callback()

            callback = self._callbacks.get('*')
            if callback:
                argsLength = _inspectFunction(callback)
                if argsLength == 1:
                    callback(event)
                else:
                    callback()

    def wait_for_event(self, emptybuffer=False):
        """
        Waits until a joystick event becomes available.  Returns the event, as
        an `InputEvent` tuple.

        If *emptybuffer* is `True` (it defaults to `False`), any pending
        events will be thrown away first. This is most useful if you are only
        interested in "pressed" events.
        """
        if emptybuffer:
            while self._wait(0):
                self._read()
        while self._wait():
            event = self._read()
            if event:
                return event

    def get_events(self):
        """
        Returns a list of all joystick events that have occurred since the last
        call to `get_events`. The list contains events in the order that they
        occurred. If no events have occurred in the intervening time, the
        result is an empty list.
        """
        result = []
        while self._wait(0):
            event = self._read()
            if event:
                result.append(event)
        # Make sure returned events are sorted by timestamp
        results = sorted(result, key=lambda x: x.timestamp)
        return results

    @property
    def direction_up(self):
        """
        The function to be called when the joystick is pushed up. The function
        can either take a parameter which will be the `InputEvent` tuple that
        has occurred, or the function can take no parameters at all.
        """
        return self._callbacks.get(DIRECTION_UP)


    @direction_up.setter
    def direction_up(self, value):
        self._callbacks[DIRECTION_UP] = self._wrap_callback(value)
        self._start_stop_thread()

    @property
    def direction_down(self):
        """
        The function to be called when the joystick is pushed down. The
        function can either take a parameter which will be the `InputEvent`
        tuple that has occurred, or the function can take no parameters at all.

        Assign `None` to prevent this event from being fired.
        """
        return self._callbacks.get(DIRECTION_DOWN)

    @direction_down.setter
    def direction_down(self, value):
        self._callbacks[DIRECTION_DOWN] = self._wrap_callback(value)
        self._start_stop_thread()

    @property
    def direction_left(self):
        """
        The function to be called when the joystick is pushed left. The
        function can either take a parameter which will be the `InputEvent`
        tuple that has occurred, or the function can take no parameters at all.

        Assign `None` to prevent this event from being fired.
        """
        return self._callbacks.get(DIRECTION_LEFT)

    @direction_left.setter
    def direction_left(self, value):
        self._callbacks[DIRECTION_LEFT] = self._wrap_callback(value)
        self._start_stop_thread()

    @property
    def direction_right(self):
        """
        The function to be called when the joystick is pushed right. The
        function can either take a parameter which will be the `InputEvent`
        tuple that has occurred, or the function can take no parameters at all.

        Assign `None` to prevent this event from being fired.
        """
        return self._callbacks.get(DIRECTION_RIGHT)

    @direction_right.setter
    def direction_right(self, value):
        self._callbacks[DIRECTION_RIGHT] = self._wrap_callback(value)
        self._start_stop_thread()

    @property
    def direction_middle(self):
        """
        The function to be called when the joystick middle click is pressed. The
        function can either take a parameter which will be the `InputEvent` tuple
        that has occurred, or the function can take no parameters at all.

        Assign `None` to prevent this event from being fired.
        """
        return self._callbacks.get(DIRECTION_MIDDLE)

    @direction_middle.setter
    def direction_middle(self, value):
        self._callbacks[DIRECTION_MIDDLE] = self._wrap_callback(value)
        self._start_stop_thread()

    @property
    def direction_any(self):
        """
        The function to be called when the joystick is used. The function
        can either take a parameter which will be the `InputEvent` tuple that
        has occurred, or the function can take no parameters at all.

        This event will always be called *after* events associated with a
        specific action. Assign `None` to prevent this event from being fired.
        """
        return self._callbacks.get('*')

    @direction_any.setter
    def direction_any(self, value):
        self._callbacks['*'] = self._wrap_callback(value)
        self._start_stop_thread()
