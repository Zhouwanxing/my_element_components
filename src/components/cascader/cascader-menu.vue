<template>
  <div class="el-scrollbar el-cascader-menu">
    <div class="el-cascader-menu__wrap el-scrollbar__wrap" style="margin-bottom: -17px; margin-right: -17px;">
      <ul tag="ul" role="menu" :id="menuId" class="el-scrollbar__view el-cascader-menu__list" wrap-class="el-cascader-menu__wrap"
          @mouseleave="clearHoverZone" :view-class="['el-cascader-menu__list',{'is-empty': isEmpty}]">
        <div class="el-cascader-menu__empty-text" v-if="isEmpty">暂无数据</div>
        <cascader-node v-for="node in nodes" :key="node.uid" :node="node" :node-id="`${menuId}-${index}`"
                       :aria-haspopup="node.hasChildren" :aria-owns="node.hasChildren ? menuId : null"
                       @expand="handleExpand" v-else></cascader-node>
      </ul>
    </div>
  </div>
</template>
<script>
  import CascaderNode from './cascader-node.vue';

  export default {
    name: 'ElCascaderMenu',
    inject: ['panel'],
    components: {CascaderNode},
    props: {
      nodes: {type: Array, required: true},
      index: Number
    },
    data() {
      return {
        activeNode: null,
        hoverTimer: null,
        id: Math.floor(Math.random() * 10000)
      };
    },
    computed: {
      isEmpty() {
        return !this.nodes.length;
      },
      menuId() {
        return `cascader-menu-${this.id}-${this.index}`;
      },
    },
    methods: {
      handleExpand(e) {
        this.activeNode = e.target;
      },
      clearHoverZone() {
        const {hoverZone} = this.$refs;
        if (!hoverZone) return;
        hoverZone.innerHTML = '';
      },
    },
  };
</script>
