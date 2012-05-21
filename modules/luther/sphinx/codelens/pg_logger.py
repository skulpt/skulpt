# Online Python Tutor
# Copyright (C) 2010 Philip J. Guo (philip@pgbovine.net)
# https://github.com/pgbovine/OnlinePythonTutor/
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.


# This is the meat of the Online Python Tutor back-end.  It implements a
# full logger for Python program execution (based on pdb, the standard
# Python debugger imported via the bdb module), printing out the values
# of all in-scope data structures after each executed instruction.

# Note that I've only tested this logger on Python 2.5, so it will
# probably fail in subtle ways on other Python 2.X (and will DEFINITELY
# fail on Python 3.X).


# upper-bound on the number of executed lines, in order to guard against
# infinite loops
MAX_EXECUTED_LINES = 1000


import sys
import bdb # the KEY import here!
import os
import re
import traceback

import cStringIO
import pg_encoder
import json

IGNORE_VARS = set(('__stdout__', '__builtins__', '__name__', '__exception__'))

def get_user_stdout(frame):
  return frame.f_globals['__stdout__'].getvalue()

def get_user_globals(frame):
  d = filter_var_dict(frame.f_globals)
  # also filter out __return__ for globals only, but NOT for locals
  if '__return__' in d:
    del d['__return__']
  return d

def get_user_locals(frame):
  return filter_var_dict(frame.f_locals)

def filter_var_dict(d):
  ret = {}
  for (k,v) in d.iteritems():
    if k not in IGNORE_VARS:
      ret[k] = v
  return ret


