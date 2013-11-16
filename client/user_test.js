var net = require("net");
var util = require("../util.js");
var port = 9000;
var ip = "103.21.136.175"

var phone_client = net.connect(port, function(){
    //send_check_name("dista");
    //send_check_email("dista@qq.com");
    //send_register("dista", "dista@qq.com", "654321");
    send_login("dista", "654321");
    //setTimeout(function(){send_asso("dista", "RELEASE10001", "myss1id");}, 1000);
    //setTimeout(function(){send_query_all();}, 1000);
    //setTimeout(function(){send_change_password("654321");}, 1000);
    //setTimeout(function(){send_logout();}, 1000);
    //setTimeout(function(){send_query_all();}, 2000);
    //setTimeout(function(){send_control("RELEASE10001", 1, 20);}, 2000);
    //setTimeout(function(){send_query_status("RELEASE10001");}, 2000);
    /*
    setTimeout(function(){send_upload_time("RELEASE10001",
            [{
                "sid": 1,
                "start_time": "11:23",
                "end_time": "12:21",
                 "repeat": 1
            }
            ]);}, 1000);
    */
    //setTimeout(function(){send_lock("RELEASE10001", 1);}, 2000);
    //setTimeout(function(){send_del_time("RELEASE10001", 1);}, 2000);
    //setTimeout(function(){send_del_delay("RELEASE10001");}, 2000);
    //send_forgot_password("dista@qq.com");
    setTimeout(function(){send_heartbeat()}, 1000);

    phone_client.on('data', function(data){
        console.log(data);
    });
});

var send_lock = function(device_id, locked){
    var buff = new Buffer(10 + 20 + 1);
    util.setCommonPart(buff, {"type": 0x19, "packet_id": 1});
    (new Buffer(device_id)).copy(buff, 16);
    buff[28] = locked;
    util.setChecksum(buff);

    console.log(buff);
    phone_client.write(buff);
}

var send_del_time = function(device_id, sid){
    var buff = new Buffer(10 + 20 + 1);
    util.setCommonPart(buff, {"type": 0x1d, "packet_id": 1});
    (new Buffer(device_id)).copy(buff, 16);
    buff[28] = sid;
    util.setChecksum(buff);

    console.log(buff);
    phone_client.write(buff);
}

var send_del_delay = function(device_id){
    var buff = new Buffer(10 + 20);
    util.setCommonPart(buff, {"type": 0x20, "packet_id": 1});
    (new Buffer(device_id)).copy(buff, 16);
    util.setChecksum(buff);

    console.log(buff);
    phone_client.write(buff);
}

var send_upload_time = function(device_id, times){
    var buff = new Buffer(10 + 20 + 1 + 6 * times.length);
    util.setCommonPart(buff, {"type": 0x18, "packet_id": 1});
    (new Buffer(device_id)).copy(buff, 16);
    buff[28] = times.length;

    var index = 29;
    for(var i = 0; i < times.length; i++)
    {
        var time = times[i];
        buff[index++] = time.sid;
        util.time2buff(time.start_time).copy(buff, index); index += 2;
        util.time2buff(time.end_time).copy(buff, index); index += 2;
        buff[index++] = time.repeat;
    }
    util.setChecksum(buff);
    console.log(buff);
    phone_client.write(buff);
}

var send_query_status = function(device_id){
    var buff = new Buffer(10 + 20);
    util.setCommonPart(buff, {"type": 0x16, "packet_id": 1});
    (new Buffer(device_id)).copy(buff, 16);
    util.setChecksum(buff);

    console.log(buff);
    phone_client.write(buff);
}

var send_control = function(device_id, state, delay){
    var buff = new Buffer(10 + 25);
    util.setCommonPart(buff, {"type": 0x15, "packet_id": 1});
    (new Buffer(device_id)).copy(buff, 16);
    buff[28] = state;
    buff.writeUInt32BE(delay, 29);
    util.setChecksum(buff);

    console.log(buff);
    phone_client.write(buff);
}

