import time

class RandomError(Exception):
	def __init__(self, msg):
		self.msg = msg

	def __str__(self):
		return self.msg

"""	Class to generate random numbers using various algorithms.
"""
class Random:

	CMRG = 0	# Combined Multiple Recursive Generator
	MRG  = 1	# Multiple Recursive Generator

	def __init__(self, seed_value=None, algorithm_id=0):
		if seed_value is None:
			seed_value = int(time.time() * 1000)
		self.seed(seed_value,algorithm_id)

	""" Get or set the algorithm ID (resets the seed) """
	def algorithm(self, algorithm_id=None):
		if algorithm_id is None:
			return algorithm_id
		else:
			self.seed(algorithm_id=algorithm_id)

	""" Get or set the seed."""
	def seed(self, seed_value=None, algorithm_id=None):
		if seed_value is None:
			return self.seed_value

		self.seed_value = seed_value
		self.algorithm_id = algorithm_id
		if algorithm_id == Random.CMRG:
			self.cmrg_seed(seed_value)
		elif algorithm_id == Random.MRG:
			self.mrg_seed(seed_value)
		else:
			raise RandomError("Unrecognized algorithm_id specified.")

		#	Initialize generator constants
		if self.algorithm_id == Random.CMRG:
			self.a_1 = 0
			self.a_2 = 63308
			self.a_3 = 183326
			self.b_1 = 86098
			self.b_2 = 0
			self.b_3 = -539608
			self.m_1 = 2147483647 # = 2**31 - 1
			self.m_2 = 215483479
		if self.algorithm_id == Random.MRG:
			self.a_1 = 107374182
			self.a_2 = 1004480
			self.a_3 = 1004480
			self.a_4 = 1004480
			self.a_5 = 1004480
			self.m_0 = 2**31 - 1

	""" Internal function to set a seed for the CMRG algorithm"""
	def cmrg_seed(self, seed_value=None):
		if seed_value is None:
			seed_value = int(time.time() * 1000)
		
		self.seed_value = seed_value
		
		self.x_1 = seed_value % 4294944443
		self.y_1 = seed_value % 4294944442
		self.x_2 = seed_value % 4294944441
		self.y_2 = seed_value % 4294944440
		self.x_3 = seed_value % 4294944439
		self.y_3 = seed_value % 4294944438

		#print(self.x_1,self.y_1,self.x_2,self.y_2,self.x_3,self.y_3)
		
	""" Internal function to set a seed for the MRG algorithm"""
	def mrg_seed(self, seed_value=None):
		if seed_value is None:
			seed_value = int(time.time() * 1000)
			
		self.seed_value = seed_value

		self.x_1 = seed_value % 104729
		self.x_2 = seed_value % 104723
		self.x_3 = seed_value % 104717
		self.x_4 = seed_value % 104711
		self.x_5 = seed_value % 104707

		#print(self.x_1,self.x_2,self.x_3,self.x_4,self.x_5)

	""" Generate the next random number """
	def random(self):
		if self.algorithm_id == Random.CMRG:
			return self.random_cmrg()
		elif self.algorithm_id == Random.MRG:
			return self.random_mrg()
		else:
			raise RandomError("Invalid algorithm_id setting " + str(self.algorithm_id))

	""" Internal function to generate a random number with CMRG algorithm"""
	def random_cmrg(self):
		if self.algorithm_id != Random.CMRG:
			raise RandomError("Combined Multiple Recursive Generator is not the current algorithm.")
		x_n = ((self.a_1 * self.x_1) + (self.a_2 * self.x_2) + (self.a_3 * self.x_3)) % self.m_1
		y_n = ((self.b_1 * self.y_1) + (self.b_2 * self.y_2) + (self.b_3 * self.y_3)) % self.m_2

		self.x_3 = self.x_2
		self.y_3 = self.y_2

		self.x_2 = self.x_1
		self.y_2 = self.y_1

		self.x_1 = x_n
		self.y_1 = y_n

		return ((x_n - y_n) % self.m_1) / self.m_1

	""" Internal function to generate a random number with MRG algorithm"""
	def random_mrg(self):
		if self.algorithm_id != Random.MRG:
			raise RandomError("Multiple Recursive Generator is not the current algorithm.")

		x_n = ((self.a_1 * self.x_1) + (self.a_5 * self.x_5)) % self.m_0

		self.x_5 = self.x_4
		self.x_4 = self.x_3
		self.x_3 = self.x_2
		self.x_2 = self.x_1
		self.x_1 = x_n

		return x_n / self.m_0

	def info(self):
		if self.algorithm_id == Random.CMRG:
			print("Combined Mulitple Recursive Generator")
			print("Reference P. L'Ecuyer, “Combined Multiple Recursive Random Number Generators”, Operations Research, 44, 5 (1996), 816–822. ")
			print("Period ~ 10^56")
			print("State uses 6 words")
			print("Seed was ",self.seed_value)
		elif self.algorithm_id == Random.MRG:
			print("Mulitple Recursive Generator")
			print("Reference P. L'Ecuyer, F. Blouin, and R. Coutre, “A search for good multiple recursive random number generators”, ACM Transactions on Modeling and Computer Simulation 3, 87–98 (1993). ")
			print("Period ~ 10^46")
			print("State uses 5 words")
			print("Seed was ",self.seed_value)
		else:
			print("No valid algorithm set.")

