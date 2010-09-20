#!/bin/sh
#
# San Angeles Observation OpenGL ES version example
#
# This shell script builds the demo application
# with executable name "SanOGLES".
#
# Before running it, make sure that either libGLES_CM.so
# or libGLES_CL.so is available in the library path.
# Alternatively you can copy one of them to the same
# directory with the executable, and start the executable
# with this command:
#     LD_LIBRARY_PATH=. ./SanOGLES
#
# $Id: build.sh,v 1.3 2005/02/08 19:18:10 tonic Exp $
# $Revision: 1.3 $

CC=gcc
SRC="demo.c importgl.c app-linux.c"
OUT=SanOGLES
CFLAGS="-I include -Wall"
LDFLAGS="-L /usr/X11R6/lib -lX11 -lm"
$CC -o $OUT $SRC $CFLAGS $LDFLAGS
