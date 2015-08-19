/**
 * 依赖存储对象
 */
function DepStore(){
    this._alias = {} 
    this._relative = {}
    this._error = {}
}

/**
 * 添加alias依赖
 */
DepStore.prototype.addAlias = function(dep, path){
    this._alias[dep] = this._alias[dep] || path
}

/**
 * 根据模块id获取alias依赖文件路径
 */
DepStore.prototype.getAlias = function(dep){
    if(dep){
        return this._alias[dep] || ''
    }else{
        return this._alias
    }
}

/**
 * 判断是否存在该依赖 
 */
DepStore.prototype.hasAlias = function(dep){
    return !!this._alias[dep]
}

/**
 * 添加相对路径的依赖
 */
DepStore.prototype.addRelative = function(dep, path){
    this._relative[dep] = this._relative[dep] || path
}

/**
 * 根据模块id获取相对路径依赖的文件路径
 */
DepStore.prototype.getRelative = function(dep){
    if(dep){
        return this._relative[dep] || ''
    }else{
        return this._relative
    }
}

/**
 * 判断是否存在该依赖 
 */
DepStore.prototype.hasRelative = function(dep){
    return !!this._relative[dep]
}

/**
 * 添加依赖错误信息 
 */
DepStore.prototype.addError = function(path, msg){
    this._error[path] = msg 
}

/**
 * 根据模块id获取相对路径依赖的文件路径
 */
DepStore.prototype.getError= function(path){
    if(path){
        return this._error[path] || ''
    }else{
        return this._error
    }
}

/**
 * 销毁对象
 */
DepStore.prototype.destroy = function(){
    delete this._alias
    delete this._relative
    delete this._error
}

module.exports = DepStore

