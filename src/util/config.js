module.exports = {
    baseConfig: {
        /** 
         * 全数据文件名称
         */
        defaultDataFile: '',
        /**
         * 所有数据文件的根目录
         */
        baseDist: '', //'localData',
        /**
         * 本地服务器端口
         */
        port: 10100,
        /**
         * 是否自动打开浏览器
         */
        openBrowser: false,
        /**
         * 是否是开发模式
         */
        dev: false,
        /**
         * 中间件，拦截请求之类的操作
         * req: express请求参数， res:express返回参数， next：express传递, server: 当前数据操作的server对象
         * function(req, res, next， server)
         */
        middleWare: null,
        /**
         * Mock扩展
         */
        mockExtend: {}
    },
    /**
     * 请求API相关配置
     */
    apiConfig: {
        /**
         * 请求的延时
         * 毫秒为单位，0表示不延时
         */
        delay: 0,
        /**
         * 每次请求接口是否都刷新数据
         */
        refresh: false,
        /**
         * 是否实时更新设置的数据，用于提交接口的数据保存，如若设置为true，refresh自动为false
         * 暂时先不开发该功能
         */
        bindData: false,
        /**
         * bindData对应的规则，可以是function也可以是{a: function(){}}
         * function(requsetData, localData){}
         * 暂时先不开发该功能
         */
        bindRule: {},
        /**
         * 是否保存本次数据用于下次开启服务器时的数据更新
         * 暂时先不开发该功能
         */
        saveData: false
    },
    /**
     * 全局配置文件地址
     */
    configFile: 'mockhttp.js'
};