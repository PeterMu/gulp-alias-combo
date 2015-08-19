
define("test/b", function(require){
    var c = require("views/c")
	console.log('I am B')
})

define("views/c", function(require){
    var d = require("views/d")
    console.log('I am C')
})

define("views/d", function(require){
    console.log('I am D')
})

requirejs( ['./views/a', 'test/b' ] , function(a, b){
    console.log('I am app3')
})
