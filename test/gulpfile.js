var uglify = require('gulp-uglify')
var gulp = require('gulp')
var aliasCombo = require('../index')
    
gulp.task('default', function(){
    return gulp.src('src/apps/*.js')
		.pipe(aliasCombo({
			baseUrl: __dirname + '/src/',
        	alias: {
        		'test/a': 'views/a.js',
        		'test/b': 'views/b.js'
        	}
		}))
        .pipe(gulp.dest('dest/apps'))
})