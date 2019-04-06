/**
 * Mock服务器类
 */
const path = require('path');
const { apiConfig } = require('./util/config');
const util = require('./util/index');
const mockExtend = require('./util/mockExtend');
const Mock = require('mockjs');
const chokidar = require('chokidar');
const templateKey = 'template';
const console = global.console;
const cwd = process.cwd();
const { throttling } = require('./util/index');

class MockServer {
    constructor(app, option) {
        this.app = app;
        this.option = option;
        this.mockTemplate = {};
        this.data = {};
        this.Mock = Mock;
        this.errorTimes = 0;
        this.apiObj = {};
        this.cwdBase = path.join(cwd, this.option.baseDist);

        if (option.mockExtend || Object.prototype.toString.call(option.mockExtend) !== '[object Object]') {
            option.mockExtend = {};
        }

        // mock添加自定义扩展
        Mock.Random.extend(Object.assign({}, mockExtend, option.mockExtend));

        this.init();
    }

    //初始化操作
    init() {
        // 获取配置的全数据模版
        this.loadStaticDatas = throttling(this.loadStaticDatas);
        this.loadStaticDatas();

        // 监听数据文件变化
        this.watchFile();
    }

    /**
     * 处理各接口配置参数
     */
    handleTemplate() {
        let templates = this.mockTemplate;

        for (let key in templates) {
            this.formatOption(key, templates[key]);
        }
    }

