## 设计模式
### 1、装饰者模式

在不改变对象自身的基础上，在程序运行期间给对象动态的添加职责

    //看一个简单的例子：
    Function.prototype.fn = function(fn){
        var self = this;
        return function(){
            self.apply(this,arguments);
            fn.apply(this,arguments);
        }
    }

    function a(){
        console.log('我是函数a');
    }

    var copyA = a.fn(function(){
        console.log('我是a函数额外的功能');
    })

    copyA();  
    // 我是函数a
    // 我是a函数额外的功能

    //监听数组的变化
      var methods=['push','pop','shift','unshift','splice','slice','sort','reverse'];
        var Method = {};
        for(var i=0;i<methods.length;i++){
            var method = methods[i];
            (function(method){
                var original = Array.prototype[method];
                Method[method] = function(){
                    console.log('监听数组的变化或者操作函数等');
                    return original.apply(this,arguments);
                }
            })(method)
        }
        var list = ['a','b','c'];
        list.__proto__ = Method;
        list.push('d');//打印：监听数组的变化或者操作函数等

> 看一个段来自javascript面向对象编程指南（第二版）中关于装饰器模式的解释及其代码：

```bash
    装饰器模式是一种结构型模式，它与对象的创建无关，主要考虑的是如何拓展对象的功能。也就是说，除了使用线性式（父－子－孙）继承方式之外，我们也可以为一个基础对象创建若干个装饰对象以拓展其功能。然后，由我们的程序自行选择不同的装饰器，并按不同的顺序使用它们。在不同的程序中我们可能会面临不同的需求，并从同样的装饰器集合中选择不同的子集。
```
```bash
//装饰一颗圣诞树
    var tree = {};
    tree.decorate = function(){
        console.log('tree');
    }

    /*接着，再定义 getDecorator()方法，该方法用于添加额外的装饰器。装饰器被实现为构造器函数，都继承自 tree 对象。*/

    tree.getDecorator = function(deco){
        tree[deco].prototype = this;
        return new tree[deco];
    };
   
    /*下面来创建3个装饰器，我们将它设为 tree 的一个属性（以保持全局命名空间的纯净）。 以下对象也提供了 decorate()方法，注意它先调用了父类的decorate()方法。*/

    tree.Red = function(){
        this.decorate = function(){
            this.Red.prototype.decorate();
            // console.log(this.Red.prototype);
            // console.log(this.Red.prototype.decorate);
            console.log('red');
        };
        this.name = 'red';
    }
    tree.Blue = function(){
        this.decorate = function(){
            this.Blue.prototype.decorate();
            // console.log(this.Blue.prototype.decorate);
            //tree['Blue']的原型是tree，所以打印出"tree"
            console.log('blue');
        }
        this.name = 'blue';
    }
    tree.Angel = function(){
        this.decorate = function(){
            this.Angel.prototype.decorate();
            // console.log(this.Angel.prototype.decorate);
            console.log('angle');
        }
        this.name = 'angel';
    }

    /*把所有的装饰器都添加到基础对象中：*/

    tree = tree.getDecorator('Blue'); 
    tree = tree.getDecorator('Angel');
    tree = tree.getDecorator('Red');

    /*运行：*/
    tree.decorate();
    //tree
    //blue
    //angle
    //red

     /*解析：
        1、执行tree = tree.getDecorator('Blue')：
            tree['Blue'].prototype = tree;
            tree = {decorate: ƒ, name: "blue"}
            即tree['Blue']赋值给tree，tree['Blue']的原型指向tree
        输出:
        "tree"
        "blue"

        2、执行tree = tree.getDecorator('Angel')：
            tree['Angel'].prototype = tree['Blue'],(这时候tree已经赋值为tree['Blue'])
            tree = {decorate: ƒ, name: "Angle"}
            即tree['Angel']赋值给tree，tree['Angel']的原型指向tree['Blue']
        输出：
        "angel"

        3、执行tree = tree.getDecorator('Red')：
            tree['Red'].prototype = tree['Angel'],(这时候tree已经赋值为tree['Angel'])
            tree = {decorate: ƒ, name: "Red"}
            即tree['Red']赋值给tree，tree['Red']的原型指向tree['Angel']
        输出：
        "red"
    */

/*
图解：从下往上依次继承
  tree = {decorate:fn,getDecorator:fn}
                    |
     tree['Blue'].prototype//tree={decorate: ƒ, name: "blue"}
                                    |
                        tree['Angel'].prototype//tree={decorate: ƒ, name: "Angle"} 
                                                        |
                                                 tree['Red'].prototype//tree={decorate: ƒ, name: "Red"}     
*/                                                                                                  
```
### 2、观察者模式（有时也称为发布-订阅模式）
```bash
看一个段来自javascript面向对象编程指南（第二版）中关于装饰器模式的解释及其代码：
```

