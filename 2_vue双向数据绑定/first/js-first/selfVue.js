//将Observer和Watcher关联起来：
function SelfVue(data,el,exp){
    var self = this;
    this.data = data;


    Object.keys(data).forEach(function (key) {
        self.proxyKeys(key);//绑定代理属性
    });
    el.innerHTML = this.data[exp];//初始化模板数据的值

    observers(data);

    new Watcher(this,exp,function(value){
        el.innerHTML = value;
    });
    return this;
}

SelfVue.prototype = {
    proxyKeys:function(key){
        var self = this;
        Object.defineProperty(this,key,{
            enumerable:false,
            configurable:true,
            get:function proxyGetter(){
                return self.data[key];
            },
            set:function proxySetter(newVal){
                self.data[key] = newVal;
            }
        })
    }
}
