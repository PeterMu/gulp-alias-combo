# gulp-alias-combo

> 一个根据alias配置合并js文件的gulp插件，合并时会自动提取模块间的依赖

## 重要更新

将入口文件合并到构建后的文件底部，解决requirejs下的加载bug

## Install

```
npm install gulp-alias-combo --save-dev
```

## Usage

### 使用场景

gulp-alias-combo插件主要目的是合并seajs/requirejs中配置的别名模块，会把所
有配置的别名模块合并到入口js文件中。合并过程中会自动提取依赖模块，不会出现
重复合并。

### 使用样例

```
var gulp = require('gulp')
var aliasCombo = require('gulp-alias-combo')
    
gulp.task('combo', function(){
    return gulp.src('src/apps/*.js')
        .pipe(aliasCombo({
            baseUrl: __dirname + '/src/',
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
提示：

1. baseUrl和alias都是必须配置项。
2. baseUrl和alias配置的路径合并后就是模块的绝对路径。

### 合并规则

1. 如果在alias中没有配置的别名，在合并时会忽略，不会进行合并操作。
2. 要合并的模块不要指定模块ID，合并的时候会根据alias配置设置模块的ID，模块要使用CommonJS标准写法。即：
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

## License

MIT @ [Peter Mu](https://github.com/PeterMu)

