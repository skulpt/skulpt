#super simple makefile for regenerating the skulpt dist files

#user settings:
GENERATION_ARGS = --no-tests


#filename settings
skulpt_js_files            = dist/visnav_edx_skulpt.js
skulpt_js_stdlib           = dist/visnav_edx_skulpt-stdlib.js
skulpt_js_files_compressed = dist/visnav_edx_skulpt.min.js

dev_files     = $(skulpt_js_files) $(skulpt_js_stdlib)
release_files = $(skulpt_js_files_compressed) $(skulpt_js_stdlib)

#generation invokation
skulpt_dist_invokation = python2 skulpt.py dist


#default target
all: $(dev_files)

release: $(release_files)


#file generation target
$(skulpt_js_files):
	$(skulpt_dist_invokation) --only-uncompressed $(GENERATION_ARGS)

$(skulpt_js_files_compressed):
	$(skulpt_dist_invokation) $(GENERATION_ARGS)

#stdlib depends on all files in src/lib
$(skulpt_js_stdlib): $(shell find src/lib/ -type f)
	$(skulpt_dist_invokation) --only-stdlib $(GENERATION_ARGS)

#cleanup the dist folder
clean:
	rm -rf dist/
