define("test/a", function(require){
	var b = require('test/b')
	console.log('I am A')
})
define("test/b", function(require){
	console.log('I am B')
})
require(['test/a', 'test/b'], function(a, b){
    console.log('I am app2')
})
