function Compile(elm){// el->"#name" ，vm->{el:;data:;}
    this.vm = elm;
    this.el = document.querySelector(elm.el);
    this.fragment = null;
    this.init();
}
Compile.prototype = {
    init:function(){
        if(this.el) {
            //将需要解析的DOM节点存入fragment片段里再进行处理
            this.fragment = this.nodeToFragment(this.el);

            //接下来遍历各个节点，对含有指定的节点特殊处理，先处理指令“{{}}”:
            this.compileElement(this.fragment);

            //绑定到el上
            this.el.appendChild(this.fragment);
        }else{
            console.log('DOM元素不存在');
        }
    },
    //创建代码片段
    nodeToFragment:function(el){
        var fragment = document.createDocumentFragment();
        var child = el.firstChild;
        while(child){//将DOM元素移入fragment
            fragment.appendChild(child);
            child = el.firstChild;
        }
        return fragment;
    },
    //对所有子节点进行判断，1.初始化视图数据,2.绑定更新函数的订阅器
    compileElement:function(el){
        var childNodes = el.childNodes;
        var self = this;
        [].slice.call(childNodes).forEach(function(node){
            var reg = /\{\{(.*)\}\}/;//匹配" {{}} "
            var text = node.textContent;

            if(self.isElementNode(node)){//元素节点判断
                self.compile(node);
            }else if(self.isTextNode(node) && reg.test(text)) {//文本节点判断 ，判断" {{}} "
                self.compileText(node,reg.exec(text)[1]);
            }

            if(node.childNodes && node.childNodes.length){
                self.compileElement(node);//// 继续递归遍历子节点
            }
        });
    },
    //初始化视图updateText和生成订阅器:
    compileText:function(node,exp){
        var self = this;
        var initText = this.vm[exp];   //代理访问self_vue.data.name1 -> self_vue.name1
        this.updateText(node,initText);//将初始化的数据初始化到视图中
        new Watcher(this.vm,exp,function(value){//{}，name, // 生成订阅器并绑定更新函数
            self.updateText(node,value);
        })
    },
    updateText: function (node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },
    compile:function(node){
        var nodeAttrs = node.attributes;
        var self = this;
        Array.prototype.forEach.call(nodeAttrs,function(attr){
            var attrName = attr.name;
            if(self.isDirective(attrName)){//查到" v- "
                var exp = attr.value;
                var dir = attrName.substring(2);//" v-on/v-model "

                if(self.isEventDirective(dir)){ // 事件指令
                    self.compileEvent(node,self.vm,exp,dir);
                }else{
                    self.compileModel(node,self.vm,exp,dir);
                }
                node.removeAttribute(attrName);
            }
        })
    },
    compileEvent:function(node,vm,exp,dir) {//代码片段<><>，{data:;vm:;el:;},v-on="add",on:
        var eventType = dir.split(':')[1];//on
        var cb = vm.methods && vm.methods[exp];

        if(eventType && cb){
            node.addEventListener(eventType,cb.bind(vm),false);
        }
    },
    compileModel:function(node,vm,exp,dir){//代码片段<><>，{data:;vm:;el:;},v-on="addCounts",model:
        var self = this;
        var val = this.vm[exp];
        this.modelUpdater(node,val);
        new Watcher(this.vm,exp,function(value){
            self.modelUpdater(node,value);
        });

        node.addEventListener('input',function(e){
            var newValue = e.target.value;
            if(val === newValue){
                return;
            }
            self.vm[exp] = newValue;
            val = newValue;
        })
    },
    modelUpdater:function(node,value){
        node.value = typeof value == 'undefined' ? '' : value;
    },
    isTextNode:function(node){
        return node.nodeType == 3;//文本节点
    },
    isElementNode:function(node){
        return node.nodeType == 1;//元素节点<p></p>
    },
    isDirective:function(attr){//查找自定义属性为：v- 的属性
        return attr.indexOf('v-') == 0;
    },
    isEventDirective:function(dir){ // 事件指令
        return dir.indexOf('on:') === 0
    }
};

