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
	switchButtonState(false);
	form_port.value = "1883";
	mqtt_console.value = "System Ready...\n";
};

function switchButtonState(connected){
	if (connected) {
		form_host.disabled = true;
		form_port.disabled = true;
		form_uname.disabled = true;
		form_password.disabled = true;
		form_topic.disabled = false;
		form_mac.disabled = false;
		btn_publish.disabled = false;
		btn_subscribe.disabled = false;
		btn_connect.textContent = "Disconnect";
	}
	else{
		form_host.disabled = false;
		form_port.disabled = false;
		form_uname.disabled = false;
		form_password.disabled = false;
		form_topic.disabled = true;
		form_mac.disabled = true;
		btn_publish.disabled = true;
		btn_subscribe.disabled = true;
		btn_connect.textContent = "Connect";
	}
}

function updateMqttConsole(identifier, msg){
	if (mqtt_console.value === null) {
		mqtt_console.value = "";
	}
	switch (identifier) {
		case "connect":
			mqtt_console.value = "[Info] " + msg;
			break;
		case "disconnect":
			mqtt_console.value += "\n[Info] " + msg;
			myMqtt.disconnect();
			switchButtonState(false);
			break;
		case "error":
			mqtt_console.value += "\n[Error] " + msg;
			break;
		case "subscribe":
			mqtt_console.value += "[Info] " + msg;
			break;
		case "publish":
			mqtt_console.value += "[Info] " + msg;
			break;
		case "message":
			mqtt_console.value += "[Info] Receive message!\n";
			mqtt_console.value += msg;
			break;
		case "clear":
			mqtt_console.value = "";
			break;
		default:
			mqtt_console.value += msg + "\n";
	}

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

ipcRenderer.on("ch_settings", (evt, identifier) => {
	switch (identifier) {
		case "save":
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
		case "load":
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
		default:
			break;
	}
});

ipcRenderer.on("ch_mqtt", function (evt, identifier, msg){
	if (identifier === "message") {
		var tmp = "topic: " + msg["topic"] + "\n";
		if (sw_parse_json.checked === true) {
			var json = JSON.parse(msg["payload"]);
			Object.keys(json).forEach((key) => {
				tmp += key + ": " + json[key] + "\n";
			});
		}
		else {
			tmp += "payload: " + msg["payload"] + "\n";
		}
		msg = tmp;
		msg += "----------\n";
	}
	
	updateMqttConsole(identifier, msg);

	if (identifier === "error") {
		msg = "Disconnect from broker.\n";
		updateMqttConsole("disconnect", msg);
	}
});

btn_publish.addEventListener("click", ()=>{
	var topic = form_topic.value;
	var payload = form_mac.value;
	var msg = "";
	if (checkMacAddress(payload) === false) {
		msg = "Invalid MAC address\n";
		msg += "Separator expected ' : ' or ' - ' or blank\n";
		updateMqttConsole("error", msg);
		return;
	}
	var data = JSON.stringify({"mac": payload});
	if (sw_sub_with_pub.checked === true) {
		myMqtt.subscribe(topic);
		var msg = "Start subscribe topic: " + topic + "\n";
		updateMqttConsole("subscribe", msg);
	}
	myMqtt.publish(topic, data);
});

btn_subscribe.addEventListener("click", ()=>{
	var topic = form_topic.value;
	if (topic === "") {
		return;
	}
	myMqtt.subscribe(topic);
	var msg = "Start subscribe topic: " + topic + "\n";
	updateMqttConsole("subscribe", msg);
});

btn_connect.addEventListener("click", ()=>{
	if (myMqtt.isConnected() === false){
		switchButtonState(true);
		var host = form_host.value;
		var port = form_port.value;
		var uname = form_uname.value;
		var pass = form_password.value;
		if (myMqtt.isPortNumber(port) == false){
			var msg = "Invalid port number\n";
			updateMqttConsole("error", msg);
			switchButtonState(false);
			return;
		}
		myMqtt.connect(host, Number(port), uname, pass);
	}
	else {
		myMqtt.disconnect();
		switchButtonState(false);
	}
});

window.addEventListener("load", function () {
	if (window.isElectron) {
		console.log("OK");
		initialize();
	}
});
