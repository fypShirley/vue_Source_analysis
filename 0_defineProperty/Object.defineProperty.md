## Vue双向绑定的实现原理Object.defineproperty

    Object.defineProperty()方法直接在一个对象上定义一个新属性，或者修改一个已经存在的属性， 并返回这个对象。

    vueJS采用 ES5 提供的 Object.defineProperty() 方法，监控对数据的操作，从而可以自动触发数据同步。并且，由于是在不同的数据上触发同步，可以精确的将变更发送给绑定的视图，而不是对所有的数据都执行一次检测。

>  首先我们得先知道,ECMAScript中有两种属性:数据属性和访问器属性（ ie8以下只能在dom对象上使用；不能使用在普通对象上）

>数据属性：

>>    [[Configurable]]: 表示能否修改属性。默认值为true

>>    [[Enumerable]]: 表示属性是否可枚举,也就是是否可以通过for-in循环返回属性。默认值为true

>>    [[Writable]]: 表示能否修改属性的值。默认值为true

>>    [[value]]: 包含这个属性的值.读取属性的时候就是通过这里开始读。默认值为undefined

>访问器属性：

>>    [[Configurable]]: 表示能否修改属性。默认值为true

>>    [[Enumerable]]: 表示属性是否可枚举,也就是是否可以通过for-in循环返回属性。默认值为true

>>    [[Get]]: 在读取属性时调用的函数，默认时undefined

>>    [[Set]]: 在设置属性时调用的函数，默认时undefined

    我们要是想修改默认属性的值就可以使用：
    Object.defineProperty(obj,prop,descriptor):


### 1.基本用法：

    var a= {}
    Object.defineProperty(a,"b",{
        value:123
    });
    console.log(a.b);//123

### 2.参数介绍：

> 第一个参数obj：目标对象a

> 第二个参数prop：需要定义的属性或方法的名字"b"

> 第二个参数descriptor：目标属性所拥有的特性

#### 2.1 第三个参数的取值介绍（descriptor）
```bash

  
    value：属性的值

    writable：如果为false，属性的值就不能被重写,只能为只读了

    configurable：总开关，一旦为false，就不能再设置他的（value，writable，configurable）

    enumerable：是否能在for...in循环中遍历出来或在Object.keys中列举出来。

    get：后面介绍

    set：后面介绍

    注意：在 descriptor 中不能同时设置访问器（get 和 set）和 wriable 或 value，否则会错，就是说用 get 和 set，就不能用 writable 或 value 中的任何一个

在基本用法里只设置了value,没有设置别的，可以简单的理解为（暂时这样理解）它会默认帮我们把writable，configurable，enumerable。都设上值，而且值还都是false。（仅限于第一次设置的时候）,等同于以下代码：

    var a = {}; 
    Object.defineProperty(a, 'b', {
         value: 123, 
         writable: false, 
         enumerable: false, 
         configurable: false 
    }); 
    console.log(a.b); //123
```
####  2.1.1 configurable介绍
    总开关，第一次设置 false 之后，，第二次什么设置也不行了：
    也就是说,你可以使用Object.defineProperty()方法无限修改同一个属性,但是当把configurable改为false之后就有限制了
    
    var a = {};
    Object.defineProperty(a, 'b', { 
        configurable: false
    }); 
    Object.defineProperty(a, 'b',{ 
        configurable: true 
    });
    //报错：Uncaught TypeError: Cannot redefine property: b(…) 

####  2.1.2 writable介绍

    var a = {}; 
    Object.defineProperty(a, 'b', { 
        value: 123,
        writable: false //只读
    });
    console.log(a.b); // 打印 123 
    a.b = 124; // 没有错误抛出（在严格模式下会抛出，即使之前已经有相同的值） 
    console.log(a.b); // 打印 123， 赋值不起作用。

#### 2.1.3 enumerable介绍

    var a = {}
        Object.defineProperty(a,"b",{
            value:3445,
            enumerable:true
    });
    console.log(Object.keys(a));// 打印["b"]

    //改成false:

    var a = {}
        Object.defineProperty(a,"b",{
            value:3445,
            enumerable:false
    });
    console.log(Object.keys(a));// 打印[]

#### 2.1.4 set & get 

    访问器属性不能直接定义!只能通过Object.defineProperty()来定义：
    var a= {}
    Object.defineProperty(a,"b",{
        set:function(newValue){
            console.log("赋值是:"+newValue)
        },
        get:function(){
            console.log("取值:")
            return 2 //注意这里，我硬编码返回2
        }
    });
    a.b =1; //赋值是: 1
    console.log(a.b) ;   //取值  2  

    简单来说，这个 b 赋值或者取值的时候会分别触发 set 和 get 对应的函数


### 3.Object.defineProperty示例：  

    //判断是不是对象
    function isObj(obj){
        var type = Object.prototype.toString.call(obj);
        return type === '[object Object]';
    }
     
    //执行函数：
    function objFun(obj){
        if(isObj(obj)){
            new Observer(obj);
        }
    }

    function Observer(obj){
        this.data = obj;
        this.walk(obj);
    }

     //监听事件函数：
    Observer.prototype.walk = function(obj){
        for(var k in obj){
            def(obj,k,obj[k])
        }
    }

    function def(obj,k,val){
        Object.defineProperty(obj,k,{
            configurable:true,
            enumerable:true,
            get:function(){
                console.log('get取值');
                return val;
            },
            set:function(newVal){
                if(val === newVal){
                    return;
                }
                val = newVal;
                console.log('set设置值')
            }
        });
    }

    //测试：
    var obj = {a:111,b:222};
    objFun(obj);
    console.log(obj.a)//get取值 222
    obj.a = 333;//set设置值
    console.log(obj) 


### 4.Object.defineProperty实现数据和视图的联动：  

    html:
    
    <div>
        Object.defineProperty实现数据和视图的联动: <br>
        <span id="nickName"></span>
        <div id="introduce"></div>
    </div>

    js：（视图控制器）

    var userInfo = {};
    Object.defineProperty(userInfo,'nickName',{
        get:function(){
            return document.getElementById('nickName').innerHTML;
        },
        set:function(nick){
            document.getElementById('nickName').innerHTML = nick
        }
    });
    Object.defineProperty(userInfo,'introduce',{
        get:function(){
            return document.getElementById('introduce').innerHTML;
        },
        set:function(introduce){
            document.getElementById('introduce').innerHTML = introduce
        }
    });
    //console.log(userInfo)
    userInfo.nickName = '我是nickName';
    userInfo.introduce = '我是introduce'

    上面设置userInfo的nickName属性时会调用set方法，更新DOM节点的HTML



[ 博客详解 ](https://segmentfault.com/a/1190000013035407)<br />

