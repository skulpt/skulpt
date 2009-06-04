def factorial(n):
    product = 1
    for number in range(n, 1, -1):
        product *= number
    return product
