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

/**
 * test
*/
define("app", function(require){
    var a = require('test/a')
    var b = require('test/b')
    var c = require("views/c")
    require('jquery')
    xxx.define('test')

    var obj = {
        name: "test", //注释
        age: 19,//注释前和属性值之间没有空格
        sex: 'male'//test
    }
})
