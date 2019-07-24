const Express = require('express');
const bodyParser = require('body-parser');
const opn = require('opn');
const path = require('path');
const fs = require('fs');
const config = require('./util/config');
const MockServer = require('./MockServer.js');
const app = Express();

let curData = {};
let cwd = process.cwd();
let { loadFile } = require('./util/index');
let options, port, mockServer, showLog;


function startServer(serverConfig) {
    //读取相关配置
    try {
        if (serverConfig) {
            if (typeof serverConfig === 'string') {
                if (path.isAbsolute(serverConfig) && fs.existsSync(serverConfig)) {
                    serverConfig = serverConfig;
                } else {
                    serverConfig = path.join(cwd, serverConfig);
                }
                delete require.cache[serverConfig];
                serverConfig = require(serverConfig);
            } else if (Object.prototype.toString.call(serverConfig) !== '[object Object]') {
                serverConfig = {};
            }
        } else {
            delete require.cache[path.join(cwd, config.configFile)];
            serverConfig = require(path.join(cwd, config.configFile));
        }
        options = Object.assign({}, config.baseConfig, serverConfig);
    } catch (e) {
        console.log(e.message);
        options = Object.assign({}, config.baseConfig);
    }

    showLog = options.dev;

    // 解析target地址
    if (options.contentBase) {
        if (path.isAbsolute(options.contentBase) && fs.existsSync(options.contentBase)) {
            cwd = options.contentBase;
        } else {
            cwd = path.join(cwd, options.contentBase);
        }
    }

    // 端口号，添加判断机制
    if (process.argv.length > 2) {
        let _port = +process.argv[2];

        port = isNaN(_port) ? options.port : _port;
    } else {
        port = options.port;
    }

    startMockServer();
    initMidware();
}
console.log('log data .....');

function startMockServer() {
    // 挂载mockserver，读取配置参数
    mockServer = new MockServer(app, options, cwd);
}

function initMidware() {
    // for parsing application/json
    app.use(bodyParser.json());
    // for parsing application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: true }));

    // 启用静态文件的访问
    app.use(Express.static(cwd));

    /**
     * 处理所有的请求，中间件
     */
    app.all('*', function(req, res, next) {
        // 允许跨域
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");

        if (showLog) {
            let reqData = req.body;
            global.console.log(`请求：${req.path}, 内容：${JSON.stringify(reqData, 2)}`);
        }
        next();
    });

    //请求地址为空，默认重定向到index.html文件
    app.get('/', (req, res) => {
        res.redirect(301, 'index.html');
    });

    // 开启mock server自定义中间件
    mockServer.start();

    // 对于无法匹配的规则，返回默认的内容
    //区分不同的请求返回不同的页面内容
    app.all('*', (req, res) => {
        if (req.method.toLowerCase() === 'get') {
            // 对应未匹配的html请求，返回默认的文本
            if (/\.(html|htm)/.test(req.originalUrl)) {
                res.set('Content-Type', 'text/html');
                res.send('Welcome to Mock Mini Server!');
            } else if (req.originalUrl === '/favicon.ico') {
                res.set('Content-Type', 'application/x-ico');
                res.send('');
            } else {
                // 其它get请求返回404
                res.status(404).end();
            }
        } else if (req.method.toLowerCase() === 'post') {
            // 读取当前已缓存的数据信息返回，如果没有，则返回errorCode: 0
            let postBackData = {},
                curData = mockServer.data,
                requestPath = req.path.replace(/^\//, '');
            if (curData[requestPath]) {
                postBackData = curData[requestPath];
            } else if (Object.prototype.toString(req.body) === '[object Object]') {
                for (let key in req.body) {
                    if (curData.hasOwnProperty(key)) {
                        postBackData[key] = curData[key] || 0;
                    }
                }
            } else {
                postBackData = {
                    errorCode: 0
                };
            }
            res.send(JSON.stringify(postBackData));
        } else {
            res.status(404).end();
        }
    });
}

function run(config) {
    startServer(config);

    let openBrowser = options.openBrowser;
    let server = app.listen(port, () => {
        global.console.log(`Server Listenig At http://localhost:${port}`);
        openBrowser && opn(`http://127.0.0.1:${port}`);
    });

    server.port = port;

    server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            console.log(`端口[${port}]已被占用，请使用其他端口`);
            setTimeout(() => {
                server.close();
            }, 1000);
        }
    });

    return server;
}

module.exports = {
    run
};