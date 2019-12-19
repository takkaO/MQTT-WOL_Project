"use strict";

const ipcRenderer = window.ipcRenderer;
const remote = window.remote;
// Load modules
const myMqtt = remote.require('./src/myMqtt.js');
var fs = remote.require("fs");
const dialog = remote.dialog;

// Load context
var btn_connect = document.getElementById("btn_connect");
var btn_subscribe = document.getElementById("btn_subscribe");
var btn_publish = document.getElementById("btn_publish");
var mqtt_console = document.getElementById("textarea_mqtt");
var form_host = document.getElementById("form_host");
var form_port = document.getElementById("form_port");
var form_uname = document.getElementById("form_uname");
var form_password = document.getElementById("form_password");
var form_topic = document.getElementById("form_topic");
var form_mac = document.getElementById("form_mac");
var sw_sub_with_pub = document.getElementById("switch_sub_with_pub");
var sw_parse_json = document.getElementById("switch_parse_json");


function initialize(){
	switchButtonState("disconnect");
	form_port.value = "1883";
	mqtt_console.value = "System Ready...\n";
};

function switchButtonState(broker_connect_state){
	switch (broker_connect_state) {
		case "connecting":
			form_host.disabled = true;
			form_port.disabled = true;
			form_uname.disabled = true;
			form_password.disabled = true;
			form_topic.disabled = true;
			form_mac.disabled = true;
			btn_publish.disabled = true;
			btn_subscribe.disabled = true;
			btn_connect.disabled = true;
			btn_connect.textContent = "Connecting...";
			break;
		case "connected":
			form_host.disabled = true;
			form_port.disabled = true;
			form_uname.disabled = true;
			form_password.disabled = true;
			form_topic.disabled = false;
			form_mac.disabled = false;
			btn_publish.disabled = false;
			btn_subscribe.disabled = false;
			btn_connect.disabled = false;
			btn_connect.textContent = "Disconnect";
			break;
		case "disconnect":
			form_host.disabled = false;
			form_port.disabled = false;
			form_uname.disabled = false;
			form_password.disabled = false;
			form_topic.disabled = true;
			form_mac.disabled = true;
			btn_publish.disabled = true;
			btn_subscribe.disabled = true;
			btn_connect.disabled = false;
			btn_connect.textContent = "Connect";
			break;
		default:
			break;
	}

}

function fetchJsonDataString(json, count = 0) {
	if (typeof json === "string") {
		try {
			json = JSON.parse(json);
		}
		catch (e) {
			return "Error";
		}
	}
	var str = "";
	Object.keys(json).forEach((key) => {
		str += " ".repeat(4).repeat(count);
		if (json[key] instanceof Object) {
			str += key + "\n";
			str += fetchJsonDataString(json[key], count + 1)
		}
		else {
			str += key + ": " + json[key] + "\n";
		}
	});
	return str;
}

function updateMqttConsole(identifier, msg){
	switch (identifier) {
		case "info":
			mqtt_console.value += "[Info] " + msg;
			break;
		case "error":
			mqtt_console.value += "\n[Error] " + msg;
			break;
		case "warning":
			mqtt_console.value += "[Warning] " + msg;
			break;
		case "clear":
			mqtt_console.value = "[Info] Clear console";
			break;
		default:
			mqtt_console.value += msg;
	}
	if (msg.slice(-1) !== "\n") {
		mqtt_console.value += "\n";
	}
	mqtt_console.value += "--------------------\n";

	/* 最大履歴の管理 */
	const maxLength = 10000;
	if (mqtt_console.value.length > maxLength) {
		var len = mqtt_console.value.length - maxLength;
		var tmp = mqtt_console.value;
		mqtt_console.value = tmp.slice(len);
	}
	// スクロールを最下部に移動
	mqtt_console.scrollTop = mqtt_console.scrollHeight;
}

function checkMacAddress(mac){
	var pattern = /([0-9A-Fa-f]{2}[-:\s]){5}[0-9A-Fa-f]{2}/g;
	var result = mac.match(pattern);
	if (result === null) {
		return false;
	}

	pattern = /[^0-9A-Fa-f]/g;
	var result = mac.match(pattern);
	var set = new Set(result);
	if (set.size !== 1) {
		return false;
	}
	return true;
}

