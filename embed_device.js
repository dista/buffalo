var util = require('./util.js');
var phone = require('./phone.js');
var error_code = require('./error_code.js');
var config = require('./config.js');
//var db = require('./db.js');
var db = require('./mysqldb.js');

var embeds = [];
var user_id_count = 0;
var package_id = 0;
var timeout_mseconds = 5000;

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

exports.create_embed_device = function(c, one_step_cb) {
    var embed_device = function(){
        this.sock = c;
        this.one_step_cb = one_step_cb;
        this.remoteAddress = null;
        this.device_id;
        this.set_offline = true;
        this.device = null;
        var pending_cbs = [];
        var self = this;

        var print_log = function(msg)
        {
            console.log("device[%s]; ip[%s:%s]: %s", self.device_id, self.remoteAddress, self.remotePort, msg); 
        }

        var write_data = function(buff){
            console.log("response[%s]: %s", (new Date()), util.formatBuffer(buff));
            self.sock.write(buff);
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
                    if(self.device && self.set_offline){
                        db.set_offline(self.device.id);
                    }
                    embeds.splice(i, 1);
                    break;
                }
            }
        }

        var rm_another_logined = function(){
            for(var i = 0; i < embeds.length; i++)
            {
                if(embeds[i].device_id == self.device_id)
                {
                    if(embeds[i] != self){
                        print_log("another device already logined, destroy it");
                        embeds[i].set_offline = false;
                        embeds[i].sock.destroy();
                        embeds.splice(i, 1);
                    }

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
        
        this.handle_data = function(data, data_index){
            handle_data_internal(data, data_index);
        }

        var device_timeout = function(msg){
            if(!msg["is_handled"])
            {
                get_pending_cb(msg["package_id"]);
                msg["cb"](0, error_code.DEVICE_TIMEOUT);
            }
        }

        /*
         * payload: payload without device id, can be null
         */
        this.general_control = function(type, payload, cb){
            var msg = {"package_id": ++package_id, "cb": cb, "is_handled": false};
            pending_cbs.push(msg);

            setTimeout(device_timeout, timeout_mseconds, msg);

            var device_id_buff = new Buffer(self.device_id);

            var payload_len = 0;
            if(payload){
                payload_len = payload.length;
            }

            var buff = new Buffer(10 + 12 + payload_len);
            util.setCommonPart(buff, {"packet_id": msg["package_id"], "type": type});
            device_id_buff.copy(buff, 8);
            if(payload)
            {
                payload.copy(buff, 20);
            }
            util.setChecksum(buff);

            write_data(buff);
        }

        this.query = function(cb) {
            this.general_control(0x42, null, cb);
        }

        this.lock = function(locked, cb) {
            var buff = new Buffer(1);
            buff[0] = locked;
            this.general_control(0x43, buff, cb);
        }

        this.del_delay = function(cb) {
            this.general_control(0x46, null, cb);
        }

        this.del_time = function(time_id, cb) {
            var buff = new Buffer(1);
            buff[0] = time_id;

            this.general_control(0x45, buff, cb);
        }

        this.upload_time = function(buff, cb) {
            this.general_control(0x44, buff, cb);
        }

        this.control = function(open_or_not, delay, cb){
            var buff = new Buffer(5);
            buff[0] = open_or_not;
            buff.writeUInt32BE(delay, 1);
            this.general_control(0x41, buff, cb);
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
            if(start >= data.length)
            {
                return;
            }

            if(!self.remoteAddress)
            {
                self.remoteAddress = self.sock.remoteAddress;
                self.remotePort = self.sock.remotePort;
            }

            var len = util.checkMsg(data, start);
            if(len == null){
                handle_protocal_error();
                return null;
            }
            else if(len == -2){
                // no enough data
                self.one_step_cb(0);
            }

            console.log("request[%s]: %s", (new Date()), util.formatBuffer(data, 10 + len));

            var msg = {};
            var type = data[start + 1]; 
            msg["type"] = type;
            msg["packet_id"] = data.readUInt32BE(start + 2);

            if(self.device == null && type != 0x31){
                print_log("not logined, can't send msg");
                write_data(util.buildErr(msg, error_code.NOT_LOGINED));
                self.one_step_cb(util.getNextMsgPos(start, len) - start);
                return;
            }
            
            if(type == 0x30)
            {
                proto_heartbeat(data, start, msg, len);
                print_log("heartbeat");
            }
            else if(type == 0x31)
            {
                proto_login(data, start, msg, len);
                print_log("login");
            }
            else if(type == 0x32)
            {
                proto_status(data, start, msg, len);
                print_log("status");
            }
            else if(type == 0x33)
            {
                proto_sync_time(data, start, msg, len);
                print_log("sync time");
            }
            else if(type == 0x41)
            {
                proto_general_control_response(data, start, msg, len);
                print_log("control response");
            }
            else if(type == 0x42)
            {
                proto_query_response(data, start, msg, len);
                print_log("query response");
            }
            else if(type == 0x43)
            {
                proto_general_control_response(data, start, msg, len);
                print_log("lock response");
            }
            else if(type == 0x44)
            {
                proto_general_control_response(data, start, msg, len);
                print_log("upload time response");
            }
            else if(type == 0x45)
            {
                proto_general_control_response(data, start, msg, len);
                print_log("del_time response");
            }
            else if(type == 0x46)
            {
                proto_general_control_response(data, start, msg, len);
                print_log("del_delay response");
            }
            else
            {
                print_log("unsupport type [0x" + type.toString(16) + "]"); 
            }
        }

        var proto_login = function(data, start, msg, len){
            self.device_id = data.toString('ascii', start + 8, start + 8 + 12);

            rm_another_logined();

            var mac = data.toString('hex', start + 8 + 12, start + 8 + 12 + 6);

            var set_device_login_cb = function(err){
                if(err){
                    write_data(util.buildErr(msg, error_code.DB_ERROR));
                    self.one_step_cb(util.getNextMsgPos(start, len) - start);
                    return;
                }

                var get_time_by_device_id_cb = function(err, rows){
                    if(err){
                        write_data(util.buildErr(msg, error_code.DB_ERROR));
                        self.one_step_cb(util.getNextMsgPos(start, len) - start);
                        return;
                    }

                    var buff = new Buffer(10 + 13 + 1 + 6 * rows.length + 5);
                    util.setCommonPart(buff, msg);
                    buff[8] = 0x01;
                    self.user_id = ++user_id_count;
                    buff.writeUInt32BE(self.user_id, 10);
                    var dateBCD = util.getTimeBCD();
                    dateBCD.copy(buff, 14);
                    buff[20] = util.getWeek();
                    
                    var index = 21;
                    buff[index++] = rows.length;
                    for(var i = 0; i < rows.length; i++)
                    {
                        var time = rows[i];
                        buff[index++] = time.sid;
                        buff.writeUInt16BE(time.start_time, index); index += 2;
                        buff.writeUInt16BE(time.end_time, index); index += 2;
                        buff[index++] = time.repeatx;
                    }

                    util.setIp(buff, index, config.old_ip, config.new_ip);
                    util.setChecksum(buff);
                    write_data(buff);

                    embeds.push(self);
                    self.one_step_cb(util.getNextMsgPos(start, len) - start);
                }

                db.get_time_by_device_id(self.device.id, get_time_by_device_id_cb);
            }

            var get_device_by_device_id_cb = function(err, row){
                if(err){
                    write_data(util.buildErr(msg, error_code.DB_ERROR));
                    self.one_step_cb(util.getNextMsgPos(start, len) - start);
                    return;
                }

                if(!row){
                    write_data(util.buildErr(msg, error_code.DEVICE_ID_NOT_FOUND));
                    self.one_step_cb(util.getNextMsgPos(start, len) - start);
                    return
                }

                db.set_device_login(row.id, mac, set_device_login_cb);
                self.device = row;
            }

            db.get_device_by_device_id(self.device_id, get_device_by_device_id_cb);
        }

        var proto_heartbeat = function(data, start, msg, len){
            write_data(util.buildGeneralOk(msg));

            /*
            if(self.device){
                db.set_online(self.device.id); 
            }
            */

            self.one_step_cb(util.getNextMsgPos(start, len) - start);
        }

        var proto_sync_time = function(data, start, msg, len){
            var buff = new Buffer(10 + 7);
            util.setCommonPart(buff, msg);
            var dateBCD = util.getTimeBCD();
            dateBCD.copy(buff, 8);
            buff[8 + 6] = util.getWeek();
            util.setChecksum(buff);
            
            write_data(buff);
            self.one_step_cb(util.getNextMsgPos(start, len) - start);
        }

        var proto_status = function(data, start, msg, len){
            var device_id = data.toString('ascii', start + 12, start + 12 + 12);
            var state = data[start + 12 + 12];
            var temperature = data[start + 12 + 12 + 1];
            var humidity = data[start + 12 + 12 + 2];
            var battery = data.readUInt16BE(start + 12 + 12 + 3);
            var locked = data[start + 12 + 12 + 5]; 

            var set_device_status_cb = function(err){
                if(err)
                {
                    write_data(util.buildErr(msg, error_code.DB_ERROR));
                }
                else{
                    write_data(util.buildGeneralOk(msg));
                }

                self.one_step_cb(util.getNextMsgPos(start, len) - start);
            }

            db.set_device_status(device_id, state, temperature, humidity, battery, locked, set_device_status_cb);
        }

        var proto_query_response = function(data, start, msg, len) {
            var result = data[start + 8];
            var pid = data.readUInt32BE(start + 2);

            var cb = get_pending_cb(pid);

            if(cb == null)
            {
                print_log("proto_query_response: can't find request for package_id " + pid);
            }
            else{
                if(result != 1){
                    cb["cb"](result, data[start + 9]);      
                }
                else{
                    cb["cb"](result, data[start + 9], 
                            data[start+10], //state
                            data[start+11], //temperature
                            data[start+12], // humidity
                            data.readUInt16BE(start + 13), //battery
                            data[start+15]); // locked

                }
            }
            
            self.one_step_cb(util.getNextMsgPos(start, len) - start);
        }

        var proto_general_control_response = function(data, start, msg, len) {
            var pid = data.readUInt32BE(start + 2);
            var cb = get_pending_cb(pid);

            if(cb == null)
            {
                print_log("can't find request for package_id " + pid);
            }
            else
            {
                cb["cb"](data[start + 8], data[start + 9]);
            }

            self.one_step_cb(util.getNextMsgPos(start, len) - start);
        }

        return this;
    }

    var device = new embed_device();
    return device;
}
