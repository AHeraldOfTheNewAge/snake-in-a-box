# Example python code, for highlighting
num = int(input("Enter a number: "))

def is_prime(number):
    if number == 0 or number == 1:
        print(number, "is not a prime number")

        return

    if number > 1:
        for i in range(2, number):
            if (num % i) == 0:
                print(num, "is not a prime number")

                return

    print(num, "is a prime number")

is_prime(num)