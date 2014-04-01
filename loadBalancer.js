// =======================================================================// 
// ! DC DL Balancer Like A BOSS v0.1 MG2013                               //        
// =======================================================================// 
var net = require('net');
var fs  = require('fs' );
log("____________________________________________________");
log("====================================================");
log("================ Starting Server ===================");
try{
  var config = require('./config.json');
} catch (e){
  log(""+e);
  process.exit(0);
}

// Configuration globals
var listening =0;
var serverHandler;
var IDLE_TIME = 80000;
var listenWhenNoSlot = true;
var listenPort;
var DLbasePort;
var DLIP;
var instances;
var maxConnections;
var connectionTable = [];
process.on('uncaughtException', function (error) {
    log(error.stack); 
});
process.stdin.on('data', function (chunk) {
    listSlot();
});



// =======================================================================// 
// ! MAIN                                                                 //        
// =======================================================================// 
// checkArgs();           // If used with console arguments/swiches
parseConfig();            // Use with a JSON config.json file
initConnectionTable();
startBalancer();
setInterval( function(){ clearBadSlots(); } , 60000);



// =======================================================================// 
// ! Balancer Functions                                                   //        
// =======================================================================// 
function startBalancer(){
      serverHandler = net.createServer();
      serverHandler.on('connection', function (socket) { 
            socket.name = socket.remoteAddress + ":" + socket.remotePort;
            var client;
            //listSlot();
            //log("["+socket.name+"] Incoming connection. Reserving slot..");
            var nextSlot = availableSlot();
            if ( nextSlot.i != -1 ){
                      reserveSlot(nextSlot);
                      log("["+socket.name+"] Incoming Connection. Accepting. Connecting to DL ["+nextSlot.i+"]["+nextSlot.y+"]");
                      socket.pause();
                      connectToAvailableDownloader(nextSlot, socket, retryCallback, function(err, sock,idx){
                        nextSlot = idx;
                        if (err){
                          log("["+socket.name+"] Rejecting.. No available slots. Some downloaders are down!");
                          socket.destroy();
                        } else {
                          log("["+socket.name+"] Connected to DL. Starting relay!");
                          client = sock;
                          socket.resume();   
                        }
                        listSlot();
                      });

                      socket.setTimeout(IDLE_TIME, function(){   //idle timeout
                          log("["+socket.name+"] Balancer socket idle timeout");
                          disposeConnection(nextSlot, socket, client);
                      });

                      socket.on('data', function (data) {
                          //log("["+socket.name+ "] received "+data);
                          client.write(data);
                      });

                      socket.on('end', function () {
                          disposeConnection(nextSlot, socket, client);
                      });

                      socket.on('error', function () {
                          disposeConnection(nextSlot, socket, client);
                      });
            }else{
                log("["+socket.name+"] Incoming connections. Rejecting "+socket.name+". No available slots!");
                socket.destroy();
            }
      });
      startListen();
      
}

function connectToAvailableDownloader(idx, server, cb, doneCallback){
          var po = parseInt(DLbasePort)+idx.i;
          var ip = DLIP;
          log("["+server.name+"] Connecting to "+ip+":"+po+". Reserving slot..");
          reserveSlot(idx);
          var client = net.connect({  host: ip ,   port: po  },
          function() {
              //log("["+server.name+"] Connected to DL.");
              client.stat = 1;
              cb(0, server ,client, idx, doneCallback);
          });
          client.stat =0;
          client.setTimeout(IDLE_TIME, function(){   //idle timeout
              log("["+server.name+"] Client socket idle timeout");
              disposeConnection(idx, server, client);
          });

          client.on('data', function(data) {
              server.write(data);
          });

          client.on('end', function() {
              if (client.stat==0){
                log("["+server.name+"] Error on connection");
                cb(1, server, 0, idx, doneCallback);
              }else{
                log("["+server.name+"] Error after connection");
                disposeConnection(idx, server, client);
              }
                
          });

          client.on('error', function(err) { // sometimes even though a response was received, there is a CONN RESET
             if (client.stat==0){
                //log("["+server.name+"] Error on connection");
                cb(1, server, 0, idx, doneCallback);
              }else{
                log("["+server.name+"] Error after connection "+err);
                disposeConnection(idx, server, client);
              }
          });
}


function retryCallback(err, server, client, idx, doneCallback){
  if (err){         
            log("["+server.name+"] Failed to connect to DL. Slot ["+idx.i+"]["+idx.y+"] is bad.");   
            badSlot(idx);
            idx = availableSlot();
            if (idx.i != -1){               
               connectToAvailableDownloader(idx, server, retryCallback, doneCallback);
            } else {
               doneCallback(1, 0,idx); 
            }

  } else {      
      doneCallback(0, client,idx);      
  }

}

