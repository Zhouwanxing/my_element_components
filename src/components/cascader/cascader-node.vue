<template>
  <li role="menuitem" :id="nodeId" :aria-expanded="inActivePath" :tabindex="disabled ? null : -1"
      class="el-cascader-node"
      :class="[{'is-selectable': checkStrictly,'in-active-path': inActivePath,'in-checked-path': inCheckedPath,'is-active': isChecked,'is-disabled': disabled}]"
      @click="config.expandTrigger === 'click' ? handleExpand() : ''"
      @mouseenter="config.expandTrigger !== 'click' ? mouseEnterOrFocus($event) : ''"
      @focus="config.expandTrigger !== 'click' ? mouseEnterOrFocus($event) : ''">
    <el-checkbox :value="node.checked" :indeterminate="node.indeterminate" :disabled="isDisabled"
                 @change="handleMultiCheckChange" v-if="multiple"></el-checkbox>
    <el-radio :value="checkedValue" :label="value" :disabled="isDisabled" @onChange="handleCheckChange"
              @nativeOnClick="stopPropagation" v-else-if="checkStrictly"></el-radio>
    <i class="el-icon-check el-cascader-node__prefix" v-else-if="isLeaf && isChecked"></i>
    <span class="el-cascader-node__label"> {{node.label}}</span>
    <i class="el-icon-loading el-cascader-node__postfix" v-if="node.loading"></i>
    <i class="el-icon-arrow-right el-cascader-node__postfix" v-else-if="!isLeaf"></i>
  </li>
</template>
<script>
  const stopPropagation = e => e.stopPropagation();
  export default {
    inject: ['panel'],
    props: {
      node: {
        required: true
      },
      nodeId: String
    },
    computed: {
      config() {
        return this.panel.config;
      },
      isLeaf() {
        return this.node.isLeaf;
      },
      isDisabled() {
        return this.node.isDisabled;
      },
      checkedValue() {
        return this.panel.checkedValue;
      },
      isChecked() {
        return this.node.isSameNode(this.checkedValue);
      },
      inActivePath() {
        return this.isInPath(this.panel.activePath);
      },
      inCheckedPath() {
        if (!this.checkStrictly) return false;
        return this.panel.checkedNodePaths.some(checkedPath => this.isInPath(checkedPath));
      },
      value() {
        return this.node.getValueByOption();
      },
      checkStrictly() {
        return this.config.checkStrictly;
      },
      disabled() {
        return !this.checkStrictly && this.isDisabled;
      },
      multiple() {
        return this.config.multiple;
      }
    },
    methods: {
      mouseEnterOrFocus: function (e) {
        if (this.config.expandTrigger === "click") {
          return;
        }
        this.handleExpand();
        this.$emit('expand', e);
      },
      handleExpand() {
        const {panel, node, isDisabled, config, checkStrictly, isLeaf} = this, {expandTrigger} = config;
        if (isLeaf && !isDisabled && !checkStrictly && !this.multiple) {
          this.handleCheckChange();
          return;
        }
        if (!checkStrictly && isDisabled || node.loading || expandTrigger !== "click") return;
        panel.handleExpand(node);
      },
      handleCheckChange() {
        const {panel, value, node} = this;
        panel.handleCheckChange(value);
        panel.handleExpand(node);
      },
      handleMultiCheckChange(checked) {
        this.node.doCheck(checked);
        this.panel.calculateMultiCheckedValue();
      },
      isInPath(pathNodes) {
        const {node} = this;
        return (pathNodes[node.level - 1] || {}).uid === node.uid;
      },
    },
  };
</script>
