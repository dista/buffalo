var sqlite3 = require('sqlite3');
var crypto = require("crypto");
var util = require("./util.js");
var mysql = require("mysql");

var db = mysql.createConnection({
    host : "localhost",
    user: "buffalo",
    password: "buffalo",
    database: "buffalo"
});

var die = function(msg, err){
    console.log(msg + ": " + err);
    process.exit(1);
}

db.connect(function(err){
    if(err){
        die("connect mysql error", err);
        return;
    }

    /*
    db.query('use buffalo', function(){
        for(var i = 0; i <= 5000; i++){
            db.query('INSERT INTO device (device_id, ssid) VALUES (?, ?)', ["RELEASE1" + util.formatNumber(i, 4), util.formatNumber(i, 4)]);
        }
    });
    */

    db.query("show databases", function(err, rows){
        var has_db = false;
        for(var i = 0; i < rows.length; i++){
            if(rows[i].Database == "buffalo"){
                has_db = true;
                break;
            }
        }

        if(!has_db){
            db.query('CREATE DATABASE IF NOT EXISTS buffalo', function(){
            db.query('use buffalo', function(){
            db.query('CREATE TABLE IF NOT EXISTS user (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(32) UNIQUE, email VARCHAR(100) UNIQUE, password VARCHAR(64), created_time DATETIME, last_login DATETIME, login_times INT(11) DEFAULT 0)', function(){
            db.query('CREATE INDEX name_index ON user(name)', function(){
            db.query('CREATE INDEX email_index ON user(email)', function(){
            db.query('CREATE INDEX name_pass_index ON user(name, password)', function(){
            db.query('CREATE INDEX email_pass_index ON user(email, password)', function(){
            db.query('CREATE TABLE device (id INT PRIMARY KEY AUTO_INCREMENT, device_id VARCHAR(16) UNIQUE NOT NULL, ssid VARCHAR(32), mac VARCHAR(32), state TINYINT DEFAULT 0, temperature TINYINT DEFAULT 0,' +
                   'humidity TINYINT DEFAULT 0, battery SMALLINT DEFAULT 0, locked TINYINT DEFAULT 0, online TINYINT DEFAULT 0, last_login DATETIME, login_times INT DEFAULT 0)', function(){
            db.query('CREATE INDEX device_id_index ON device(device_id)', function(){
            db.query('CREATE TABLE user_device(user_id INT, device_id INT)', function(){
            db.query('CREATE INDEX user_id_index on user_device(user_id)', function(){
            db.query('CREATE UNIQUE INDEX user_device_index on user_device(user_id, device_id)', function(){
            db.query('CREATE TABLE IF NOT EXISTS time (sid TINYINT, start_time INT, end_time INT, repeatx TINYINT, device_id INT,'+
                   ' FOREIGN KEY(device_id) REFERENCES device(id))', function(){
            db.query('CREATE UNIQUE INDEX sid_index ON time(sid, device_id)', function(){
            // last
            });
            });
            });
            });
            });
            });
            });
            });
            });
            });
            });
            });
            });
            });
        }
    });

    /*
    db.query('CREATE DATABASE IF NOT EXISTS buffalo');
    db.query('CREATE TABLE IF NOT EXISTS user (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(32) UNIQUE, email VARCHAR(100) UNIQUE, password VARCHAR(64), created_time DATETIME, last_login DATETIME, login_times INT(11) DEFAULT 0)', function(err, rows){
        console.log(err);
    });
    db.query('CREATE INDEX name_index ON user(name)');
    db.query('CREATE INDEX email_index ON user(email)');
    db.query('CREATE INDEX name_pass_index ON user(name, password)');
    db.query('CREATE INDEX email_pass_index ON user(email, password)');
    db.query('CREATE TABLE device (id INT PRIMARY KEY AUTO_INCREMENT, device_id VARCHAR(16) UNIQUE NOT NULL, ssid VARCHAR(32), mac VARCHAR(32), state TINYINT DEFAULT 0, temperature TINYINT DEFAULT 0,' +
           'humidity TINYINT DEFAULT 0, battery SMALLINT DEFAULT 0, locked TINYINT DEFAULT 0, online TINYINT DEFAULT 0, last_login DATETIME, login_times INT DEFAULT 0)');
    db.query('CREATE INDEX device_id_index ON device(device_id)');
    db.query('CREATE TABLE user_device(user_id INT, device_id INT)');
    db.query('CREATE INDEX user_id_index on user_device(user_id)');
    db.query('CREATE UNIQUE INDEX user_device_index on user_device(user_id, device_id)');
    db.query('CREATE TABLE IF NOT EXISTS time (sid TINYINT, start_time INT, end_time INT, repeatx TINYINT, device_id INT,'+
           ' FOREIGN KEY(device_id) REFERENCES device(id))');
    db.query('CREATE UNIQUE INDEX sid_index ON time(sid, device_id)');
    */
});


exports.register_user = function(name, email, password, cb)
{
    var sha1 = crypto.createHash('sha1');
    sha1.update(password);
    var hashed_pass = sha1.digest('hex');

    db.query("INSERT INTO user (name, email, password, created_time, last_login) VALUES (?, ?, ?, ?, ?)", [name, email, hashed_pass, new Date(), new Date()], cb);
}

