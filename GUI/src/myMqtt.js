"use strict";

var mqtt = require("mqtt");

const {remote, BrowserWindow} = require('electron');
var client = null;
var channel = "ch_mqtt";
var mainWindow = BrowserWindow.getFocusedWindow();

const mqttUtils = {
	testout: function (){
		console.log("Hello");
		return "OKOK";
	},

	updateChannelName: (new_name) => {
		channel = new_name;
	},

	isPortNumber: function (port) {
		// check port num
		if (isNaN(port)){
			return false;
		}
		var p = Number(port);
		if (p < 0 || 65535 < p){
			return false;
		}
		return true;
	},

	connect: function (ip, port, uname=null, password=null){
		if (uname === null || uname === "") {
			uname = "mqttwolgui";
		}
		if (password === null || password === "") {
			password = Buffer.from("mqttwolgui");
		}
		if (typeof(password) === "string"){
			password = Buffer.from(password);
		}

		var options = {
			port: port,
			host: ip,
			protocol: 'mqtt',
			connectTimeout: 5000,
			username: uname,
			password: password
		};
		client = mqtt.connect(options);

		client.on('connect', function (cp){
			//console.log("connect ok");
			var msg = "Successful connect to broker!\n";
			msg += "Host     : " + options.host + "\n";
			msg += "Port     : " + options.port + "\n";
			msg += "Protocol : " + options.protocol + "\n";
			msg += "----------\n";
			mainWindow.webContents.send(channel, "connect", msg);
			//client.publish("test", "test OK");
			//setInterval(mqttUtils.testout, 1000);
		});

		client.on('end', function (){
			var msg = "Disconnect from broker.\n";
			mainWindow.webContents.send(channel, "disconnect", msg);
		});

		client.on('error', function (err){
			mainWindow.webContents.send(channel, "error", err.message + "\n");
		});

		client.on('offline', function(){
			var msg = "Cannot connect -> offline error.\n";
			mainWindow.webContents.send(channel, "error", msg);
		});

		client.on('packetsend', function (packet){
			//console.log(packet);
			if (packet.cmd !== "publish"){
				// publish以外（ping）はスルー
				return;
			}
			var msg = "Published!\n";
			msg += "QoS    : " + packet.qos + "\n";
			msg += "Topic  : " + packet.topic + "\n";
			msg += "Payload: " + packet.payload + "\n";
			msg += "----------\n"
			//console.log(BrowserWindow.getAllWindows());
			mainWindow.webContents.send(channel, "publish", msg);
			//console.log(packet.payload);
		});

		client.on('message', (topic, payload) => {
			// payload変換処理
			mainWindow.webContents.send(channel, "message", {topic :topic, payload:payload.toString()});
		});
	},

	disconnect: function (){
		if (client === null){
			return;
		}
		if (client.connected === true){
			client.end();
			client = null;
		}
	},

	subscribe: function (topic) {
		if (client === null){
			return;
		}
		client.subscribe(topic);
	},

	publish: function (topic, payload){
		if (client === null){
			return;
		}
		client.publish(topic, payload);
	},

	isConnected: function (){
		if (client === null){
			return false;
		}
		return client.connected;
	}
};

module.exports = mqttUtils;
