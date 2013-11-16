var net = require('net');
var embed_device = require('./embed_device.js');
var phone = require('./phone.js');
var posix = require('posix');
var port = 7000;

function handleClient(c)
{
    var sock = c;
    var type_determined = false;
    var device;
    var device_interface = null;

    var handle_data = function(data){
        if(!type_determined)
        {
            if(data.length < 2)
            {
                sock.destroy();
                return;
            }

            var type_cate = data[1] & 0xf0;
            if(type_cate == 0x30)
            {
                device = "embed";
                device_interface = embed_device.create_embed_device(sock);
            }
            else if(type_cate == 0x10 || type_cate == 0x20)
            {
                device = "phone";
                device_interface = phone.create_phone(sock);
            }
            else
            {
                console.error("unknown type_cate " + type_cate);
                sock.destroy();
                return;
            }

            console.log("[connect] At " + (new Date()) + " " + device + "[" + sock.remoteAddress + ":" + sock.remotePort + "]");

            type_determined = true;
        }

        device_interface.handle_data(data);
    }

    var handle_end = function(){
        if(device_interface != null)
        {
            device_interface.handle_end();
        }
    }

    var handle_error = function(e){
        if(device_interface != null)
        {
            device_interface.handle_error(e);
        }
        console.error(e);
    }

    sock.on('data', handle_data);
    sock.on('end', handle_end);
    sock.on('error', handle_error);
}

posix.setrlimit('nofile', {'soft': 10000, 'hard': 10000});

var server = net.createServer(handleClient);

server.listen(port, function(){
        console.log("Welcome, Buffalo server started. Port " + port + ", server time " + (new Date()));
        });
