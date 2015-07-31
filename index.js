/*
 * alias module combo pulgin for gulp
 * Author : mukezhai@gmail.com
 * Date : 2015-06-03
 */

var through = require('through2')
var gutil = require('gulp-util')
var fs = require('fs')
var path = require('path')
var PLUGIN_NAME = 'gulp-alias-combo'
var requireReg = /require\s*\(\s*(["'])(.+?)\1\s*\)/g
var requirejsReg = /require(js)?\s*\(\s*\[(.+?)\]/g
var commentReg = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg
var jsFileReg = /^.+\.js$/

/*
 * 提取模块中的依赖
 * param { String } content 文件内容
 * param { Object } options 配置参数
 * param { String } filePath 文件路径
 * param { String } startfile 入口文件路径
 * return  提取的依赖存到options里 
 */
function analyseDeps(content, filePath, options, startFile){
    var relativePath = '', parsedDep = null
    content = content.replace(commentReg, '')
    var deps = getDeps(content)
    if(deps.length > 0){
        options[startFile] = options[startFile] || {}
        deps.forEach(function(dep){
            if(dep){
                if(options.alias && options.alias[dep]){
                    pushDep(options, startFile, dep, mergePath(dep, options))
                    analyseDeps(
                        readModule(dep, options[startFile][dep]),
                        options[startFile][dep],
                        options,
                        startFile
                    )
                }else{
                    if(options.supportRelative && !options[startFile][dep]){
                        options[filePath + '-r'] = options[filePath + '-r'] || {}
                        relativePath = getRelativePath(filePath, dep, options)
                        parsedDep = parseDep(relativePath, options.baseUrl)
                        pushDep(options, startFile, parsedDep, relativePath)
                        if(!options[filePath + '-r'][dep]){
                            options[filePath + '-r'][dep] = parsedDep 
                            analyseDeps(
                                readModule(parsedDep, relativePath),
                                relativePath,
                                options,
                                startFile
                            )
                        }
                    }
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
 * 生成相对baseUrl的模块ID
 */
function parseDep(filePath, baseUrl){
    var dep = filePath.replace(baseUrl, '')
    return dep.substring(0, dep.length - 3)
}

/*
 * 添加依赖
 */
function pushDep(options, startFile, dep ,filePath){
    if(fs.existsSync(filePath)){
        options[startFile][dep] = filePath
    }else{
        options[startFile][dep] = null
    }
}

/*
 * 读取依赖的文件内容
 * param { String } moduleId 模块ID
 * param { String } filePath 文件路径 
 * return { String } 模块内容 
 */
function readModule(moduleId, filePath){
    var content = ''
    try{
        if(filePath && fs.existsSync(filePath)){
            content = fs.readFileSync(filePath).toString()
        }else{
            content = ''
        }
        return content
    }catch(e){
        gutil.log(gutil.colors.red(e))
        return content
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
 * 根据相对路径获取绝对路径
 */
function getRelativePath(filePath, dep, options){
    var reg = /^\.{1,2}[^\.]+/, url = ''
    if(reg.test(dep)){
        url = path.resolve(filePath, '../', dep)
    }else{
        if(options.paths){
            for(var key in options.paths){
                if(dep.indexOf(key) != -1){
                    dep = dep.replace(key, options.paths[key])
                }
            }
        }
        url = path.resolve(options.baseUrl, dep)
    }
    if(!jsFileReg.test(url)){
        url += '.js'
    }
    return url
}

/*
 * 根据模块路径获取模块的ID
 * param { String } filePath 文件路径
 * param { Object } options 配置参数
 * return { String } 模块ID
 */
function getModuleId(filePath, options){
    var moduleId = ''
    for(var key in options.alias){
        if(path.normalize(mergePath(key, options)) == path.normalize(filePath)){
            moduleId = key
        }
    }
    return moduleId
}

/*
 * 给模块添加ID和转换模块ID为相对baseUrl的ID 
 * param { String } moduleId 模块ID
 * param { String } filePath 模块文件路径 
 * param { String } deps 文件的所有依赖 
 * return { Buffer } 文件
 */
function tranform(moduleId, filePath, options){
    var content = '', parsedDeps = options[filePath + '-r']
    if(filePath && fs.existsSync(filePath)){
        content = fs.readFileSync(filePath).toString()
        content = content.replace(/define\s*\(/, 'define("' + moduleId + '", ')
        if(parsedDeps){
            for(var key in parsedDeps){
                if(key != parsedDeps[key]){
                    content = content.replace(
                        new RegExp('require\\s*\\(\\s*[\'"]{1}'+key+'[\'"]{1}\\s*\\)', 'g'),
                        'require("' + parsedDeps[key] + '")'
                    )
                }
            }
        }
    }
    return new Buffer(content)
}

/*
 * 合并依赖的模块到入口文件中
 * param { Object } options 配置参数 
 * param { String } filePath 入口文件路径
 * param { String } moduleId 入口文件对应的模块ID
 * return { Buffer } 合并后的Buffer
 */
function concatDeps(options, filePath, moduleId){
    var buffers = []
    for(var key in options[filePath]){
        buffers.push(
            tranform(key, options[filePath][key], options), 
            new Buffer('\n')
        )    
    }
    if(moduleId){
        buffers.push(tranform(moduleId, filePath, options))
    }else{
        buffers.push(fs.readFileSync(filePath))
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
 * 文件类型处理，如果没有js后缀，会自动添加 .js
 */
function parseFileType(alias){
    for(var key in alias){
        if(!jsFileReg.test(alias[key])){
            alias[key] += '.js'
        }
    }
}

/*
 * 打印构建日志
 * param { filePath } filePath 构建的文件
 * param { Object } e 依赖的模块
 */
function buildLog(filePath, deps){
    gutil.log(gutil.colors.green('build ' + filePath + ':'))
    for(var key in deps){
        if(deps[key]){
            console.log('  ' + key + ': [' + deps[key] + ']')
        }else{
            console.log(gutil.colors.red('  ' + key + ': [Not Found]'))
        }
    }
}

/*
 * 插件入口函数
 * param { Object } options 配置参数，必须参数
 */
function combo(options){
    if(!options){
        gutil.log(gutil.colors.red(PLUGIN_NAME, 'The options param is required'))
    }
    if(!options.alias){
        gutil.log(gutil.colors.red(PLUGIN_NAME, 'The option alias is required'))
    }
    if(!options.baseUrl){
        gutil.log(gutil.colors.red(PLUGIN_NAME, 'The option baseUrl is required'))
    }
    parseFileType(options.alias)
    return through.obj(function(file, enc, callback){
        if(file.isBuffer()){
            var moduleId = getModuleId(file.path, options)
            analyseDeps(file.contents.toString(), file.path, options, file.path)
            file.contents = concatDeps(options, file.path, moduleId)
            buildLog(file.path, options[file.path])
            callback(null, file)
        }
        else{
            callback(null, file)
        }
    })
}

module.exports = combo

