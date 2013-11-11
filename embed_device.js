var util = require('./util.js');
var phone = require('./phone.js');
var error_code = require('./error_code.js');

var embeds = [];
var user_id_count = 0;
var package_id = 0;

exports.find_by_device_id = function(id) {
    for(var i = 0; i < embeds.length; i++)
    {
        if(util.compareDeviceId(embeds[i].device_id, id))
        {
            return embeds[i];
        }
    }

    return null;
}

exports.create_embed_device = function(c) {
    var embed_device = function(){
        this.sock = c;
        this.device_id = new Buffer(12);
        this.device_id.fill(0);
        var pending_cbs = [];
        var self = this;

        var print_log = function(msg)
        {
            console.log("device[%s]; ip[%s:%s]: %s", util.formatDeviceId(self.device_id), self.remoteAddress, self.remotePort, msg); 
        }

        var remove_embed_device = function()
        {
            for(var i = 0; i < embeds.length; i++)
            {
                if(embeds[i] == self)
                {
                    console.log("embed_device client[%s:%s] removed, current embed_devices: %d",
                            self.remoteAddress, self.remotePort,
                            embeds.length - 1);
                    embeds.splice(i, 1);
                    break;
                }
            }
        }

        var handle_protocal_error = function()
        {
            console.error("protocal error, client " + self.sock.remoteAddress + ":" + self.sock.remotePort);
            remove_embed_device();
            self.sock.destroy();
        }

        var get_pending_cb = function(pid)
        {
            var ret = null;
            var i = 0;
            for(; i < pending_cbs.length; i++)
            {
                if(pending_cbs[i]["package_id"] == pid)
                {
                    ret = pending_cbs[i];
                    ret["is_handled"] = true;
                    break;
                }
            } 

            if(ret)
            {
                pending_cbs.splice(i, 1);
            }

            return ret;
        }
        
        this.handle_data = function(data){
            handle_data_internal(data, 0);
        }

        var control_timeout = function(msg){
            if(!msg["is_handled"])
            {
                get_pending_cb(msg["package_id"]);
                msg["cb"](0, error_code.DEVICE_TIMEOUT);
            }
        }

        this.control = function(open_or_not, delay, cb){
            var msg = {"package_id": ++package_id, "cb": cb, "is_handled": false};
            pending_cbs.push(msg);

            setTimeout(control_timeout, 5000, msg);

            var buff = new Buffer(10 + 17);
            buff.fill(0);
            buff[0] = 0x97;
            buff[1] = 0x41;
            buff.writeUInt32BE(msg["package_id"], 2);
            buff[7] = 17;
            self.device_id.copy(buff, 8);
            buff[20] = open_or_not;
            buff.writeUInt32BE(delay, 21);
            buff[26] = 0x99;

            self.sock.write(buff);
        }

        this.handle_end = function()
        {
            remove_embed_device();
        }

        this.handle_error = function(e)
        {
            remove_embed_device();
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
            
            if(type == 0x30)
            {
                proto_heartbeat(data, start);
                print_log("heartbeat");
            }
            else if(type == 0x31)
            {
                proto_login(data, start);
                print_log("login");
            }
            else if(type == 0x41)
            {
                proto_control_response(data, start);
                print_log("control response");
            }
            else
            {
                print_log("unsupport type [0x" + type.toString(16) + "]"); 
            }
        }

        var proto_login = function(data, start){
            var old_start = start;
            start += 10 + 0x12;

            self.remoteAddress = self.sock.remoteAddress;
            self.remotePort = self.sock.remotePort;

            if(start > data.length)
            {
                handle_protocal_error();
                return;
            }

            data.copy(self.device_id, 0, old_start + 8, old_start + 8 + 12);

            var buff;
            buff = new Buffer(10 + 15);
            buff.fill(0);

            buff[0] = 0x97;
            buff[1] = 0x31;
            buff.writeUInt32BE(data.readUInt32BE(old_start + 2), 2);
            buff[7] = 15;
            buff[8] = 0x01;
            buff[9] = 0x00;
            self.user_id = ++user_id_count;
            buff.writeUInt32BE(self.user_id, 10);
            var dateBCD = util.getTimeBCD();
            dateBCD.copy(buff, 14);
            buff[20] = util.getWeek();
            buff[21] = 0x00;
            buff[23] = 0x00;
            buff[24] = 0x99;

            self.sock.write(buff);

            embeds.push(self);

            if(start < data.length)
            {
                handle_data_internal(data, start);
            }
        }

        var proto_heartbeat = function(data, start){
            var old_start = start;
            start += 10 + 0x10;

            if(start > data.length)
            {
                handle_protocal_error();
                return;
            }

            var b = new Buffer(10+2);
            b.fill(0);
            b.writeUInt8(0x97, 0);
            b.writeUInt8(0x30, 1);
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

        var proto_control_response = function(data, start) {
            var old_start = start;
            start += 10 + 2;

            var pid = data.readUInt32BE(old_start + 2);
            var msg = get_pending_cb(pid);

            if(msg == null)
            {
                console.log("proto_control_response: can't find request for package_id " + pid);
            }
            else
            {
                msg["cb"](data[old_start + 8], data[old_start + 9]);
            }

            if(start < data.length)
            {
                handle_data_internal(data, start);
            }
        }

        return this;
    }

    var device = new embed_device();
    return device;
}
