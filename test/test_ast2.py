import ast

func = ast.parse("def alpha(): pass")

assert func.body[0].name == "alpha"

assert func.body[0].__name__ == "FunctionDef"

func = ast.parse("lambda: 0")