class PGLogger(bdb.Bdb):

    def __init__(self, finalizer_func, ignore_id=False):
        bdb.Bdb.__init__(self)
        self.mainpyfile = ''
        self._wait_for_mainpyfile = 0

        # a function that takes the output trace as a parameter and
        # processes it
        self.finalizer_func = finalizer_func

        # each entry contains a dict with the information for a single
        # executed line
        self.trace = []

        # don't print out a custom ID for each object
        # (for regression testing)
        self.ignore_id = ignore_id


    def reset(self):
        bdb.Bdb.reset(self)
        self.forget()

    def forget(self):
        self.lineno = None
        self.stack = []
        self.curindex = 0
        self.curframe = None

    def setup(self, f, t):
        self.forget()
        self.stack, self.curindex = self.get_stack(f, t)
        self.curframe = self.stack[self.curindex][0]


    # Override Bdb methods

    def user_call(self, frame, argument_list):
        """This method is called when there is the remote possibility
        that we ever need to stop in this function."""
        if self._wait_for_mainpyfile:
            return
        if self.stop_here(frame):
            self.interaction(frame, None, 'call')

    def user_line(self, frame):
        """This function is called when we stop or break at this line."""
        if self._wait_for_mainpyfile:
            if (self.canonic(frame.f_code.co_filename) != "<string>" or 
                frame.f_lineno <= 0):
                return
            self._wait_for_mainpyfile = 0
        self.interaction(frame, None, 'step_line')

    def user_return(self, frame, return_value):
        """This function is called when a return trap is set here."""
        frame.f_locals['__return__'] = return_value
        self.interaction(frame, None, 'return')

    def user_exception(self, frame, exc_info):
        exc_type, exc_value, exc_traceback = exc_info
        """This function is called if an exception occurs,
        but only if we are to stop at or just below this level."""
        frame.f_locals['__exception__'] = exc_type, exc_value
        if type(exc_type) == type(''):
            exc_type_name = exc_type
        else: exc_type_name = exc_type.__name__
        self.interaction(frame, exc_traceback, 'exception')


    # General interaction function

    def interaction(self, frame, traceback, event_type):
        self.setup(frame, traceback)
        tos = self.stack[self.curindex]
        lineno = tos[1]

        # each element is a pair of (function name, ENCODED locals dict)
        encoded_stack_locals = []

        # climb up until you find '<module>', which is (hopefully) the global scope
        i = self.curindex
        while True:
          cur_frame = self.stack[i][0]
          cur_name = cur_frame.f_code.co_name
          if cur_name == '<module>':
            break

          # special case for lambdas - grab their line numbers too
          if cur_name == '<lambda>':
            cur_name = 'lambda on line ' + str(cur_frame.f_code.co_firstlineno)
          elif cur_name == '':
            cur_name = 'unnamed function'

          # encode in a JSON-friendly format now, in order to prevent ill
          # effects of aliasing later down the line ...
          encoded_locals = {}
          for (k, v) in get_user_locals(cur_frame).iteritems():
            # don't display some built-in locals ...
            if k != '__module__':
              encoded_locals[k] = pg_encoder.encode(v, self.ignore_id)

          encoded_stack_locals.append((cur_name, encoded_locals))
          i -= 1

        # encode in a JSON-friendly format now, in order to prevent ill
        # effects of aliasing later down the line ...
        encoded_globals = {}
        for (k, v) in get_user_globals(tos[0]).iteritems():
          encoded_globals[k] = pg_encoder.encode(v, self.ignore_id)

        trace_entry = dict(line=lineno,
                           event=event_type,
                           func_name=tos[0].f_code.co_name,
                           globals=encoded_globals,
                           stack_locals=encoded_stack_locals,
                           stdout=get_user_stdout(tos[0]))

        # if there's an exception, then record its info:
        if event_type == 'exception':
          # always check in f_locals
          exc = frame.f_locals['__exception__']
          trace_entry['exception_msg'] = exc[0].__name__ + ': ' + str(exc[1])

        self.trace.append(trace_entry)

        if len(self.trace) >= MAX_EXECUTED_LINES:
          self.trace.append(dict(event='instruction_limit_reached', exception_msg='(stopped after ' + str(MAX_EXECUTED_LINES) + ' steps to prevent possible infinite loop)'))
          self.force_terminate()

        self.forget()


    def _runscript(self, script_str):
        # When bdb sets tracing, a number of call and line events happens
        # BEFORE debugger even reaches user's code (and the exact sequence of
        # events depends on python version). So we take special measures to
        # avoid stopping before we reach the main script (see user_line and
        # user_call for details).
        self._wait_for_mainpyfile = 1

        # ok, let's try to sorta 'sandbox' the user script by not
        # allowing certain potentially dangerous operations:
        user_builtins = {}
        for (k,v) in __builtins__.iteritems():
          if k in ('reload', 'input', 'apply', 'open', 'compile', 
                   '__import__', 'file', 'eval', 'execfile',
                   'exit', 'quit', 'raw_input', 
                   'dir', 'globals', 'locals', 'vars',
                   'compile'):
            continue
          user_builtins[k] = v

        # redirect stdout of the user program to a memory buffer
        user_stdout = cStringIO.StringIO()
        sys.stdout = user_stdout
 
        user_globals = {"__name__"    : "__main__",
                        "__builtins__" : user_builtins,
                        "__stdout__" : user_stdout}

        try:
          self.run(script_str, user_globals, user_globals)
        # sys.exit ...
        except SystemExit:
          sys.exit(0)
        except:
          #traceback.print_exc() # uncomment this to see the REAL exception msg

          trace_entry = dict(event='uncaught_exception')

          exc = sys.exc_info()[1]
          if hasattr(exc, 'lineno'):
            trace_entry['line'] = exc.lineno
          if hasattr(exc, 'offset'):
            trace_entry['offset'] = exc.offset

          if hasattr(exc, 'msg'):
            trace_entry['exception_msg'] = "Error: " + exc.msg
          else:
            trace_entry['exception_msg'] = "Unknown error"

          self.trace.append(trace_entry)
          self.finalize()
          #sys.exit(0) # need to forceably STOP execution

    def force_terminate(self):
      self.finalize()
      sys.exit(0) # need to forceably STOP execution


    def finalize(self):
      sys.stdout = sys.__stdout__
      assert len(self.trace) <= (MAX_EXECUTED_LINES + 1)

      # filter all entries after 'return' from '<module>', since they
      # seem extraneous:
      res = []
      for e in self.trace:
        res.append(e)
        if e['event'] == 'return' and e['func_name'] == '<module>':
          break

      # another hack: if the SECOND to last entry is an 'exception'
      # and the last entry is return from <module>, then axe the last
      # entry, for aesthetic reasons :)
      if len(res) >= 2 and \
         res[-2]['event'] == 'exception' and \
         res[-1]['event'] == 'return' and res[-1]['func_name'] == '<module>':
        res.pop()

      self.trace = res

      #for e in self.trace: print e

      return self.finalizer_func(self.trace)


# the MAIN meaty function!!!
def exec_script_str(script_str, finalizer_func, ignore_id=False):
  logger = PGLogger(finalizer_func, ignore_id)
  logger._runscript(script_str)
  return logger.finalize()


def exec_file_and_pretty_print(mainpyfile):
  import pprint

  if not os.path.exists(mainpyfile):
    print 'Error:', mainpyfile, 'does not exist'
    sys.exit(1)

  def pretty_print(output_lst):
    for e in output_lst:
      pprint.pprint(e)

  output_lst = exec_script_str(open(mainpyfile).read(), web_finalizer)
  print output_lst
  
def web_finalizer(output_lst):
  # use compactly=False to produce human-readable JSON,
  # except at the expense of being a LARGER download
  output_json = json.dumps(output_lst)
  return output_json

if __name__ == '__main__':
  # need this round-about import to get __builtins__ to work :0
  import pg_logger
  pg_logger.exec_file_and_pretty_print(sys.argv[1])

