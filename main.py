from myMqtt import MyMqtt, CallbackType
from myWOL import WakeOnLan
import os
import re
import json
import time
import configparser

class WakeUpper:
	def __init__(self):
		self.wol = WakeOnLan()
		self.wol.select_network_interface()
		self.topic = "takkaO/wol"
	
	def on_connect(self, client, userdata, flags, respons_code):
		print('mqtt status {0}'.format(respons_code))
		client.subscribe(self.topic)


	def on_message(self, client, userdata, msg):
		data = json.loads(msg.payload.decode("utf-8"))
		mac = data["mac"]

		if self.wol.is_mac_address(mac):
			self.wol.send_magic_packet(mac)
			tx_data = {"wol_res": "ok"}
			client.publish(self.topic, json.dumps(tx_data))
			print("Transmit WOL packet")


def main():
	wu = WakeUpper()
	mymqtt = MyMqtt()
	mymqtt.set_callback_function(CallbackType.ON_MESSAGE, wu.on_message)
	mymqtt.set_callback_function(CallbackType.ON_CONNECT, wu.on_connect)

	mymqtt.connect_to_broker()

	while True:
		time.sleep(5)
	
if __name__ == "__main__":
	main()