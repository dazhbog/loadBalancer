/*
 * What is this?
 *
 *                          |----> basePort
 * Public port e.g. 8000 -->|----> basePort+1
 *                          |----> basePort+2
 *
 */

"publicPort" 	: "8000",     
public port where the device/client connects to

"DLIP"			: "127.0.0.1",
IP of destination IP

"DLbasePort" 	: "7000",	  
Base port of clusters/servers that are load balanced. Base port increments per instance. 
e.g. 3 instances -> 7000, 7001, 7002


"instances"	 	: "3",		  
Downloader instances

"maxConnections": "2",		  
How many connections does the dowloader take simultaneously

"sockIdleTime"  : "80000",	  
When theres no data flowing when to kill the socket. IN Milliseconds

"listenWhenNoSlot":  true	  
When slots are full: 
true  - will accept & kill connection | To know when we are getting more calls than we can handle
false - will not respond to anything when slots are full 
