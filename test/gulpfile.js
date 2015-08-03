var gulp = require('gulp')
var aliasCombo = require('../index')
    
gulp.task('default', function(){
    return gulp.src('src/apps/app.js')
    .pipe(aliasCombo({
        baseUrl: __dirname + '/src/',
        /**
         * 支持相对路径合并, 默认为false
         */
        supportRelative: true,
        /**
         * supportRelative为true时，才会起作用
         */
        paths: {
            'module': 'views'
        },
        /**
         * 如果想忽略某些模块，需要配置exclude
         * 如果supportRelative为false时，没有配置alias的模块会自动忽略
         * 常用于supportRelative为true的情况
         */
        exclude: ['jquery', 'test/a'],
        alias: {
            'test/a': 'views/a.js',
            'test/b': 'views/b',
            'app': 'apps/app.js'
        }
    }))
    .pipe(gulp.dest('dest/apps'))
})
