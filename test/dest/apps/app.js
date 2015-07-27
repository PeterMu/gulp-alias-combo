define("test/a", function(require){
	var b = require('test/b')
	console.log('I am A')
})
define("test/b", function(require){
	console.log('I am B')
})
define("app", function(require){
	var a = require('test/a')
	var b = require('test/b')
})