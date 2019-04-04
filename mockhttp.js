module.exports = {
    /** 
     * 全数据文件名称
     */
    defaultDataFile: 'all_data.js',
    /**
     * 所有数据文件的根目录
     */
    baseDist: 'dist/goform', //'localData',
    /**
     * 本地服务器端口
     */
    port: 10100,
    /**
     * 是否自动打开浏览器
     */
    openBrowser: true,
    /**
     * 是否是开发模式
     */
    dev: false,
    middleWare: {
        api: 'dist/module',
        callback: function(req, res, next, server) {
            server.log('中间件，劫持请求 module');
            let data = req.body;
            let resData = {};
            if (typeof data === 'object') {
                let promises = [],
                    keys = [];
                for (let key in data) {
                    if (/^set/.test(key)) {
                        resData[key] = 0;
                        server.updateData(key.replace(/^set/, 'get'), data[key]);
                    } else {
                        keys.push(key);
                        promises.push(server.loadData(key));
                    }
                }
                // 只是设置数据，则直接返回结果
                if (promises.length === 0) {
                    res.send(JSON.stringify(resData));
                    server.log(resData);
                    return;
                }

                Promise.all(promises).then(result => {
                    if (result) {
                        for (let i = 0, l = result.length; i < l; i++) {
                            resData[keys[i]] = result[i];
                        }
                    }
                    res.send(JSON.stringify(resData));
                    server.log(resData);
                }).catch(err => {
                    next();
                });
            } else {
                next();
            }
        }
    }
};