function clearBadSlots(){
    var change =0;
    for(var i=0; i<instances; i++){
        for(var y=0; y<maxConnections; y++){
            if (connectionTable[i][y]==2){
              change =1;
              log("Clearing bad slots ["+i+"]["+y+"]");
              connectionTable[i][y]=0;
              updateListener();
            }
        }
    }
    if (change){
       listSlot();  
    }

}

function disposeConnection(idx, server, client){
    if (server){
        log("["+server.name+"] Destroying connection..");
        server.destroy();
    }
    if (client) client.destroy();
    releaseSlot(idx);
    listSlot();
}

function countSlots(){
  var counter = 0;
  for(var i=0; i<instances; i++){
      for(var y=0; y<maxConnections; y++){
            if ((connectionTable[i][y]==0)){                              
                counter++
            }
      }
  }
  return counter;
}

function badSlot(idx){
    connectionTable[idx.i][idx.y] = 2;
    updateListener();    
}

function reserveSlot(idx){
    connectionTable[idx.i][idx.y] = 1;
    updateListener();
}

function releaseSlot(idx){
    if (connectionTable[idx.i][idx.y] != 2){
      connectionTable[idx.i][idx.y] = 0;
    }
    updateListener();
}

function availableSlot(){
  var idx={};
  for(var i=0; i<instances; i++){
      for(var y=0; y<maxConnections; y++){
            if (connectionTable[i][y]==0){                              
                idx.i=i;
                idx.y=y;
                return idx;
            }
      }
  }
  idx.i=-1;
  idx.y=-1;
  return idx;
}


function listSlot(){
  log("======= Slots 0:FREE, 1:IN-USE, 2:SERV-DOWN =======");
  var stdout_buf = "";
  for(var i=0; i<instances; i++){
      stdout_buf += " ";
      for(var y=0; y<maxConnections; y++){
          stdout_buf +=""+connectionTable[i][y];
      }
  }
  log(stdout_buf);
  log("====================================================");
}

function initConnectionTable(){
    for(var i=0; i<instances; i++){
        connectionTable[i] = [];
        for(var y=0; y<maxConnections; y++){
            connectionTable[i][y]=0;
        }
    }
}

function updateListener(){
  if (listenWhenNoSlot == true){
    return;
  }
  if (countSlots()>0){
        startListen();
  } else {
        stopListen();
  }
}

function startListen(){
    if (listening==0){
        listening = 1;
        serverHandler.listen(listenPort);        
        log("Server listening at port "+listenPort);
    }
}


function stopListen(){
  if (listening==1){
      log("Stopping server.");
      listening =0;
      serverHandler.close(function(){  });
  }
}

// =======================================================================// 
// ! ARG Functions                                                        //        
// =======================================================================// 
function checkArgs(){
    process.argv.forEach(function(val, index, array) {
            if ((val ==  "--help")||(val ==  "-h")){
                help();
                process.exit(1);
            }
    });
    listenPort     = process.argv[2];
    DLbasePort     = process.argv[3];
    instances      = process.argv[4];
    maxConnections = process.argv[5];
    if ( (listenPort == undefined) || (DLbasePort == undefined) || (instances == undefined) || (maxConnections == undefined)){
        help();
        process.exit(1);
    }
}

function parseConfig(){
    log("Parsing config.json " + JSON.stringify(config) );
    listenPort       = config.publicPort;
    DLIP             = config.DLIP;
    DLbasePort       = config.DLbasePort;
    instances        = config.instances;
    maxConnections   = config.maxConnections;
    IDLE_TIME        = config.sockIdleTime;
    listenWhenNoSlot = config.listenWhenNoSlot;

}

function help(){
  log("Please use APP <Listen PORT> <Base PORT> <Instances> <MaxConn per instance>");
}

function log(str){
    console.log(str);
    write_log(str);
}

function write_log(buf){
  if ((buf==undefined)){
        console.log("UNDEF BUFF. CANNOT WRITE TO FILE");
        return;
  }
    fs.appendFile(date_str()+".log", "\n"+timestamp()+" "+buf+"\r");
}

function date_str(){
  var d =  new Date();
  return d.getDate()+"-"+(d.getMonth()+1)+"-"+d.getFullYear();
}


function timestamp() {
  var currentdate = new Date();
  var res = "["+date_str()+"]["+padd(2,currentdate.getHours()) + ":"+ padd(2,currentdate.getMinutes()) + ":"
   + padd(2,currentdate.getSeconds())+"]";
  return res;
}

function padd(decimal_places,value){   //to be properly coded
  if ((value<1000)&&(decimal_places>3)){ value="0"+value;}
  if ((value<100 )&&(decimal_places>2)){ value="0"+value;}
  if ((value<10  )&&(decimal_places>1)){ value="0"+value;}
  return value;
}