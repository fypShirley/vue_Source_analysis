### 实现简单版Vue的过程，主要实现{{}}、v-model和事件指令的功能
#### 主要分为三个部分

     1.数据监听器Observer，能够对数据对象的所有属性进行监听;
        实现数据的双向绑定，首先要对数据进行劫持监听，所以我们需要设置一个监听器Observer，用来监听所有属性
     
     2.Watcher将数据监听器和指令解析器连接起来，数据的属性变动时，执行指令绑定的相应回调函数，
        1.如果属性发上变化了，就需要告诉订阅者Watcher看是否需要更新。
        
     3.指令解析器Compile，
        对每个节点元素进行扫描和解析，将相关指令对应初始化成一个订阅者Watcher

     因为订阅者是有很多个，所以我们需要有一个消息订阅器Dep来专门收集这些订阅者，然后在监听器Observer和订阅者Watcher之间进行统一管理的。=
   
>监听器Observer

>>Observer是一个数据监听器，核心是前面一直谈论的Object.defineProperty(),
对所有属性监听，利用递归来遍历所有的属性值，对其进行Object.defineProperty()操作：
```bash
    function definReactive(data,key,val){
        observers(val);//递归所有子属性
    
        Object.defineProperty(data,key,{
            enumerable:true,
            configurable:true,
            get:function(){
                console.log('属性'+key+'执行get');
                return val;
            },
            set:function(newVal){
                val = newVal;
                console.log('属性：'+key+'以及被监听，现在值为：'+newVal.toString());
            }
        })
    }
    
    function observers(data){
        if(!data || typeof data!='object'){
            return;
        }
        Object.keys(data).forEach(function(key){
            definReactive(data,key,data[key]);
        })
    }
    var library = {
        book1:{name:''},
        book2:''
    }
    observers(library);

    library.book1.name = 'vue书籍';
    library.book2 = '没有书';
    //属性book1执行get
    //属性：name以及被监听，现在值为：vue书籍
    //属性：book2以及被监听，现在值为：没有书 

```
接下来创建一个收集所有订阅者的订阅器Dep,阅器Dep主要负责收集订阅者，然后再属性变化的时候执行对应订阅者的更新函数,
再改写一下订阅器Observer，创建一个observer.js：

```bash
    function Observe(data){
        this.data = data;
        this.walk(data);
    }
    Observe.prototype = {
        walk:function(data){
            var self = this;
            Object.keys(data).forEach(function(key) {
                self.defineReactive(data, key, data[key]);
            });
        },
        defineReactive:function(data,key,val){
            observers(val);//递归所有子属性
            var dep = new Dep();

            Object.defineProperty(data,key,{
                enumerable:true,
                configurable:true,
                get:function(){
                    if(是否需要添加订阅者){
                        dep.addSub(Watcher);//在这里添加一个订阅者
                    }
                    console.log('属性'+key+'执行get');
                    return val;
                },
                set:function(newVal){
                    if(val === newVal){
                        return;
                    }
                    val = newVal;
                    dep.notify();//如果数据变化，通知所有订阅者
                    console.log('属性：'+key+'以及被监听，现在值为：'+newVal.toString());
                }
            })
        }
    }
    function observers(data){
        if(!data || typeof data!='object'){
            return;
        }
        return new Observe(data);
    }
       

    /**Dep:创建一个可以容纳订阅者的消息订阅器
     * **/

    function Dep(){
        this.subs = [];
    }
    Dep.prototype = {
        addSub:function(sub){//添加订阅者
            this.subs.push(sub);
        },
        notify:function(){//通知订阅者
            this.subs.forEach(function(sub){
                sub.update();
            })
        }
    }
    
    可以看出，订阅器Dep,添加一个订阅者是在Object.defineProperty()的get里面,这是为了让Watcher初始化进行触发，
    因此要判断是不是需要添加订阅者，后面解释。在set里面，如果数据变化，就会通知所有的订阅者，订阅者就会去执行对应的更新的函数
    以上，一个完整的订阅器完成。
```
>订阅者Watcher

>>Watcher在初始化的时候要将自己添加进订阅者Dep中，如何做到：

>>已经知道监听器Observer是在get函数执行了添加订阅者Wather的操作的，

