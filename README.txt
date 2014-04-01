/*
 * What is this?
 *
 * A simple Node.js load balancer.
 *
 * Originally made to balance VB6 windowz legacy applications.
 *
 * Features
 *
 * Ability to kill the listener when slots are full. To avoid TCP SYN packets going out.
 * Idle timeout
 * MAX connections per server
 * As many instances, routing moves to next instance when all slots are down
 * Native Node.js
 * 
 *
 *
 *                          |----> basePort
 * Public port e.g. 8000 -->|----> basePort+1
 *                          |----> basePort+2
 *
 * MIT Licence. Marios Georgiou 2014
 */




/*   Just edit the config.json file to get started and run with "node loadBalancer.js" */



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
