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

define(function(require){
	var a = require('test/a')
	var b = require('test/b')
    var c = require("views/c")
    require('jquery')
})
