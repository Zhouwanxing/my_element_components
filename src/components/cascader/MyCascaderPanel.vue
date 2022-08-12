<template>
  <div :class="['el-cascader-panel',border && 'is-bordered']">
    <cascader-menu ref="menu" v-for="(menu, index) in menus" :index="index" :key="index" :nodes="menu"></cascader-menu>
  </div>
</template>

<script>
  import CascaderMenu from './cascader-menu';
  import Store from 'element-ui/packages/cascader-panel/src/store';
  import merge from 'element-ui/src/utils/merge';
  import {coerceTruthyValueToArray, isEqual, isEmpty, valueEquals} from 'element-ui/src/utils/util';

  const DefaultProps = {
    expandTrigger: 'click', // or hover
    multiple: false,
    checkStrictly: false, // whether all nodes can be selected
    emitPath: true, // wether to emit an array of all levels value in which node is located
    lazy: false,
    value: 'value',
    label: 'label',
    children: 'children',
    leaf: 'leaf',
    disabled: 'disabled',
    hoverThreshold: 500
  };

  export default {
    name: 'ElCascaderPanel',
    components: {CascaderMenu},
    props: {
      value: {},
      options: Array,
      props: Object,
      border: {
        type: Boolean,
        default: true
      },
      renderLabel: Function
    },
    provide() {
      return {
        panel: this
      };
    },
    data() {
      return {
        checkedValue: null,
        checkedNodePaths: [],
        store: [],
        menus: [],
        activePath: [],
        loadCount: 0
      };
    },
    computed: {
      config() {
        return merge({...DefaultProps}, this.props || {});
      },
      multiple() {
        return this.config.multiple;
      },
      checkStrictly() {
        return this.config.checkStrictly;
      },
      leafOnly() {
        return !this.checkStrictly;
      },
    },
    watch: {
      options: {
        handler: function () {
          this.initStore();
        },
        immediate: true,
        deep: true
      },
      value() {
        this.syncCheckedValue();
        this.checkStrictly && this.calculateCheckedNodePaths();
      },
      checkedValue(val) {
        if (!isEqual(val, this.value)) {
          this.checkStrictly && this.calculateCheckedNodePaths();
          this.$emit('input', val);
          this.$emit('change', val);
        }
      }
    },
    mounted() {
      if (!this.isEmptyValue(this.value)) {
        this.syncCheckedValue();
      }
    },
    methods: {
      initStore() {
        const {config, options} = this;
        this.store = new Store(options, config);
        this.menus = [this.store.getNodes()];
        this.syncMenuState();
      },
      syncCheckedValue() {
        const {value, checkedValue} = this;
        if (!isEqual(value, checkedValue)) {
          this.activePath = [];
          this.checkedValue = value;
          this.syncMenuState();
        }
      },
      syncMenuState() {
        const {multiple, checkStrictly} = this;
        this.syncActivePath();
        multiple && this.syncMultiCheckState();
        checkStrictly && this.calculateCheckedNodePaths();
      },
      syncMultiCheckState() {
        const nodes = this.getFlattedNodes(this.leafOnly);

        nodes.forEach(node => {
          node.syncCheckState(this.checkedValue);
        });
      },
      isEmptyValue(val) {
        const {multiple, config} = this;
        const {emitPath} = config;
        if (multiple || emitPath) {
          return isEmpty(val);
        }
        return false;
      },
      syncActivePath() {
        const {store, multiple, activePath, checkedValue} = this;
        if (!isEmpty(activePath)) {
          const nodes = activePath.map(node => this.getNodeByValue(node.getValue()));
          this.expandNodes(nodes);
        } else if (!this.isEmptyValue(checkedValue)) {
          const value = multiple ? checkedValue[0] : checkedValue;
          const checkedNode = this.getNodeByValue(value) || {};
          const nodes = (checkedNode.pathNodes || []).slice(0, -1);
          this.expandNodes(nodes);
        } else {
          this.activePath = [];
          this.menus = [store.getNodes()];
        }
      },
      expandNodes(nodes) {
        nodes.forEach(node => this.handleExpand(node, true /* silent */));
      },
      calculateCheckedNodePaths() {
        const {checkedValue, multiple} = this;
        const checkedValues = multiple
          ? coerceTruthyValueToArray(checkedValue)
          : [checkedValue];
        this.checkedNodePaths = checkedValues.map(v => {
          const checkedNode = this.getNodeByValue(v);
          return checkedNode ? checkedNode.pathNodes : [];
        });
      },
      handleExpand(node, silent) {
        const {activePath} = this;
        const {level} = node;
        const path = activePath.slice(0, level - 1);
        const menus = this.menus.slice(0, level);
        if (!node.isLeaf) {
          path.push(node);
          menus.push(node.children);
        }
        this.activePath = path;
        this.menus = menus;
        if (!silent) {
          const pathValues = path.map(node => node.getValue());
          const activePathValues = activePath.map(node => node.getValue());
          if (!valueEquals(pathValues, activePathValues)) {
            this.$emit('active-item-change', pathValues); // Deprecated
            this.$emit('expand-change', pathValues);
          }
        }
      },
      handleCheckChange(value) {
        this.checkedValue = value;
      },
      /**
       * public methods
       */
      calculateMultiCheckedValue() {
        this.checkedValue = this.getCheckedNodes(this.leafOnly)
          .map(node => node.getValueByOption());
      },
      getNodeByValue(val) {
        return this.store.getNodeByValue(val);
      },
      getFlattedNodes(leafOnly) {
        const cached = !this.config.lazy;
        return this.store.getFlattedNodes(leafOnly, cached);
      },
      getCheckedNodes(leafOnly) {
        const {checkedValue, multiple} = this;
        if (multiple) {
          const nodes = this.getFlattedNodes(leafOnly);
          return nodes.filter(node => node.checked);
        } else {
          return this.isEmptyValue(checkedValue)
            ? []
            : [this.getNodeByValue(checkedValue)];
        }
      },
      clearCheckedNodes() {
        const {config, leafOnly} = this;
        const {multiple, emitPath} = config;
        if (multiple) {
          this.getCheckedNodes(leafOnly)
            .filter(node => !node.isDisabled)
            .forEach(node => node.doCheck(false));
          this.calculateMultiCheckedValue();
        } else {
          this.checkedValue = emitPath ? [] : null;
        }
      }
    }
  };
</script>
