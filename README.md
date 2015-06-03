# gulp-alias-combo

***
> 一个根据alias配置合并js文件的gulp插件，合并时会自动提取模块间的依赖

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
        		'monitor/underscore': "libs/underscore/1.8.3/underscore.js",
		        'monitor/backbone': "libs/backbone/1.1.2/backbone.js",
		        'monitor/project': "common/project"
        	}
		}))
        .pipe(gulp.dest('dest/apps'));
})
```
提示：

1. baseUrl和alias都是必须配置项，baseUrl和alias配置的路径合并后就是模块的绝对路径。
2. 如果在alias中没有配置的别名，在合并时会忽略，不会进行合并操作。

### 运行
```
gulp combo
```
运行完成后，会打印合并日志：
```
[16:44:18] build /work/build/src/apps/app.js:
  monitor/backbone:[/work/build/src/libs/backbone/1.1.2/backbone.js]
  monitor/underscore:[/work/build/src/libs/underscore/1.8.3/underscore.js]
  monitor/views/project:[/work/build/src/views/project.js]
```


## License

MIT @ [Peter Mu](https://github.com/PeterMu)