    // 开启服务器
    start() {
        let _this = this;
        // 挂载中间间
        this.initMidddleWare();

        //拦截请求
        this.app.all('*', function (req, res, next) {
            let apiKey = req.path.replace(/^\//, '');

            // 根据请求获取对应的文件数据
            // content-type解析客户端的回传的数据类型，同时回传json数据
            _this.loadData(apiKey, true).then((data) => {
                data = JSON.stringify(data, null, 2);
                _this.log(data);
                res.send(data);
            }).catch(() => {
                next();
            });
        });
    }

    correctUrl(url) {
        if (/^\//.test(url)) {
            return url;
        }
        return '/' + url;
    }

    /**
     * 挂载中间件
     */
    initMidddleWare() {
        let mdWare = this.option.middleWare,
            type = Object.prototype.toString.call(mdWare);

        switch (type) {
            case '[object Function]':
                this.app.use(zhuru(mdWare, this));
                break;
            case '[object Object]':
                mdWare.callback = mdWare.callback || function (req, res, next) {
                    next();
                };
                if (mdWare.api) {
                    let api = this.correctUrl(mdWare.api);
                    this.app.use(api, zhuru(mdWare.callback, this))
                } else {
                    this.app.use(zhuru(mdWare.callback, this))
                }
                break;
            case '[object Array]':
                for (let i = 0, item; item = mdWare[i++];) {
                    item.callback = item.callback || function (req, res, next) {
                        next();
                    };

                    if (item.api) {
                        item.api = this.correctUrl(item.api);
                        this.app.use(item.api, zhuru(item.callback, this));
                    } else {
                        this.app.use(zhuru(item.callback, this));
                    }
                }
                break;
        }
    }

    /**
     * 加载通过全局文件夹配置的数据
     */
    loadStaticDatas() {
        if (this.option.defaultDataFile) {
            let fullTemplate = path.join(this.cwdBase, this.option.defaultDataFile);
            // js数据模版解析
            if (path.extname(fullTemplate) === '.js') {
                new Promise((resolve, reject) => {
                    this.mockTemplate = require(fullTemplate);
                }).then(() => {
                    this.handleTemplate();
                }).catch(() => {
                    console.error(`获取全部数据模版出错, 请检查对应的数据文件格式是否正确。`);
                });
            } else {
                // json数据模版解析
                util.loadFile(fullTemplate).then(res => {
                    this.mockTemplate = JSON.parse(res);
                    this.handleTemplate();
                    this.errorTimes = 0;
                    console.error(`获取全部数据模版成功！`);
                }).catch(res => {
                    this.errorTimes++;
                    if (this.errorTimes > 1) {
                        this.errorTimes = 0;
                        console.error(`获取全部数据模版出错, 请检查对应的数据文件格式是否正确。`);
                    } else {
                        console.error(`获取全部数据模版出错, 重新获取！`);
                        this.loadStaticDatas();
                    }
                });
            }
        }
    }

    // 返回的永远是Promise对象，暴露出去的接口
    loadData(requestUrl, type) {
        let data = this.data[requestUrl];

        // 对于需要refresh的数据不会进行缓存，故data有值则说明该接口为不缓存
        if (data) {
            let obj = this.apiObj[requestUrl] || { delay: 0 };
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve(data);
                }, obj.delay);
            });
        }

        return this.loadTemplate(requestUrl).then(res => {
            let obj = this.apiObj[requestUrl] || { delay: 0 };

            if (!obj.refresh) {
                this.data[requestUrl] = res;
            }

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve(res);
                }, obj.delay);
            });
        }).catch((e) => {
            this.error(`请求[${requestUrl}]加载数据错误或者对应的内容不存在！加载默认配置！`);
            return Promise.reject();
        });
    }

    updateData(key, value) {
        if (Object.prototype.toString.call(value) === '[object Object]') {
            this.data[key] = Object.assign({}, this.data[key] || {}, value);
        } else {
            this.data[key] = value;
        }
    }

    loadTemplate(requestUrl) {
        // 对于需要refresh的数据不进行缓存，全局和局部都配置了对应的规则，以全局配置的为准
        // 解析对应的配置参数
        let obj = this.apiObj[requestUrl],
            mockItem = this.mockTemplate[requestUrl];

        //
        if (mockItem) {
            return new Promise((resolve, reject) => {
                resolve(this.mock(requestUrl, obj));
            });
        } else {
            // 加载对应的数据文件
            return this.mockData(requestUrl);
        }
    }

    /**
     * 校正数据模版配置参数，统一格式
     */
    formatOption(key, option) {
        let data = {
            delay: option.delay || apiConfig.delay,
            bindData: option.bindData !== undefined ? option.bindData : apiConfig.bindData,
            bindRule: option.bindRule !== undefined ? option.bindRule : apiConfig.bindRule
        };

        data.refresh = data.bindData ? false : (option.refresh !== undefined ? option.refresh : apiConfig.refresh);

        this.apiObj[key] = data;
        // 配置数据格式统一
        if (option[templateKey] === undefined) {
            option = {
                [templateKey]: option
            };
        }

        this.mockTemplate[key] = option;
    }

    mockData(requestUrl) {
        let url,
            _this = this;

        url = path.join(this.cwdBase, requestUrl);
        // 首先加载json文件，如没有再加载js文件
        return util.loadFile(url + '.json').then((res) => {
            _this.formatOption(requestUrl, JSON.parse(res));
            return _this.mock(requestUrl);
        }).catch((e) => {
            // 加载js文件
            _this.formatOption(requestUrl, require(`${url}.js`));
            return _this.mock(requestUrl);
        });
    }

    mock(requestUrl) {
        let obj = this.mockTemplate[requestUrl],
            data,
            template = obj[templateKey];
        if (typeof template === 'function') {
            data = template();
        } else {
            data = Mock.mock(template);
        }

        if (data instanceof Promise) {
            return data;
        } else {
            return Promise.resolve(data);
        }
    }

    /**
     * 监听数据文件变化
     */
    watchFile() {
        let watchPath = this.cwdBase;
        chokidar.watch(watchPath).on('change', (fielpath) => {
            global.console.log(`Data File "${fielpath}" has been changed`);
            let defaultPath = path.resolve(watchPath, this.option.defaultDataFile);
            try {
                if (fielpath === defaultPath) {
                    this.data = {};
                    this.apiObj = {};
                    this.mockTemplate = {};
                    this.loadStaticDatas();
                } else {
                    // 删除对应接口缓存的数据，下次访问该接口重新生成新的数据
                    editfile = editfile.replace(/\.(js|json)$/ig, '');
                    delete this.data[editfile];
                    delete this.apiObj[editfile];
                    delete this.mockTemplate[editfile];
                }
            } catch (e) {
                global.console.error(e);
            }
        });
    }

    log(text) {
        if (this.option.dev) {
            console.log(text);
        }
    }
    error(text) {
        console.error(text);
    }
}

function zhuru(mdware, server) {
    return function (req, res, next) {
        mdware.call(this, req, res, next, server);
    };
}

module.exports = MockServer;