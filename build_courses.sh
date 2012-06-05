#!/bin/bash

make COURSEID=thinkcspy LOGINREQ=false COURSEURL=http://interactivepython.org thinkcspy
rm -r static/thinkcspy/doctrees
./deploy.sh static/thinkcspy
make COURSEID=pythonds LOGINREQ=false COURSEURL=http://interactivepython.org pythonds
rm -r static/pythonds/doctrees
./deploy.sh static/pythonds
make COURSEID=luther151 LOGINREQ=true COURSEURL=http://interactivepython.org pythonds
rm -r static/luther151/doctrees
./deploy.sh static/luther151
make COURSEID=unics1140 LOGINREQ=true COURSEURL=http://interactivepython.org thinkcspy
rm -r static/unics1140/doctrees
./deploy.sh static/unics1140
make COURSEID=gatech LOGINREQ=true COURSEURL=http://interactivepython.org thinkcspy
rm -r static/gatech/doctrees
./deploy.sh static/gatech
make COURSEID=devcourse LOGINREQ=false COURSEURL=http://interactivepython.org html
rm -r static/devcourse/doctrees
./deploy.sh static/devcourse