var send_heartbeat = function(){
    var buff = new Buffer(10 + 8);
    util.setCommonPart(buff, {"type": 0x10, "packet_id": 1});
    util.setChecksum(buff);

    console.log(buff);
    phone_client.write(buff);
}

var send_check_name = function(name){
    var name_buff = new Buffer(name);
    var buff = new Buffer(10 + name_buff.length);
    util.setCommonPart(buff, {"type": 0x22, "packet_id": 2});
    name_buff.copy(buff, 8);
    util.setChecksum(buff); 

    console.log(buff);
    phone_client.write(buff);
}

var send_check_email = function(name){
    var name_buff = new Buffer(name);
    var buff = new Buffer(10 + name_buff.length);
    util.setCommonPart(buff, {"type": 0x21, "packet_id": 1});
    name_buff.copy(buff, 8);
    util.setChecksum(buff); 

    console.log(buff);
    phone_client.write(buff);
}

var send_register = function(name, email, password){
    var nep = new Buffer(name + "|" + email + "|" + password);
    var buff = new Buffer(10 + nep.length + 1);
    util.setCommonPart(buff, {"type": 0x12, "packet_id": 1});
    nep.copy(buff, 8);
    buff[8+nep.length] = 0x27;
    util.setChecksum(buff);

    console.log(buff);
    phone_client.write(buff);
}

var send_login = function(name, password)
{
    var nep = new Buffer(name + "|" + password);
    var buff = new Buffer(10 + nep.length + 1);
    util.setCommonPart(buff, {"type": 0x11, "packet_id": 1});
    nep.copy(buff, 8);
    buff[8+nep.length] = 0x27;
    util.setChecksum(buff);

    console.log(buff);
    phone_client.write(buff);
}

var send_asso = function(name, device_id, ssid)
{
    var buff = new Buffer(10 + 8 + name.length + 1 + 12 + ssid.length + 1);
    util.setCommonPart(buff, {"type": 0x14, "packet_id": 1});
    (new Buffer(name)).copy(buff, 16);
    buff[16 + name.length] = 0x27;
    (new Buffer(device_id)).copy(buff, 16 + name.length + 1);
    (new Buffer(ssid)).copy(buff, 16 + name.length + 1 + 12);
    buff[16 + name.length + 1 + 12 + ssid.length] = 0x27;

    util.setChecksum(buff);

    console.log(buff);
    phone_client.write(buff);
}

var send_query_all = function(){
    var buff = new Buffer(10 + 8);
    util.setCommonPart(buff, {"type": 0x17, "packet_id": 1});
    util.setChecksum(buff);

    console.log(buff);
    phone_client.write(buff);
}

var send_change_password = function(password){
    var buff = new Buffer(10 + 8 + password.length + 1);
    util.setCommonPart(buff, {"type": 0x1a, "packet_id": 1});
    (new Buffer(password)).copy(buff, 16);
    buff[16+password.length] = 0x27;
    util.setChecksum(buff);

    console.log(buff);
    phone_client.write(buff);
}

var send_logout = function(){
    var buff = new Buffer(10 + 8);
    util.setCommonPart(buff, {"type": 0x1B, "packet_id": 1});
    util.setChecksum(buff);

    console.log(buff);
    phone_client.write(buff);
}
var send_forgot_password = function(email){
    var buff = new Buffer(10 + email.length);
    util.setCommonPart(buff, {"type": 0x1E, "packet_id": 1});
    (new Buffer(email)).copy(buff, 8);
    util.setChecksum(buff);

    console.log(buff);
    phone_client.write(buff);
}

var send_check_email = function(name){
    var buff = new Buffer(10 + name.length);
    util.setCommonPart(buff, {"type": 0x21, "packet_id": 1});
    (new Buffer(name)).copy(buff, 8);
    util.setChecksum(buff);

    console.log(buff);
    phone_client.write(buff);
}