var get_hashed_password = function(password)
{
    var sha1 = crypto.createHash('sha1');
    sha1.update(password);
    var hashed_pass = sha1.digest('hex');

    return hashed_pass;
}

exports.get_hashed_password = get_hashed_password;

/*
 * cb(err, result)
 *
 */
exports.check_name = function(name, cb)
{
    db.query("SELECT id FROM user WHERE name=?", [name], function(err, rows){
        if(err){
            cb(err);
        }
        else{
            if(rows.length > 0){
                cb(null, false);
            }
            else{
                cb(null, true);
            }
        }
    });
}

/*
 * cb(err, result)
 *
 */
exports.check_email = function(email, cb)
{
    db.query("SELECT id FROM user WHERE email=?", [email], function(err, rows){
        if(err){
            cb(err);
        }
        else{
            if(rows.length > 0){
                cb(null, false);
            }
            else{
                cb(null, true);
            }
        }
    });
}

exports.get_by_name_or_email = function(name_or_email, is_email, cb)
{
    var sql;

    if(is_email){
        sql = "SELECT * FROM user WHERE email=?";
    }
    else{
        sql = "SELECT * FROM user WHERE name=?";
    }

    db.query(sql, [name_or_email], function(err, rows){
        if(!err && rows.length > 0){
            cb(err, rows[0]);
        }
        else{
            cb(err, null);
        }
    });
}

exports.set_login_info = function(id){
    db.query("UPDATE user set last_login=?, login_times=(login_times+1) WHERE id=?",
            [new Date(),id]);
}

exports.get_user_by_name = function(name, cb)
{
    db.query("SELECT * FROM user WHERE name=?", [name], function(err, rows){
        if(!err && rows.length > 0){
            cb(err, rows[0]);
        }
        else{
            cb(err, null);
        }
    });
}

exports.get_device_by_device_id = function(device_id, cb){
    db.query("SELECT * FROM device WHERE device_id=?", [device_id], function(err, rows){
        if(!err && rows.length > 0){
            cb(err, rows[0]);
        }
        else{
            cb(err, null);
        }
    });
}

exports.set_device_login = function(id, mac, cb){
    db.query("UPDATE device set mac=?, last_login=?, login_times=(login_times+1), online=1 WHERE id=?", [mac, (new Date()), id], cb);
}

exports.set_device_status = function(device_id, state, temperature, humidity, battery, locked, cb)
{
    db.query("UPDATE device set state=?, temperature=?, humidity=?, battery=?, locked=? WHERE device_id=?",
            [state,
            temperature,
            humidity,
            battery,
            locked,
            device_id],
            cb);
} 

/*
 * cb(err, result)
 *
 */
exports.get_device_by_device_id_and_ssid = function(device_id, ssid, cb)
{
    db.query("SELECT * FROM device WHERE device_id=? AND ssid=?", [device_id, ssid],
            function(err, rows){
                if(!err && rows.length > 0){
                    cb(err, rows[0]);
                }
                else{
                    cb(err, null);
                }
            }
            );
}

exports.asso_user_device = function(user_id, device_id, cb)
{
    db.query("INSERT INTO user_device (user_id, device_id) VALUES (?, ?)", [user_id, device_id], cb);
} 

exports.set_password = function(id, pass, cb){
    db.query("UPDATE user SET password=? WHERE id=?", [get_hashed_password(pass), id], cb);
}

exports.del_time = function(sid, device_id, cb){
    db.query("DELETE FROM time WHERE sid=? and device_id=?", [sid, device_id], cb);
}

exports.get_random_password = function(){
    return crypto.randomBytes(3).toString('hex');
}

exports.del_from_user_device = function(device_id, cb){
    db.query("DELETE FROM user_device WHERE device_id=?", [device_id], cb);
}

exports.del_from_time = function(device_id, cb){
    db.query("DELETE FROM time WHERE device_id=?", [device_id], cb);
}

exports.get_all_devices = function(user_id, cb){
    db.query("SELECT device.* FROM device, user_device, user WHERE user.id=? AND user.id=user_device.user_id AND device.id=user_device.device_id",
            [user_id], cb
            )
}

exports.get_by_sid = function(sid, device_id, cb, ctx){
    db.query("SELECT * FROM time WHERE sid=? AND device_id=?", [sid, device_id], function(err, rows){
        if(!err && rows.length > 0){
            cb(err, rows[0], ctx);
        }
        else{
            cb(err, null, ctx);
        }
    });
}

var get_time_by_device_id = function(device_id, cb, ctx){
    db.query("SELECT * FROM time where device_id=?", [device_id], function(err, rows){
        cb(err, rows, ctx);
    }); 
}

exports.get_time_by_device_id = get_time_by_device_id;

exports.set_offline = function(id){
    db.query("UPDATE device set online=0 WHERE id=?", [id]);
}

exports.set_online = function(id){
    db.query("UPDATE device set online=1 WHERE id=?", [id]);
}

exports.add_or_update_time = function(is_update, device_id, sid, start_time, end_time, repeatx, cb){
    if(is_update){
        db.query("UPDATE time SET start_time=?, end_time=?, repeatx=? WHERE sid=? and device_id=?", [start_time, end_time, repeatx, sid, device_id], cb);
    }
    else{
        db.query("INSERT into time VALUES(?, ?, ?, ?, ?)", 
                [sid,
                start_time,
                end_time,
                repeatx,
                device_id],
                cb
              );
    }
} 
