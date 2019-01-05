const Mock = require('mockjs');

// 扩展mock
module.exports = {
    // ip地址段落
    ip: function(iptext) {
        if (iptext === '' || iptext === undefined) {
            return `192.168.${this.integer(0, 255)}.${this.integer(1, 254)}`;
        }

        let ip = [];
        iptext += '';
        iptext.split('.').forEach(item => {
            item = item.split('-');
            ip.push(item.length > 1 ? this.integer(item[0], item[1]) : item);
        });

        return ip.join('.');
    },
    // mask
    mask: function() {
        return '255.255.255.0';
    },
    mac: function() {
        return Mock.mock(/[0-9A-F][02468ACE]:([0-9A-F]{2}:){4}[0-9A-F]{2}/);
    },
    listobject: function(obj) {
        let data = Mock.mock(obj);
        for (let key in obj) {
            return obj[key];
        }
    }
};