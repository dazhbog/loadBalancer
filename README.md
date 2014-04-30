
What is this?
------------

A simple Node.js load balancer.

Originally made to balance VB6 windowz legacy applications.

Features
-----------

+ Ability to kill the listener when slots are full. To avoid TCP SYN packets going out.

+ Idle timeout

+ MAX connections per server

+ As many instances, routing moves to next instance when all slots are down

+ Native Node.js


    Public port e.g. 8000  ---->  basePort
    Public port e.g. 8000  ---->  basePort+1
    Public port e.g. 8000  ---->  basePort+2







Just edit the config.json file to get started and routing
-------------

    node loadBalancer.js


public port where the device/client connects to

    "publicPort" 	: "8000",

IP of destination IP

    "DLIP"			: "127.0.0.1",

Base port of clusters/servers that are load balanced. Base port increments per instance.
e.g. 3 instances -> 7000, 7001, 7002

    "DLbasePort" 	: "7000",

Downloader instances

    "instances"	 	: "3",

How many connections does the target take simultaneously

    "maxConnections": "2",

When theres no data flowing when to kill the socket. IN Milliseconds

    "sockIdleTime"  : "80000",

When slots are full:
true  - will accept & kill connection | To know when we are getting more calls than we can handle
false - will not respond to anything when slots are full

    "listenWhenNoSlot":  true




MIT Licence. Marios Georgiou 2014

