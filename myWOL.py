import socket
import re
import psutil
import binascii

class WakeOnLan:
	class Adapter:
		def __init__(self):
			self.name = None
			self.ip = None
			self.mac = None

	def __init__(self):
		self.__d_ip_address = "255.255.255.255"
		self.__d_port = 9
		self.sep = '' # MAC address separator
		self.network_if = self.Adapter()
	
	def is_mac_address(self, mac, update_sep = True):
		pattern = r"([0-9A-Fa-f]{2}[-:\s]){5}[0-9A-Fa-f]{2}"
		result = re.match(pattern, mac)
		if result is None:
			return False

		pattern = r"[^0-9A-Fa-f]"
		result = re.findall(pattern, mac)
		if not len(set(result)) == 1:
			return False
		
		if update_sep:
			self.sep = result[0]
		return True

	def make_magic_packet(self, mac):
		if not self.is_mac_address(mac):
			print("Invalid MAC address")
			exit()
		
		mac = mac.replace(self.sep, "")
		packet = 'FF' * 6 + mac * 16
		packet = binascii.unhexlify(packet)
		return packet
	
	def send_magic_packet(self, mac, ip = None, port = None):
		if ip is None:
			ip = self.__d_ip_address
		if port is None:
			port = self.__d_port
		
		if self.network_if.name is None:
			self.select_network_interface()

		packet = self.make_magic_packet(mac)
		with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
			s.bind((self.network_if.ip, 0))
			s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
			s.sendto(packet, (ip, port))
		
	def select_network_interface(self):
		interfaces = psutil.net_if_addrs()
		print("Select network adapter")
		print("----------")
		for i, key in enumerate(interfaces.keys()):
			print("{0}: {1}".format(i, key))
		print("----------")
		print("Please select adapter number: ", end="")
		num = input()
		try:
			num = int(num)
			if num < 0 or len(interfaces.keys()) < num:
				raise ValueError
		except:
			print("Invalid number!")
			exit()
		self.network_if.name = list(interfaces.keys())[num]
		interface = interfaces[self.network_if.name]
		for val in interface:
			if val.family == socket.AF_INET:
				self.network_if.ip = val.address
			elif val.family == psutil.AF_LINK:
				self.network_if.mac = val.address
			else:
				# AF_INET6
				pass
		
		print("----------")
		print("Adapter Name: {0}".format(self.network_if.name))
		print("Adapter IP  : {0}".format(self.network_if.ip))
		print("Adapter MAC : {0}".format(self.network_if.mac))
		print("----------")

		
if __name__ == "__main__":
	wol = WakeOnLan()
	wol.send_magic_packet("aa:aa:aa:aa:aa:aa")

	