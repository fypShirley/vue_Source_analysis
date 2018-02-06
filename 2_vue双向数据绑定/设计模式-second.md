##### 加上指令解析器compile

```
补充下HTML节点类型的知识：
    元素节点            　　Node.ELEMENT_NODE(1)
    属性节点            　　Node.ATTRIBUTE_NODE(2)
    文本节点            　　Node.TEXT_NODE(3)
    CDATA节点             Node.CDATA_SECTION_NODE(4)
    实体引用名称节点    　　 Node.ENTRY_REFERENCE_NODE(5)
    实体名称节点        　　Node.ENTITY_NODE(6)
    处理指令节点        　　Node.PROCESSING_INSTRUCTION_NODE(7)
    注释节点            　 Node.COMMENT_NODE(8)
    文档节点            　 Node.DOCUMENT_NODE(9)
    文档类型节点        　　Node.DOCUMENT_TYPE_NODE(10)
    文档片段节点        　　Node.DOCUMENT_FRAGMENT_NODE(11)
    DTD声明节点            Node.NOTATION_NODE(12)
```
   
>Compile指令解析器,解析DOM节点，直接固定某个节点进行替换数据的

>>解析模板指令，替换模板数据,初始化试图

>>将模板指令对应的节点绑定对应的更新函数，初始化对应的订阅器

首先需要获取到DOM元素，然后对含有DOM元素上含有指令的节点进行处理，
因此这个环节需要对DOM操作比较频繁，所有可以先建一个fragment片段，
将需要解析的DOM节点存入fragment片段里再进行处理：

```bash
//直接上代码：（先判断"{{}}"）
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
    
                if(self.isTextNode(node) && reg.test(text)) {//判断" {{}} "
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
        isTextNode:function(node){
            return node.nodeType == 3;//文本节点
        }
    };

```

为了将解析器Compile与监听器Observer和订阅者Watcher关联起来，我们需要再修改一下类SelfVue函数：
```bash
 // function SelfVue(data,el,exp){  //first
    function SelfVue(options){
        var self = this;
    
        // this.data = data;  //first
        this.data = options.data;
        this.el = options.el;
    
        this.vm = this; //second
        console.log(this)
    
        Object.keys(this.data).forEach(function (key) {
            self.proxyKeys(key);//绑定代理属性
        });
    
        //监听数据：
        observers(this.data);
    
        //first：
        /*el.innerHTML = this.data[exp];//初始化模板数据的值
        new Watcher(this,exp,function(value){//绑定订阅器
            el.innerHTML = value;
        });*/
    
        //初始化视图updateText和生成订阅器
        new Compile(this);
    
        return this;
    }
```
到这里，大括号"{{}}"类型的双向数据绑定完成；
### 补充上v-model和事件指令：

>在compileElement函数加上对其他指令节点进行判断，然后遍历其所有属性

>>添加事件指令

>>添加一个v-model指令

```
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
/*      补充判断：     */
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
  

```
再改造下类SelfVue，使它更像Vue的用法：
```bash
    function SelfVue(options){
        var self = this;
        this.data = options.data;
        this.el = options.el;
        this.methods = options.methods;
    
        this.vm = this; //second
    
        Object.keys(this.data).forEach(function (key) {
            self.proxyKeys(key);//绑定代理属性
        });
    
        //监听数据：
        observers(this.data);
     
        //初始化视图updateText和生成订阅器
        new Compile(this);
        options.mounted.call(this);
    
        return this;
    }
```

测试:
```
<body>
<div id="app">
    <h2>{{name1}}</h2>
    <h2>{{name2}}</h2>


    <input type="text" v-model="title">
    <h3>{{title}}</h3>


    <button v-on:click="clickMe">v-on事件</button>
    <h3>{{event}}</h3>
</div>

    <script src="js-second/observer.js"></script>
    <script src="js-second/watcher.js"></script>
    <script src="js-second/compile.js"></script>
    <script src="js-second/selfVue.js"></script>
<script>

    var self_vue = new SelfVue({
        el:"#app",
        data:{
            name1:'我是name1',
            name2:'我是name2',
            event:'event',
            title:'title初始值'
        },
        methods:{
            clickMe:function(){
                this.event = '事件重新赋值'
            }
        },
        mounted:function(){
            console.log('mounted')
        }
    });

   /* window.setTimeout(function(){
        self_vue.name1 = 'name1再次赋值'
    },2000);
    window.setTimeout(function(){
        self_vue.name2 = 'name2再次赋值'
    },3000)*/
</script>
</body>
```
[ 博客详解 ](https://segmentfault.com/a/1190000013169852)<br />