ipcRenderer.on("ch_menu", (evt, identifier) => {
	switch (identifier) {
		case "save_settings":
			var data = {
				"broker" : {
					"host": form_host.value,
					"port": form_port.value
				},
				"wol" : {
					"topic": form_topic.value, 
					"mac": form_mac.value
				}
			};
			var json = JSON.stringify(data);
			var fpath = dialog.showSaveDialogSync(null, {
				properties: ['openFile', 'showOverwriteConfirmation'],
				title: 'Select a setting file',
				defaultPath: './setting.json',
				filters: [
					{name: 'setting file', extensions: ['json']}
				]
			});

			if (fpath === undefined) {
				return;
			}
			
			fs.writeFileSync(fpath, json);
			var msg = "[Info] Successful to save setting file\n";
			msg += "=>" + fpath;
			updateMqttConsole("info", msg);
			
			break;
		case "load_settings":
			var fpath = dialog.showOpenDialogSync(null, {
				properties: ['openFile'],
				title: 'Select a setting file',
				defaultPath: '.',
				filters: [
					{name: 'setting file', extensions: ['json']}
				]
			});

			if (fpath === undefined) {
				return;
			}

			var text = fs.readFileSync(fpath[0]);
			var json = JSON.parse(text);

			try{
				form_host.value = json["broker"]["host"];
				form_port.value = json["broker"]["port"];
				form_topic.value = json["wol"]["topic"];
				form_mac.value = json["wol"]["mac"];

				var msg = "[Info] Successful to load setting file\n";
				msg += "=>" + fpath[0];
				updateMqttConsole("info", msg);
			}
			catch (e){
				var err = "Faild to load setting file!\n"
				err += "Invalid key structure\n";
				updateMqttConsole("error", err);
			}
			break;
		case "clear_console":
			updateMqttConsole("clear", "");
		default:
			break;
	}
});

ipcRenderer.on("ch_mqtt", function (evt, identifier, msg){
	var id = "";
	var str = msg;

	switch (identifier) {
		case "connect":
			id = "clear";
			updateMqttConsole(id, "");
			switchButtonState("connected");
			id = "info";
			break;
		case "publish":
			id = "info";
			break;
		case "message":
			id = "info";
			str = "Received message!\n";
			str += "topic: " + msg["topic"] + "\n";
			if (sw_parse_json.checked === true) {
				try {
					var json = JSON.parse(msg["payload"]);
					str += "payload: \n";
					str += fetchJsonDataString(json);
				}
				catch(e) {
					str += "[Error] Json parse error!\n";
					str += "payload: " + msg["payload"] + "\n";
				}
			}
			else {
				str += "payload: " + msg["payload"] + "\n";
			}
			break;
		case "disconnect":
			id = "info";
			break;
		case "error":
			id = "error";
			break;
		default:
			id = "unknown";
	}
	
	updateMqttConsole(id, str);

	if (id === "error") {
		str = "Disconnect from broker.\n";
		updateMqttConsole("info", str);
		myMqtt.disconnect();
		switchButtonState("disconnect");
	}
});

btn_publish.addEventListener("click", ()=>{
	var topic = form_topic.value;
	var payload = form_mac.value;
	var msg = "";
	if (checkMacAddress(payload) === false) {
		msg = "Invalid MAC address\n";
		msg += "Separator expected ' : ' or ' - ' or blank\n";
		updateMqttConsole("warning", msg);
	}
	var data = JSON.stringify({"mac": payload});
	if (sw_sub_with_pub.checked === true) {
		if (myMqtt.isSubscribe(topic) === false) {
			myMqtt.subscribe(topic);
			var msg = "Start subscribe topic: " + topic + "\n";
			updateMqttConsole("info", msg);
		}
	}
	myMqtt.publish(topic, data);
});

btn_subscribe.addEventListener("click", ()=>{
	var topic = form_topic.value;
	if (topic === "") {
		return;
	}
	var msg = "";
	if (myMqtt.isSubscribe(topic) === false) {
		myMqtt.subscribe(topic);
		msg = "Start subscribe topic: " + topic + "\n";
		updateMqttConsole("info", msg);
	}
	else{
		msg = "This topic already subscribed: " + topic + "\n";
		updateMqttConsole("warning", msg);
	}
});

btn_connect.addEventListener("click", ()=>{
	if (myMqtt.isConnected() === false){
		switchButtonState("connecting");
		var host = form_host.value;
		var port = form_port.value;
		var uname = form_uname.value;
		var pass = form_password.value;
		if (myMqtt.isPortNumber(port) == false){
			var msg = "Invalid port number\n";
			updateMqttConsole("error", msg);
			switchButtonState("disconnect");
			return;
		}
		myMqtt.connect(host, Number(port), uname, pass);
	}
	else {
		myMqtt.disconnect();
		switchButtonState("disconnect");
	}
});

window.addEventListener("load", function () {
	if (window.isElectron) {
		console.log("OK");
		initialize();
	}
});
