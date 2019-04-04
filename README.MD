# mock-mini-server
Mock + Express 本地假数据服务器，数据文件格式直接采用[Mock](http://mockjs.com/)的语法，同时间，支持扩展`Mock数据占位符`

## 安装
```
npm install mock-mini-server
```

## 运行

1. 切换到需要运行本地服务器的根目录
```
cd dist
```

2. 直接运行或者指定端口号，指定的端口号会覆盖[mockhttp.js](#mockhttp.js配置)中配置的端口号
```
mock-mini-server 或者 mock-mini-server 8080
```
## mockhttp.js配置

在开启服务器的根目录下面添加配置文件`mockhttp.js`，如不添加配置文件，则采用默认配置

### `配置项`

|属性|类型|默认值|描述|
|:--:|:--:|:-----:|:----------|
|[`defaultDataFile`](#defaultDataFile)|`{String}`|`空`|静态数据文件名，，只支持`js`文件和`json`文件|
|`baseDist`|`{String}`|`空`|所有数据文件的根目录，可以是相对路劲也可以是绝对路径|
|`port`|`{Number}}`|`10100`|本地服务器端口号|
|`openBrowser`|`{Boolean}`|`false`|开启服务器是否自动打开浏览器|
|`dev`|`{Boolean}`|`false`|是否是开发模式，用于打印对应的信息|
|[`middleWare`](#middleWare)|`{Function/Array/Object}`|`空`|Express中间件，可用于截获请求，实现自定义逻辑|
|[`mockExtend`](#mockExtend)|`{Object}}`| `{}` |`Mock`数据占位符扩展|


### defaultDataFile
对于没有特殊要求的数据可以直接写在一个文件上，减少数据文件的个数，易维护

```js
defaultDataFile: 'index.json'
```

### middleWare
截获`http`请求中间件，用于处理自定义的逻辑

> middleWare: [`Object`/`Array`/`Function`]

**Object**
```js
{
    middleWare: {
        api: 'xx', 
        callback: function (req, res, next, server){
            //截获请求，处理自定义逻辑
        }
    }
}
```

**Array**
```js
{
    middleWare: [{
        api: 'xx',
        callback: function (req, res, next, server){
            //截获请求，处理自定义逻辑
        }
    }]
}
```

**Function**
```js
{
    middleWare: function (req, res, next, server){
        //截获请求，处理自定义逻辑
    }
}
```

**middleWare 参数说明**

| 属性 | 描述 |
| :---: | :--- |
| `api` | `string`，需要截获的请求，支持`glob` |
| `function` | `function`，处理自定义逻辑 |

**callback 参数说明**

`req`, `res`, `next`具体的可以看[Express中间件开发文档](http://www.expressjs.com.cn/guide/writing-middleware.html)
- 如果只是对请求的拦截附件处理，需要最后调用`next()`，以执行后续的逻辑，否则执行完回调立即停止

参数`server`为`mock-mini-server`数据处理类`MockServer`提供如下接口

- `loadData(requestUrl)`: `requestUrl`配置的数据模板对应的`key`值。根据请求的地址获取配置的数据模版生成的数据，并返回Promise。
- `updateData(requestUrl, data)`: `requestUrl`同上，`data`为对应的数据。每次请求接口，是否返回新的数据。

**middlwWare调试说明**
针对在`vscode`中进行调试说明，配置如下：

**Example**
todo by xc 添加不同的示例
```js
// Object格式
middleWare: {
    api: '/goform/module',
    callback: function(req, res, next, server) {
        server.log('中间件，劫持请求 /goform/module');
        server.loadData(req.path).then(result => {
            res.send(JSON.stringify(result));
            server.log(result);
        }).catch(err => {
            next();
        });
    }
}

// Array格式
middleWare: [
    {
        api: '/goform/module',
        callback: function(req, res, next, server) {
            server.log('中间件，劫持请求 /goform/module');
            server.loadData(req.path).then(result => {
                res.send(JSON.stringify(result));
                server.log(result);
            }).catch(err => {
                next();
            });
        }
    },
    {
        api: 'xxx',
        callback: function(){
            //xxx
        }
    }
    ...
]

// Function格式
middleWare: function(req, res, next, server){
    server.log('中间件，劫持请求 /goform/module');
    server.loadData(req.path).then(result => {
        res.send(JSON.stringify(result));
        server.log(result);
    }).catch(err => {
        next();
    });
}

```

### mockExtend
```js
mockExtend: {
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
    ......
}
```

完整示例如下：
```js
module.exports = {
    defaultDataFile: 'index.json',
    baseDist: 'data',
    port: 8090,
    openBrowser: false,
    dev: false,
    /**
    * 中间件，拦截请求之类的操作
    * req: express请求参数， res:express返回参数， next：express传递, server: 当前数据操作的server对象
    * function(req, res, next， server)
    */
    middleWare: {
        api: '/goform/module',
        callback: function(req, res, next, server) {
            server.log('中间件，劫持请求 /goform/module');
            server.loadData(req.path).then(result => {
                res.send(JSON.stringify(result));
                server.log(result);
            }).catch(err => {
                next();
            });
        }
    },
    /**
    * Moc扩展
    */
    mockExtend: {
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
        }
    }
};
```

## 数据文件配置项说明

### `配置项`

|属性|类型|默认值|描述|
|:--:|:--:|:-----:|:----------|
|`delay`|`{Number}`|`0`|延迟返回数据，单位为毫秒，默认不延迟|
|`refresh`|`{Boolean}`|`false`|每次请求接口，是否返回新的数据|
|`template`|`{Object | function}}`|`空`|mock数据模版，为function需要返回对应的数据，异步数据需要返回Promise|

如果没有其他配置参数可省略`template`，直接返回`template`对应的值

js文件例子
```js
module.exports = {
    // 有参赛配置
    getMess: {
        delay: 200,
        refresh: true,
        template: {
            'ID|+1': 1,
            'title': 'Demo',
            'mess': '★',
            'age|1-100': 100,
            'ip': '@IP',
            'ip1': '@IP("192.1-12.250-254.0")'
        }
    },
    // 无参数配置
    getData: {
        'ID|+1': 1,
        'title': 'Demo',
        'mess': '★',
        'age|1-100': 100,
        'ip': '@IP',
        'ip1': '@IP("192.1-12.250-254.0")'
    },
    // 函数模版
    getData: function(){
        return{
            a: 1
            ....
        }
    },
    // 异步数据
    getAsyncData: function(){
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(xxx);
            }, 0);
        });
    }
}

```

json文件例子
```json
{
    "getMess": {
        "delay": 200,
        "template": {
            "title": "Syntax Demo1",
            "string1|1-10": "★",
            "string2|2-4": "LOVE*",
            "number1|+1": 100,
            "number2|1-100": 100,
            "number3|1-100.1-3": 1,
            "number4|123.1-10": 1,
            "number5|123.2": 1,
            "number6|123.4": 1.123
        }
    }
}
```
