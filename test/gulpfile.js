var gulp = require('gulp')
var aliasCombo = require('../index')
    
gulp.task('default', function(){
    return gulp.src('src/apps/app.js')
    .pipe(aliasCombo({
        baseUrl: __dirname + '/src/',
        supportRelative: true,
        paths: {
            'module': 'views'
        },
        alias: {
            'test/a': 'views/a.js',
            'test/b': 'views/b',
            'app': 'apps/app.js'
        }
    }))
    .pipe(gulp.dest('dest/apps'))
})
