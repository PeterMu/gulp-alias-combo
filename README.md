# gulp-alias-combo

> 一个根据配置合并js文件的gulp插件，合并时会自动提取模块间的依赖

## 重要更新

添加对相对路径的支持，比如下面几种情况:

```
1. require('./test')
2. require('../test')
3. require('test')
```

## Install

```
npm install gulp-alias-combo --save-dev
```

安装依赖

```
npm install
```

## 配置参数

#### baseUrl

必须参数，要构建项目的根路径，以斜杠结束

#### supportRelative { Boolean }

可选参数，默认是false，为true时开启对相对路径的支持

#### alias { Object }

别名配置，当supportRelative为false时为必须参数，supportRelative为true是为可选参数，alias配置对象的key 为模块的别名（模块ID），value 为模块的路径，baseUrl+此处配置的路径就是模块的绝对路径, 如果需要给入口模块自定义ID，需要在alias中进行配置，key为入口模块ID，value为入口模块的路径，默认的入口模块ID是入口模块相对于baseUrl的相对路径


#### paths { Object  }

可选参数，路径的简写，只有supportRelative为true时，才会起作用，例如：

```
var test = require('views/test')

//如果配置了paths
paths: {
    'views': 'apps/modules/'
}

//解析后变为
var test = require('apps/modules/test')
```

#### exclude { Array }

可选参数, 要忽略的模块ID，合并时在exclude配置的模块ID会直接忽略

## Usage

### 使用场景

gulp-alias-combo插件主要目的是合并seajs/requirejs中依赖的模块，会把所
有依赖的模块合并到入口js文件中。合并过程中会自动提取依赖模块，不会出现
重复合并。

### 使用样例

```
var gulp = require('gulp')
var aliasCombo = require('gulp-alias-combo')

gulp.task('combo', function(){
    return gulp.src('src/apps/*.js')
        .pipe(aliasCombo({
            baseUrl: __dirname + '/src/',
            //supportRelative 默认为 false, 如果要支持相对路径模块的合并，设置为true
            supportRelative: true,
            alias: {
                'test/a': 'views/a.js',
                //会自动添加.js后缀
                'test/b': 'views/b',
                'app': 'apps/app.js'
            }
        }))
        .pipe(gulp.dest('dest/apps'));
})
```

### 合并规则

1. supportRelative 为 false 时，如果在alias中没有配置的别名，在合并时会忽略，不会进行合并操作。
2. supportRelative 为 true 时，会合并所有依赖，如果要排除特定的某些模块，在 exclude 中配置。
3. 合并相对路径的模块时，模块的ID为模块路径相对于baseUrl的相对路径。
4. 要合并的模块不要指定模块ID，合并的时候会根据alias配置设置模块的ID，模块要使用CommonJS标准写法。即：
```
defind(function(require, exports, module){
  //code
})
```
#### 举例

##### 第一种  适用 Seajs 的入口文件

要合并的入口文件：

```
define(function(require){
    var a = require('test/a')
    var b = require('test/b')
})
```
合并后：

```
define(function(require){
    var a = require('test/a')
    var b = require('test/b')
})

define('test/a', function(require, exports){
    //code
})

define('test/b', function(require, exports){
    //code
})
```

##### 第二种  适用 requirejs 的入口文件

要合并的入口文件：

```
require(['test/a', 'test/b'], function(a, b){
    //code
})
```
合并后：

```
require(['test/a', 'test/b'], function(a, b){
    //code
})

define('test/a', function(require, exports){
    //code
})

define('test/b', function(require, exports){
    //code
})
```

### 运行
```
gulp combo
```
运行完成后，会打印合并日志：
```
[16:44:18] build /work/build/src/apps/app.js:
  test/a:[/work/build/src/views/a.js]
  test/b:[/work/build/src/views/b.js]
```

## Release Notes

### v0.2.2

构建Seajs入口文件时，如果alias配置中有入口文件的配置，会给入口模块添加ID，如果没有配置，则不添加ID

### v0.2.3

将入口文件合并到构建后的文件底部，解决requirejs下的加载bug

### v0.2.4

alias 配置可以不加.js 文件类型，构建时会自动添加

### v0.2.5

添加对相对路径的支持

### v0.2.6

修复alias配置无效的bug，这个bug实在是不应该，已自己掌脸！

### v0.2.7

修复遗漏遍历某些文件依赖的bug

### v0.2.8

修改提取的依赖存储方式；入口文件没有在alias配置别名时，取消自动添加模块ID。

## License

MIT @ [Peter Mu](https://github.com/PeterMu)
