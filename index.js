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
var DepStore = require('./libs/dep_store')

/*
 * 提取模块中的依赖
 * param { String } content 文件内容
 * param { Object } options 配置参数
 * param { String } filePath 文件路径
 * param { Object } depStore 依赖存储对象
 * return  提取的依赖存到 options 里
 */
function analyseDeps(content, filePath, options, depStore){
    var relativePath = '', parsedDep = null, deps = null
    deps = getDeps(content, options.exclude)
    if(deps.length > 0){
        deps.forEach(function(dep){
            if(dep){
                if(options.alias && options.alias[dep]){
                    depStore.addAlias(dep, mergePath(dep, options))
                    analyseDeps(
                        readModule(dep, depStore.getAlias(dep)),
                        depStore.getAlias(dep),
                        options,
                        depStore
                    )
                }else{
                    if(options.supportRelative && !depStore.hasAlias(dep)){
                        relativePath = getRelativePath(filePath, dep, options)
                        parsedDep = parseDep(relativePath, options.baseUrl, options.moduleIdPrefix)
                        depStore.addAlias(parsedDep, relativePath)
                        if(!depStore.hasRelative(dep)){
                            depStore.addRelative(dep, parsedDep)
                            analyseDeps(
                                readModule(parsedDep, relativePath),
                                relativePath,
                                options,
                                depStore
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
function getDeps(content, exclude){
    var deps = [], moduleId, moduleIds, result = []
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
            try {
                moduleIds = eval(dep.substring(dep.indexOf('['), dep.lastIndexOf(']') + 1))
                if(moduleIds && moduleIds.length > 0){
                    deps = deps.concat(moduleIds)
                }
            }catch(e){}
        })
    }
    if(exclude && (exclude instanceof Array)){
        for(var i=0,l=deps.length; i<l; i++){
            if(deps[i] && !inArray(exclude, deps[i])){
                result.push(deps[i])
            }
        }
    }else{
        result = deps
    }
    return result
}

/*
 * 生成相对baseUrl的模块ID
 */
function parseDep(filePath, baseUrl, moduleIdPrefix){
    filePath = filePath.replace(/\\/g, '/')
    baseUrl = baseUrl.replace(/\\/g, '/')
    var dep = filePath.replace(baseUrl, '')
    dep = dep.substring(0, dep.length - 3)
    if (moduleIdPrefix) {
        dep = moduleIdPrefix + dep
    }
    return dep
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
    return path.join(options.baseUrl, options.alias[moduleId])
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
                if(dep.indexOf(key) === 0){
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
    var moduleId = null
    for(var key in options.alias){
        if(path.normalize(mergePath(key, options)) == path.normalize(filePath)){
            moduleId = key
            break
        }
    }
    // //如果在alias中未找到文件路径对应的别名，那么取相对于baseUrl的路径作为ID
    // if(moduleId == null){
    //     moduleId = parseDep(filePath, options.baseUrl)
    // }
    return moduleId
}

/*
 * 给模块添加ID和转换模块ID为相对baseUrl的ID
 * param { String } moduleId 模块ID
 * param { String } filePath 模块文件路径
 * param { Object } relativeDep 文件的所有依赖
 * param { Object } options 配置对象
 * return { Buffer } 文件
 */
function tranform(moduleId, filePath, relativeDep, options){
    var content = ''
    var parseDefineReg = /define\s*\(/
    if (options.parseAllDefine) {
        parseDefineReg = /define\s*\(/g
    }
    if(filePath && fs.existsSync(filePath)){
        content = fs.readFileSync(filePath).toString()
        if(moduleId){
            content = content.replace(parseDefineReg, 'define("' + moduleId + '", ')
        }
        if(relativeDep){
            for(var key in relativeDep){
                if(key != relativeDep[key]){
                    content = content.replace(
                        new RegExp('require\\s*\\(\\s*[\'"]{1}'+key+'[\'"]{1}\\s*\\)', 'g'),
                        'require("' + relativeDep[key] + '")'
                    )
                }
            }
        }
    }
    return new Buffer(content)
}

/*
 * 合并依赖的模块到入口文件中
 * param { Object } depStore 依赖存储对象
 * param { String } filePath 入口文件路径
 * param { String } moduleId 入口文件对应的模块ID
 * param { Object } options 配置对象
 * return { Buffer } 合并后的Buffer
 */
function concatDeps(depStore, filePath, moduleId, options){
    var buffers = [], deps = null
    deps = depStore.getAlias()
    for(var key in deps){
        if(fs.existsSync(deps[key])){
            buffers.push(
                tranform(key, deps[key], depStore.getRelative(), options),
                new Buffer('\n')
            )
        }else{
            depStore.addError(key, deps[key])
        }
    }
    buffers.push(tranform(moduleId, filePath, depStore.getRelative(), options))
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
 * param { Object } depStore 依赖的模块
 */
function buildLog(filePath, depStore){
    var deps = depStore.getAlias()
    var error = depStore.getError()
    gutil.log(gutil.colors.green('build ' + filePath + ':'))
    for(var key in deps){
        if(deps[key]){
            console.log('  ' + key + ': [' + deps[key] + ']')
        }else{
            console.log(gutil.colors.red('  ' + key + ': [Not Found]'))
        }
    }
    if(error){
        for(var key in error){
            console.log(gutil.colors.red('  ' + key + ': [' + error[key] + '] Not Found'))
        }
    }
}

/*
 * 插件入口函数
 * param { Object } options 配置参数，必须参数
 */
function combo(options){
    options.supportRelative = options.supportRelative || false
    options.parseAllDefine = options.parseAllDefine || false
    if(!options){
        gutil.log(gutil.colors.red(PLUGIN_NAME, 'The options param is required'))
    }
    if(!options.supportRelative && !options.alias){
        gutil.log(gutil.colors.red(PLUGIN_NAME, 'The option alias is required when supportRelative is false'))
    }
    if(!options.baseUrl){
        gutil.log(gutil.colors.red(PLUGIN_NAME, 'The option baseUrl is required'))
    }
    if(options.alias){
        parseFileType(options.alias)
    }else{
        options.alias = {}
    }
    return through.obj(function(file, enc, callback){
        if(file.isBuffer()){
            var moduleId = getModuleId(file.path, options)
            var depStore = new DepStore()
            analyseDeps(file.contents.toString(), file.path, options, depStore)
            file.contents = concatDeps(depStore, file.path, moduleId, options)
            buildLog(file.path, depStore)
            callback(null, file)
            depStore.destroy()
        }
        else{
            callback(null, file)
        }
    })
}

module.exports = combo
