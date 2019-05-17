# Used by test_import.py

import importable_module

imported_version = importable_module.version

# Test ability to abort part-way through lookup
import subpackage.importable_module_2
