# mqtt wol project

## Environment (pip)
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