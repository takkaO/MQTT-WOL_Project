import paho.mqtt.client as mqtt
import os 
import re
import time
import configparser
from enum import Enum, auto

class CallbackType(Enum):
	# とりあえずこれだけ対応
	ON_CONNECT = auto()
	ON_MESSAGE = auto()
	ON_PUBLISH = auto()
	ON_DISCONNECT = auto()

class MyMqtt():
	def __init__(self, setting_fpath = None, auto_connect=False):
		config = configparser.ConfigParser()
		if setting_fpath is None:
			setting_fpath = "./BrokerSetting.ini"

		if not os.path.isfile(setting_fpath):
			print("Setting file not found!")
			print("Create new setting file\n")
			print("Enter broker ip address: ", end="")
			ip = input()
			while not self.check_ip_address(ip):
				print("Invalid ip address! Please retype\n: ", end="")
				ip = input()
			print("Enter broker port number: ", end="")
			port = input()
			while not self.check_port_number(port):
				print("Invalid port number! Please retype\n: ", end="")
				port = input()
			config["Broker"] = {
				"ip": ip, 
				"port": port
				}
			with open(setting_fpath, 'w') as configfile:
				config.write(configfile)
			print("Save setting -> {0}".format(setting_fpath))
		
		self.ip, self.port = self.load_settings(setting_fpath)
		if not self.check_ip_address(self.ip) or not self.check_port_number(self.port):
			print("Invalid setting values!!")
			print("ip  : {0}".format(self.ip))
			print("port: {0}".format(self.port))
			exit(1)
		
		print("Broker setting loaded!")
		print("ip  : {0}".format(self.ip))
		print("port: {0}".format(self.port))

		self.client = mqtt.Client()
		if auto_connect:
			self.connect_to_broker()
	
	def connect_to_broker(self):
		self.client.connect(self.ip, port=self.port, keepalive=60)
		self.client.loop_start()
	
	def publish(self, topic, payload=None, qos=0, retain=False):
		self.client.publish(topic, payload, qos, retain)
	
	def subscribe(self, topic, qos=0):
		self.client.subscribe(topic, qos)
	
	def unsubscribe(self, topic):
		self.client.unsubscribe(topic)

	def set_callback_function(self, callback_type, function):
		if callback_type == CallbackType.ON_CONNECT:
			self.client.on_connect = function
		elif callback_type == CallbackType.ON_MESSAGE:
			self.client.on_message = function
		elif callback_type == CallbackType.ON_PUBLISH:
			self.client.on_publish = function
		elif callback_type == CallbackType.ON_DISCONNECT:
			self.client.on_disconnect = function
		else:
			print("No support callback type")
			
	def load_settings(self, fpath):
		if not os.path.isfile(fpath):
			print("Error setting file not found: {0}".format(fpath))
			exit(1)
		
		config = configparser.ConfigParser()
		config.read(fpath)
		ip = config["Broker"]["ip"]
		port = int(config["Broker"]["port"])

		return ip, port
		
	def check_port_number(self, num):
		try:
			num = int(num)
		except:
			return False
		return True if 1 < num and num < 65536 else False

	def check_ip_address(self, s):
		if s == "localhost":
			return True
		ip_reg = r"[1-9][0-9]{0,2}\.[1-9][0-9]{0,2}\.[1-9][0-9]{0,2}\.[1-9][0-9]{0,2}$"
		m = re.match(ip_reg, s)
		if m is None:
			return False
		return True


if __name__ == "__main__":
	def on_connect(client, userdata, flags, respons_code):
		print('mqtt status {0}'.format(respons_code))
		print("sample")
		#mymqtt.client.subscribe("data/testESP32")

	def on_message(client, userdata, msg):
		print(msg.topic + " " + str(msg.payload))
		print("sample")

	def on_publish(client, userdata, mid):
		print("publish: {0}".format(mid))
		print("sample")

	def on_disconnect(client, userdata, flag, respons_code):
		print("sample")
		if respons_code != 0:
			print("Unexpected disconnection.")

	mymqtt = MyMqtt()
	mymqtt.set_callback_function(CallbackType.ON_CONNECT, on_connect)
	mymqtt.set_callback_function(CallbackType.ON_MESSAGE, on_message)
	mymqtt.set_callback_function(CallbackType.ON_PUBLISH, on_publish)
	mymqtt.set_callback_function(CallbackType.ON_DISCONNECT, on_disconnect)
	mymqtt.connect_to_broker()

	while True:
		mymqtt.publish("test", "sample program")
		print("A")
		time.sleep(5)