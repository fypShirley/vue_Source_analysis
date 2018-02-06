//将Observer和Watcher关联起来：

// function SelfVue(data,el,exp){  //first

function SelfVue(options){
    var self = this;

    // this.data = data;  //first
    this.data = options.data;
    this.el = options.el;
    this.methods = options.methods;

    this.vm = this; //second
    console.log(this)

    Object.keys(this.data).forEach(function (key) {
        self.proxyKeys(key);//绑定代理属性
    });

    //监听数据：
    observers(this.data);

    //first
    /*el.innerHTML = this.data[exp];//初始化模板数据的值
    new Watcher(this,exp,function(value){//绑定订阅器
        el.innerHTML = value;
    });*/

    //初始化视图updateText和生成订阅器
    new Compile(this);
    options.mounted.call(this);

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
