// vue插件引入
import Vue from 'vue'
// element-ui插件引入
import ElementUI from 'element-ui'
// element-ui的css文件引入
import 'element-ui/lib/theme-chalk/index.css'
import AppFresh from './components/App.vue'


Vue.use(ElementUI);

// 设置在启动时生成生产提示
Vue.config.performance = true;
Vue.config.productionTip = false;
new Vue({
    el: '#app',
    template: '<AppFresh/>',
    components: {AppFresh}
});