>>所以我们只要在订阅者Watcher初始化的时候触发对应的get函数，去执行添加订阅者操作即可，

>>那要如何触发get的函数:

>>只要获取对应的属性值就可以触发了，核心原因就是因为我们使用了Object.defineProperty()进行数据监听。

>>注意：

>>我们只要在订阅者Watcher初始化的时候才需要添加订阅者，所以需要做一个判断操作，

>>因此可以在订阅器上做一下手脚：在Dep.target上缓存下订阅者，添加成功后再将其去掉就可以了。

>>创建一个watcher.js

```bash
    function Watcher(vm,exp,cb){
        this.cb = cb;
        this.vm = vm;
        this.exp = exp;
        this.value = this.get();//将自己添加到订阅器的操作
    }
    Watcher.prototype = {
        update:function () {
            this.run();
        },
        run:function () {
            var value = this.vm.data[this.exp];
            var oldVal = this.value;
            if(value != oldVal){
                this.value = value;
                this.cb.call(this.vm,value,oldVal);
            }
        },
        get:function () {
            Dep.target = this;//缓存自己
            var value = this.vm.data[this.exp];//强制执行监听器observer里的Object.defineProperty()里的get函数
            Dep.target = null;//释放自己
            return value;
        }
    }
```

再调整下observer.js的defineReactive函数里的get操作：
```bash
    defineReactive:function(data,key,val){
        observers(val);//递归所有子属性
        var dep = new Dep();

        Object.defineProperty(data,key,{
            enumerable:true,
            configurable:true,
            get:function(){
                if(Dep.target){
                    dep.addSub(Dep.target);//在这里添加一个订阅者
                }
                console.log('属性'+key+'执行get');
                return val;
            },
            set:function(newVal){
                if(val === newVal){
                    return;
                }
                val = newVal;
                dep.notify();//如果数据变化，通知所有订阅者
                console.log('属性：'+key+'以及被监听，现在值为：'+newVal.toString());
            }
        })
    }
    //Dep加个target属性
    function Dep(){
        this.subs = [];
        this.target = null;
    }
```
简单版的Watcher设计好了，
只要将Observer和Watcher关联起来，就可以实现一个简单的双向绑定数据了。
这里没有还没有设计解析器Compile，所以对于模板数据我们都进行写死处理：
模板有个节点，id为name,双向数据绑定的变量name，这里大框号暂时没有用：
```bash
<body> 
    <h1 id="name">{{name}}</h1> 
</body>

```
>selVue.js 关联Observer和Watcher

```bash
    function SelfVue(data,el,exp){
        this.data = data;
        observers(data);
        el.innerHTML = this.data[exp];//初始化模板数据的值
        
        new Watcher(this,exp,function(value){
            el.innerHTML = value;
        });
        return this;
    }
```
页面上实现双向数据绑定：
```bash
<h1 id="name">{{name}}</h1>
    <script src="js/observer.js"></script>
    <script src="js/watcher.js"></script>
    <script src="js/selfVue.js"></script>
    <script>
        var ele = document.querySelector('#name');
        var self_Vue = new SelfVue({
            name:'第一次显示数据'
        },ele,'name');
    
        window.setTimeout(function(){
            console.log('值变了');
            self_Vue.data.name = '重新赋值了';
        },2000);
    </script>
```

打开页面，可以看到页面刚开始显示了是“第一次显示数据”，过了2s后就变成“重新赋值了”了。到这里，完成了一部分

    注意：赋值的时候是 self_Vue.data.name = '重新赋值了'，但是希望是 self_Vue.name = '重新赋值了'，
    需要在new SelVue的时候做个代理，让访问self_Vue的属性代理为访问self_Vue.data的属性，
    实现原理还是使用Object.defineProperty()对属性再包一层，
修改selVue.js：
```bash
    function SelfVue(data,el,exp){
        var self = this;
        this.data = data;
    
        Object.keys(data).forEach(function (key) {
            self.proxyKeys(key);//绑定代理属性
        });
        
        observers(data);
        el.innerHTML = this.data[exp];//初始化模板数据的值
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

    //这下我们就可以直接通过self_Vue.name = '重新赋值了'的形式来进行改变模板数据。
```
至此第一阶段完成！

[ 博客详解 ](https://segmentfault.com/a/1190000013159255)<br />



