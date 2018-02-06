/**Observer:一个数据监听器
 * **/
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
    this.target = null;
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
};


