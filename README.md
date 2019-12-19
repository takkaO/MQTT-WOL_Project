# mqtt wol project

![CUI](https://github.com/takkaO/MQTT-WOL_Project/blob/images/cui.png)

## Description
This program will broadcast Wake On Lan magic packet into same segment network.  
The trigger of transmit is specific MQTT message.  

- **main.py**  
This program is receiver, so it can receive specific MQTT message and broadcast WOL magic packet into selected network.  
- **GUI directory**  
This program is transmitter, so it can transmit specific MQTT message and receive various MQTT messages.

## Environment
```
python3 -m pip install psutil paho-mqtt
```

## Usage
Up main program in network segment.
```
py main.py
```
Transmit MQTT data to connected broker.  
```payload``` expected **json** format and MAC address separator expected **```:```** or **```-```** or **blank**.  
Please use GUI application for easy use.  
```
topic  : takkaO/wol 
payload: {"mac": "target_mac_address"}
```

**example**
```
payload: {"mac": "11:22:33:44:55:66"}
```
```
payload: {"mac": "AA-BB-CC-DD-EE-FF"}
```
```
payload: {"mac": "77 88 99 AA BB CC"}
```


## Reference
- [Raspberry PiからPythonでWEB経由でWoLしてみる](https://code-life.hatenablog.com/entry/raspberry-pi-wol)
- [Can Python select what network adapter when opening a socket?](https://stackoverflow.com/questions/8437726/can-python-select-what-network-adapter-when-opening-a-socket)
- [How to get Network Interface Card names in Python?](https://stackoverflow.com/questions/3837069/how-to-get-network-interface-card-names-in-python)
- [psutil documentation](https://psutil.readthedocs.io/en/latest/)
