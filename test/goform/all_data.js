module.exports = {
    getQosList: {
        template: {
            'title': 'getQosList Demo',
            'string1|1-10': '★',
            'string2|3': 'value',
            'number1|+1': 100,
            'number2|1-100': 100,
            'number3|1-100.1-10': 1,
            'number4|123.1-10': 1,
            'number5|123.3': 1,
            'number6|123.10': 1.123
        }
    },
    getUsers: {
        'title': 'getUsers Demo',
        'string1|1-10': 't',
        'string2|3': 'value',
        'number1|+1': 100,
    },
    delay: {
        delay: 4000,
        template: {
            'number1|+1': 100,
            'ip': '@IP',
            'ip1': '@IP("192.1-12.250-254.0")',
            'mask': '@MASK'
        }
    },
    fn: function() {
        return {
            a: 1,
            b: 2,
            c: 31
        };
    },
    delayFn: {
        template: function() {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve({
                        d: 'd*_*d'
                    });
                }, 3000);
            });
        }
    },
    refresh: {
        refresh: true,
        template: {
            'number1|+1': 100,
            'ip': '@IP',
            'ip1': '@IP("192.1-25.25-54.10-19")',
            'mask': '@MASK'
        }
    }
};