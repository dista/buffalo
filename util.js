var assert = require('assert');

int2BCD = function(d)
{
    var out = 0;
    var i = 0;
    while(d)
    {
        var x = d % 10;
        out = out | x << (4*i);
        d = Math.floor(d / 10);
        i++;
    }

    return out;
}

exports.getTimeBCD = function()
{
    var d = new Date();
    var r = new Buffer(6);
    r[0] = d.getFullYear() - 2000;
    r[1] = d.getMonth() + 1;
    r[2] = d.getDate();
    r[3] = d.getHours();
    r[4] = d.getMinutes();
    r[5] = d.getSeconds();

    for(var i = 0; i < r.length; i++)
    {
        r[i] = int2BCD(r[i]);
    }

    return r;
}

exports.getWeek = function()
{
    var r = (new Date()).getDay();
    
    if(r == 0)
    {
        r = 7;
    }

    return r;
}

exports.compareDeviceId = function(d1, d2)
{
    assert.equal(d1.length, d2.length);

    for(var i = 0; i < d1.length; i++)
    {
        if(d1[i] != d2[i])
        {
            return false;
        }
    }

    return true;
}

exports.formatDeviceId = function(device_id)
{
    var ret = "";
    for(var i = 0; i < device_id.length; i++)
    {
        var m = device_id[i];
        ret += "0x" + m.toString(16);

        if(i != device_id.length - 1)
        {
            ret += "|";
        }
    }

    return ret;
}