> 观察者模式是一种行为型模式，主要用于处理不同对象
之间的交互通信问题。观察者模式中通常会包含两类对象。
>> 一个或多个发布者对象：当有重要的事情发生时，会通知订阅者。

>> 一个或多个订阅者对象：它们追随一个或多个发布者，监听它们的通知，并作出
相应的反应

```bash
var observer = {
        addSubscriber:function (callback){//添加订阅者
            if(typeof callback === "function"){
                this.subscribers[this.subscribers.length] = callback;
            }
        },
        removeSubscriber:function (callback){//删除订阅者
            for(var i=0;i<this.subscribers.length;i++){
                if(this.subscribers[i] === callback){
                    delete this.subscribers[i];
                }
            }
        },
        publish:function (what) {//授受并传递数据给订阅者
            for(var i=0;i<this.subscribers.length;i++){
                if(typeof this.subscribers[i] === "function"){
                    this.subscribers[i](what);
                }
            }
        },
        make:function(o){//将任意对象转变为一个发布者并为其添加上述方法。
            for(var i in this){//this->observer{addSubscriber: ƒ, removeSubscriber: ƒ, publish: ƒ, make:f}
                if(this.hasOwnProperty(i)){//observer.hasOwnProperty('addSubscriber') -> true
                    o[i] = this[i];
                    o.subscribers = [];
                }
            }//o-> {addSubscriber: ƒ, removeSubscriber: ƒ, publish: ƒ, make:f,subscribers:[],o.XX}
        }
    };

    //有个函数blogger和任意一个函数jack
    var blogger = {
        writeBlogPost : function(){
            var content = 'blogger';
            this.publish(content);
        }
    };
    var jack = {
        read:function (what){
            console.log('jack订阅: '+what);
        }
    };

    //blogger变为发布者
    observer.make(blogger);

    //jack订阅blogger
    blogger.addSubscriber(jack.read);

    //blogger发布信息
    blogger.writeBlogPost();

    //输出：jack订阅: blogger

    最后： 别的函数也可以成为发布者，
           blogger也可以添加任意的函数为订阅者
           jack也可以订阅别的发布者          
```
```bash
    以上总结为：
        1.指定一个发布者
        2.给发布者添加缓存列表，存放回调函数，通知订阅者
        3.发布信息时，发布者遍历缓存表，触发存放的回调函数
    下面看个简单的例子：

```
```bash
  var Event = function(){
        this.subs = {};
    }

    //添加收听者：
    Event.prototype.addSubscriber=function(k,callback){
        if(!this.subs[k]){
            this.subs[k]=[];
        }
        this.subs[k].push(callback);
    };
    //发布事件：
    Event.prototype.publish=function(k,item){
        var fns=this.subs[k];

        if(fns){//防止发布给不存在的对象
            for(var i=0;i<fns.length;i++){
                fns[i](item)
            }
        }

    }

    function reader(item){
        console.log(item);
        console.log('我是收听的');
        //console.log(arguments)
    }

    var event = new Event();
    event.addSubscriber('a',reader)
    event.addSubscriber('b',reader)
    event.publish('a','publish发布信息');
    event.publish('b','publish发布信息');//不存在的订阅事件b
```

[ 博客详解 ](https://segmentfault.com/a/1190000013051584)<br />