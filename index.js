/*
 * alias module combo pulgin for gulp
 * Author : mukezhai@gmail.com
 * Date : 2015-06-03
 */

var through = require('through2')
var gutil = require('gulp-util')
var fs = require('fs')
var PLUGIN_NAME = 'gulp-alias-combo'
var requireReg = /require\s*\(\s*(["'])(.+?)\1\s*\)/g
var requirejsReg = /require(js)?\s*\(\s*\[(.+?)\]/g
var commentReg = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg

/*
 * 提取模块中的依赖
 * param { String } content 文件内容
 * param { Object } options 配置参数
 * param { filePath } filePath 文件路径
 * return  提取的依赖存到options里 
 */
function analyseDeps(content, options, filePath){
    content = content.replace(commentReg, '')
    var deps = getDeps(content)
    if(deps.length > 0){
        options[filePath] = options[filePath] || {}
        deps.forEach(function(dep){
            if(dep){
                if(options.alias && options.alias[dep]){
                    options[filePath][dep] = mergePath(dep, options)
                    analyseDeps(readModule(dep, options), options, filePath)
                }
            }
        })
    }
}

/*
 * 使用正则提取依赖
 * param { String } content 内容
 * return { Array }  提取的依赖
 */
function getDeps(content){
    var deps = [], moduleId, moduleIds
    var requires = content.match(requireReg)
    if(requires){
        requires.forEach(function(dep){
            moduleId = dep.substring(dep.indexOf('(') + 1, dep.lastIndexOf(')')).trim()
            moduleId = moduleId.substring(1, moduleId.length-1)
            deps.push(moduleId)
        })
    }
    requires = content.match(requirejsReg)
    if(requires){
        requires.forEach(function(dep){
            moduleIds = eval(dep.substring(dep.indexOf('['), dep.lastIndexOf(']') + 1))
            if(moduleIds && moduleIds.length > 0){
                deps = deps.concat(moduleIds)
            }
        })
    }
    return deps 
}

/*
 * 读取依赖的文件内容
 * param { String } moduleId 模块ID
 * param { Object } options 配置参数
 * return { String } 模块内容 
 */
function readModule(moduleId, options){
    var content,
        filePath = mergePath(moduleId, options)
    try{
        content = fs.readFileSync(filePath)
        return content.toString()
    }catch(e){
        gutil.log(gutil.colors.red('Can not find ' + moduleId + ':[' + filePath + ']'))
    }
}

/*
 * 获取模块ID对应的文件地址
 * param { String } moduleId 模块ID
 * param { Object } options 配置参数
 * return { String } 文件地址 
 */
function mergePath(moduleId, options){
    return options.baseUrl + options.alias[moduleId]
}

/*
 * 获取模块ID对应的文件地址
 * param { String } moduleId 模块ID
 * param { String } filePath 配置参数
 * return { String } 文件地址
 */
function tranform(moduleId, filePath){
    var content = fs.readFileSync(filePath).toString()
    content = content.replace(/define\s*\(/, 'define("' + moduleId + '", ')
    return new Buffer(content)
}

/*
 * 合并依赖的模块到入口文件中
 * param { Object } deps 依赖的模块
 * param { String } filePath 配置参数
 * return { Buffer } 合并后的Buffer
 */
function concatDeps(deps, filePath){
    var buffers = [fs.readFileSync(filePath)]
    for(var key in deps){
        buffers.push(new Buffer('\n'), tranform(key, deps[key]))
    }
    return Buffer.concat(buffers)
}

/*
 * 判断数组中是否含有某个元素
 * param { Array } array 数组
 * param { String,Int } e 要判断的元素
 * return { Boolean } 是否含有此元素
 */
function inArray(array, e){ 
    for(i=0; i<array.length && array[i]!=e; i++);
    return !(i==array.length)
}

/*
 * 打印构建日志
 * param { filePath } filePath 构建的文件
 * param { Object } e 依赖的模块
 */
function buildLog(filePath, deps){
    gutil.log(gutil.colors.green('build ' + filePath + ':'))
    for(var key in deps){
        console.log('  ' + key + ':[' + deps[key] + ']')
    }
}

/*
 * 插件入口函数
 * param { Object } options 配置参数，必须参数
 */
function combo(options){
    return through.obj(function(file, enc, callback){
        if(!options){
            gutil.log(gutil.colors.red(PLUGIN_NAME, 'The options param is required'))
            return callback()
        }
        if(!options.alias){
            gutil.log(gutil.colors.red(PLUGIN_NAME, 'The option alias is required'))
            return callback()
        }
        if(!options.baseUrl){
            gutil.log(gutil.colors.red(PLUGIN_NAME, 'The option baseUrl is required'))
            return callback()
        }
        if(file.isBuffer()){
            analyseDeps(file.contents.toString(), options, file.path)
            file.contents = concatDeps(options[file.path], file.path)
            buildLog(file.path, options[file.path])
            callback(null, file)
        }
        else{
            callback(null, file)
        }
    })
}

module.exports = combo

