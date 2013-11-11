var phones = [];
var session_id_count = 0;
var embed_device = require("./embed_device.js");

exports.create_phone = function(c) {
    var phone_constructor = function(){
        this.sock = c;
        var self = this;

        var print_log = function(msg)
        {
            console.log("phone[%s:%s]; ip[%s:%s]: %s", self.user, self.password, self.remoteAddress, self.remotePort, msg); 
        }

        var remove_phone = function()
        {
            for(var i = 0; i < phones.length; i++)
            {
                if(phones[i] == self)
                {
                    phones.splice(i, 1);
                    break;
                }
            }

            console.log("phone client[%s:%s] removed, current phones: %d",
                    self.remoteAddress, self.remotePort,
                    phones.length);
        }

        var handle_protocal_error = function()
        {
            remove_phone();
            self.sock.destroy();
        }

        this.handle_data = function(data){
            handle_data_internal(data, 0);
        }

        this.handle_end = function()
        {
            remove_phone();
        }

        this.handle_error = function(e)
        {
            remove_phone();
        }

        var handle_data_internal = function(data, start){
            if(data.length - start < 2)
            {
                handle_protocal_error();
            }

            if(data[start] != 0x97)
            {
                handle_protocal_error();
            }

            var type = data[start + 1];
            
            if(type == 0x10)
            {
                proto_heartbeat(data, start);
                print_log("heartbeat");
            }
            else if(type == 0x11)
            {
                proto_login(data, start);
                print_log("login");
            }
            else if(type == 0x15)
            {
                proto_control(data, start);
                print_log("control");
            }
            else
            {
                print_log("unsupport type [0x" + type.toString(16) + "]"); 
            }
        }

        var proto_login = function(data, start){
            self.remoteAddress = self.sock.remoteAddress;
            self.remotePort = self.sock.remotePort;

            if(start + 8 > data.length)
            {
                handle_protocal_error();
                return;
            }

            var len = data.readUInt16BE(start + 6);

            if(start + 10 + len > data.length)
            {
                handle_protocal_error();
                return;
            }

            var name_end = 0;
            var password_start = 0;
            var password_end = 0;
            for(var i = start + 8; i < start + 10 + len; i++)
            {
                if(data[i] == '|'.charCodeAt(0))
                {
                    name_end = i;
                    password_start = i + 1;
                }  
                else if(data[i] == 0x27)
                {
                    password_end = i;
                    break;
                }
            }

            self.user = data.toString('ascii', start + 8, name_end);
            self.password = data.toString('ascii', password_start, password_end);

            var old_start = start;
            start += 10 + len;

            var buff;
            buff = new Buffer(10 + 11);
            buff.fill(0);

            buff[0] = 0x97;
            buff[1] = 0x11;
            buff.writeUInt32BE(data.readUInt32BE(old_start + 2), 2);
            buff[7] = 11;
            buff[8] = 0x01;
            self.session_id = ++session_id_count;
            buff.writeUInt32BE(0, 9);
            buff.writeUInt32BE(self.session_id, 13);
            buff[20] = 0x99;

            self.sock.write(buff);

            phones.push(self);

            if(start < data.length)
            {
                handle_data_internal(data, start);
            }
        }

        var on_proto_control = function(result, code) {
            var buff = new Buffer(10 + 2);
            buff.fill(0);
            buff[0] = 0x97;
            buff[1] = 0x15;
            buff[7] = 0x02;
            buff[8] = result;
            buff[9] = code;
            buff[11] = 0x99;

            self.sock.write(buff);
        }
        
        var proto_control = function(data, start) {
            var old_start = start;
            start += 10 + 25;

            var device_id = new Buffer(12);
            data.copy(device_id, 0, old_start + 16, old_start + 16 + device_id.length);

            var embed = embed_device.find_by_device_id(device_id);
            if(embed == null)
            {
                print_log("no device");
                var buff = new Buffer(10+2);
                buff.fill(0);
                buff[0] = 0x97;
                buff[1] = 0x15;
                buff.writeUInt32BE(data.readUInt32BE(old_start + 2), 2);
                buff[7] = 0x02;
                buff[8] = 0x00;
                buff[9] = 0x20; // not found
                buff[11] = 0x99; 

                self.sock.write(buff);
            }
            else
            {
                embed.control(data[old_start+28], data.readUInt32BE(old_start + 29), on_proto_control);
            }
        }

        var proto_heartbeat = function(data, start){
            var old_start = start;
            start += 10 + 0x08;

            if(start > data.length)
            {
                handle_protocal_error();
                return;
            }

            var b = new Buffer(10+2);
            b.fill(0);
            b.writeUInt8(0x97, 0);
            b.writeUInt8(0x10, 1);
            b.writeUInt32BE(data.readUInt32BE(old_start + 2), 2);
            b.writeUInt8(0x02, 7);
            b.writeUInt8(0x01, 8);
            b.writeUInt8(0x00, 9);
            b.writeUInt8(0x00, 10); // checksum
            b.writeUInt8(0x99, 11);

            self.sock.write(b);

            if(start < data.length)
            {
                handle_data_internal(data, start);
            }
        }

        return this;
    }

    var phone_instance = new phone_constructor();
    return phone_instance;
}
