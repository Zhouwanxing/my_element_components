<template>
  <div ref="reference" :class="['el-cascader',realSize && `el-cascader--${realSize}`,{'is-disabled':isDisabled }]"
       v-clickoutside="() => toggleDropDownVisible(false)" @mouseenter="inputHover = true"
       @mouseleave="inputHover = false" @click="() => toggleDropDownVisible(readonly ? undefined : true)">
    <el-input ref="input" v-model="multiple ? presentText : inputValue" :size="realSize" :placeholder="placeholder"
              :readonly="readonly" :disabled="isDisabled" :validate-event="false"
              :class="{ 'is-focus': dropDownVisible }" @focus="handleFocus" @blur="handleBlur" @input="handleInput">
      <template slot="suffix">
        <i v-if="clearBtnVisible" key="clear" class="el-input__icon el-icon-circle-close" @click.stop="handleClear"></i>
        <i key="arrow-down" :class="['el-input__icon','el-icon-arrow-down',dropDownVisible && 'is-reverse']"
           @click.stop="toggleDropDownVisible()" v-else></i>
      </template>
    </el-input>
    <div v-if="multiple" class="el-cascader__tags">
      <el-tag v-for="tag in presentTags" :key="tag.key" type="info" :size="tagSize" :hit="tag.hitState"
              :closable="tag.closable" disable-transitions @close="deleteTag(tag)">
        <span>{{ tag.text }}</span>
      </el-tag>
      <input v-if="filterable && !isDisabled" v-model.trim="inputValue" type="text" class="el-cascader__search-input"
             :placeholder="presentTags.length ? '' : placeholder"
             @input="e => handleInput(inputValue, e)"
             @click.stop="toggleDropDownVisible(true)" @keydown.delete="handleDelete">
    </div>
    <transition name="el-zoom-in-top" @after-leave="handleDropdownLeave">
      <div v-show="dropDownVisible" ref="popper" :class="['el-popper', 'el-cascader__dropdown', popperClass]">
        <el-cascader-panel ref="panel" v-show="!filtering" v-model="checkedValue" :options="options" :props="config"
                           :border="false" :render-label="$scopedSlots.default" @expand-change="handleExpandChange"
                           @close="toggleDropDownVisible(false)"></el-cascader-panel>
        <div class="el-scrollbar el-cascader-menu" v-if="filterable" v-show="filtering"
             :style="'max-height: 280px;height:'+(suggestions.length ? suggestions.length * 34 + 12 : 50)+'px;'">
          <div class="el-cascader-menu__wrap el-scrollbar__wrap" style="margin-bottom: -17px; margin-right: -17px;">
            <ul tag="ul" role="menu" class="el-scrollbar__view el-cascader-menu__list" v-if="suggestions.length">
              <li v-for="(item, index) in suggestions" :key="item.uid"
                  :class="['el-cascader__suggestion-item',item.checked && 'is-checked']"
                  :tabindex="-1" @click="handleSuggestionClick(index)">
                <span>{{ item.text }}</span>
                <i v-if="item.checked" class="el-icon-check"></i>
              </li>
            </ul>
            <ul tag="ul" role="menu" class="el-scrollbar__view el-cascader-menu__list" v-else>
              <li class="el-cascader__empty-text text-c">无匹配数据</li>
            </ul>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
  import Popper from 'element-ui/src/utils/vue-popper';
  import Clickoutside from 'element-ui/src/utils/clickoutside';
  import Emitter from 'element-ui/src/mixins/emitter';
  import Locale from 'element-ui/src/mixins/locale';
  import Migrating from 'element-ui/src/mixins/migrating';
  import {isEqual, isEmpty, kebabCase} from 'element-ui/src/utils/util';
  import {isUndefined, isFunction} from 'element-ui/src/utils/types';
  import {isDef} from 'element-ui/src/utils/shared';
  import {addResizeListener, removeResizeListener} from 'element-ui/src/utils/resize-event';
  import debounce from 'throttle-debounce/debounce';
  import MyCascaderPanel from "./MyCascaderPanel.vue";

  const MigratingProps = {
    expandTrigger: {newProp: 'expandTrigger', type: String},
    changeOnSelect: {newProp: 'checkStrictly', type: Boolean},
    hoverThreshold: {newProp: 'hoverThreshold', type: Number}
  };

  const PopperMixin = {
    props: {
      placement: {
        type: String,
        default: 'bottom-start'
      },
      appendToBody: Popper.props.appendToBody,
      visibleArrow: {
        type: Boolean,
        default: true
      },
      arrowOffset: Popper.props.arrowOffset,
      offset: Popper.props.offset,
      boundariesPadding: Popper.props.boundariesPadding,
      popperOptions: Popper.props.popperOptions
    },
    methods: Popper.methods,
    data: Popper.data,
    beforeDestroy: Popper.beforeDestroy
  };
  const InputSizeMap = {medium: 36, small: 32, mini: 28};
  export default {
    name: 'ElCascader',
    directives: {Clickoutside},
    mixins: [PopperMixin, Emitter, Locale, Migrating],
    inject: {
      elForm: {default: ''},
      elFormItem: {default: ''}
    },
    components: {
      "el-cascader-panel": MyCascaderPanel
    },
    props: {
      value: {},
      options: Array,
      props: Object,
      size: String,
      placeholder: {
        type: String,
        default: '请选择'
      },
      disabled: Boolean,
      clearable: Boolean,
      filterable: Boolean,
      filterMethod: Function,
      separator: {
        type: String,
        default: ' / '
      },
      showAllLevels: {
        type: Boolean,
        default: true
      },
      collapseTags: Boolean,
      debounce: {
        type: Number,
        default: 300
      },
      beforeFilter: {
        type: Function,
        default: () => (() => {
        })
      },
      popperClass: String
    },
    data() {
      return {
        dropDownVisible: false,
        checkedValue: this.value,
        inputHover: false,
        inputValue: null,
        presentText: null,
        presentTags: [],
        checkedNodes: [],
        filtering: false,
        suggestions: [],
        inputInitialHeight: 0,
        pressDeleteCount: 0
      };
    },
    computed: {
      realSize() {
        const _elFormItemSize = (this.elFormItem || {}).elFormItemSize;
        return this.size || _elFormItemSize || (this.$ELEMENT || {}).size;
      },
      tagSize() {
        return ['small', 'mini'].indexOf(this.realSize) > -1 ? 'mini' : 'small';
      },
      isDisabled() {
        return this.disabled || (this.elForm || {}).disabled;
      },
      config() {
        const config = this.props || {}, {$attrs} = this;
        Object
          .keys(MigratingProps)
          .forEach(oldProp => {
            const {newProp, type} = MigratingProps[oldProp];
            let oldValue = $attrs[oldProp] || $attrs[kebabCase(oldProp)];
            if (isDef(oldProp) && !isDef(config[newProp])) {
              if (type === Boolean && oldValue === '') {
                oldValue = true;
              }
              config[newProp] = oldValue;
            }
          });
        return config;
      },
      multiple() {
        return this.config.multiple;
      },
      leafOnly() {
        return !this.config.checkStrictly;
      },
      readonly() {
        return !this.filterable || this.multiple;
      },
      clearBtnVisible() {
        if (!this.clearable || this.isDisabled || this.filtering || !this.inputHover) {
          return false;
        }
        return this.multiple
          ? !!this.checkedNodes.filter(node => !node.isDisabled).length
          : !!this.presentText;
      },
      panel() {
        return this.$refs.panel;
      }
    },
    watch: {
      disabled() {
        this.computePresentContent();
      },
      value(val) {
        if (!isEqual(val, this.checkedValue)) {
          this.checkedValue = val;
          this.computePresentContent();
        }
      },
      checkedValue(val) {
        const {value, dropDownVisible} = this;
        const {checkStrictly, multiple} = this.config;
        if (!isEqual(val, value) || isUndefined(value)) {
          this.computePresentContent();
          // hide dropdown when single mode
          if (!multiple && !checkStrictly && dropDownVisible) {
            this.toggleDropDownVisible(false);
          }
          this.$emit('input', val);
          this.$emit('change', val);
          this.dispatch('ElFormItem', 'el.form.change', [val]);
        }
      },
      options: {
        handler: function () {
          this.$nextTick(this.computePresentContent);
        },
        deep: true
      },
      presentText(val) {
        this.inputValue = val;
      },
      presentTags(val, oldVal) {
        if (this.multiple && (val.length || oldVal.length)) {
          this.$nextTick(this.updateStyle);
        }
      },
      filtering(val) {
        this.$nextTick(this.updatePopper);
      }
    },
    mounted() {
      const {input} = this.$refs;
      if (input && input.$el) {
        this.inputInitialHeight = input.$el.offsetHeight || InputSizeMap[this.realSize] || 40;
      }
      if (!this.isEmptyValue(this.value)) {
        this.computePresentContent();
      }
      this.filterHandler = debounce(this.debounce, () => {
        const {inputValue} = this;
        if (!inputValue) {
          this.filtering = false;
          return;
        }
        const before = this.beforeFilter(inputValue);
        if (before && before.then) {
          before.then(this.getSuggestions);
        } else if (before !== false) {
          this.getSuggestions();
        } else {
          this.filtering = false;
        }
      });
      addResizeListener(this.$el, this.updateStyle);
    },
    beforeDestroy() {
      removeResizeListener(this.$el, this.updateStyle);
    },
    methods: {
      toggleDropDownVisible(visible) {
        if (this.isDisabled) return;
        const {dropDownVisible} = this;
        const {input} = this.$refs;
        visible = isDef(visible) ? visible : !dropDownVisible;
        if (visible !== dropDownVisible) {
          this.dropDownVisible = visible;
          if (visible) {
            this.$nextTick(() => {
              this.updatePopper();
            });
          }
          input.$refs.input.setAttribute('aria-expanded', visible);
          this.$emit('visible-change', visible);
        }
      },
      handleDropdownLeave() {
        this.filtering = false;
        this.inputValue = this.presentText;
      },
      handleFocus(e) {
        this.$emit('focus', e);
      },
      handleBlur(e) {
        this.$emit('blur', e);
      },
      handleInput(val, event) {
        !this.dropDownVisible && this.toggleDropDownVisible(true);
        if (event && event.isComposing) return;
        if (val) {
          this.filterHandler();
        } else {
          this.filtering = false;
        }
      },
      handleClear() {
        this.presentText = '';
        this.panel.clearCheckedNodes();
      },
      handleExpandChange(value) {
        this.$nextTick(this.updatePopper.bind(this));
        this.$emit('expand-change', value);
        this.$emit('active-item-change', value); // Deprecated
      },
      computePresentContent() {
        // nextTick is required, because checked nodes may not change right now
        this.$nextTick(() => {
          if (this.config.multiple) {
            this.computePresentTags();
            this.presentText = this.presentTags.length ? ' ' : null;
          } else {
            this.computePresentText();
          }
        });
      },
      isEmptyValue(val) {
        const {multiple} = this;
        const {emitPath} = this.panel.config;
        if (multiple || emitPath) {
          return isEmpty(val);
        }
        return false;
      },
      computePresentText() {
        const {checkedValue, config} = this;
        if (!this.isEmptyValue(checkedValue)) {
          const node = this.panel.getNodeByValue(checkedValue);
          if (node && (config.checkStrictly || node.isLeaf)) {
            this.presentText = node.getText(this.showAllLevels, this.separator);
            return;
          }
        }
        this.presentText = null;
      },
      computePresentTags() {
        const {isDisabled, leafOnly, showAllLevels, separator, collapseTags} = this;
        const checkedNodes = this.getCheckedNodes(leafOnly);
        const tags = [];
        const genTag = node => ({
          node,
          key: node.uid,
          text: node.getText(showAllLevels, separator),
          hitState: false,
          closable: !isDisabled && !node.isDisabled
        });
        if (checkedNodes.length) {
          const [first, ...rest] = checkedNodes;
          const restCount = rest.length;
          tags.push(genTag(first));
          if (restCount) {
            if (collapseTags) {
              tags.push({
                key: -1,
                text: `+ ${restCount}`,
                closable: false
              });
            } else {
              rest.forEach(node => tags.push(genTag(node)));
            }
          }
        }
        this.checkedNodes = checkedNodes;
        this.presentTags = tags;
      },
      getSuggestions() {
        let {filterMethod} = this;
        if (!isFunction(filterMethod)) {
          filterMethod = (node, keyword) => node.text.includes(keyword);
        }
        const suggestions = this.panel.getFlattedNodes(this.leafOnly)
          .filter(node => {
            if (node.isDisabled) return false;
            node.text = node.getText(this.showAllLevels, this.separator) || '';
            return filterMethod(node, this.inputValue);
          });
        if (this.multiple) {
          this.presentTags.forEach(tag => {
            tag.hitState = false;
          });
        } else {
          suggestions.forEach(node => {
            node.checked = isEqual(this.checkedValue, node.getValueByOption());
          });
        }
        this.filtering = true;
        this.suggestions = suggestions;
        this.$nextTick(this.updatePopper);
      },
      handleDelete() {
        const {inputValue, pressDeleteCount, presentTags} = this;
        const lastIndex = presentTags.length - 1;
        const lastTag = presentTags[lastIndex];
        this.pressDeleteCount = inputValue ? 0 : pressDeleteCount + 1;
        if (!lastTag) return;
        if (this.pressDeleteCount) {
          if (lastTag.hitState) {
            this.deleteTag(lastTag);
          } else {
            lastTag.hitState = true;
          }
        }
      },
      handleSuggestionClick(index) {
        const {multiple} = this;
        const targetNode = this.suggestions[index];
        if (multiple) {
          const {checked} = targetNode;
          targetNode.doCheck(!checked);
          this.panel.calculateMultiCheckedValue();
        } else {
          this.checkedValue = targetNode.getValueByOption();
          this.toggleDropDownVisible(false);
        }
      },
      deleteTag(tag) {
        const {checkedValue} = this;
        const current = tag.node.getValueByOption();
        const val = checkedValue.find(n => isEqual(n, current));
        this.checkedValue = checkedValue.filter(n => !isEqual(n, current));
        this.$emit('remove-tag', val);
      },
      updateStyle() {
        const {$el, inputInitialHeight} = this;
        if (this.$isServer || !$el) return;
        const {suggestionPanel} = this.$refs;
        const inputInner = $el.querySelector('.el-input__inner');
        if (!inputInner) return;
        const tags = $el.querySelector('.el-cascader__tags');
        let suggestionPanelEl = null;
        if (suggestionPanel && (suggestionPanelEl = suggestionPanel.$el)) {
          const suggestionList = suggestionPanelEl.querySelector('.el-cascader__suggestion-list');
          suggestionList.style.minWidth = inputInner.offsetWidth + 'px';
        }
        if (tags) {
          inputInner.style.height = Math.max(tags.offsetHeight + 6, inputInitialHeight) + 'px';
          this.updatePopper();
        }
      },
      /**
       * public methods
       */
      getCheckedNodes(leafOnly) {
        return this.panel.getCheckedNodes(leafOnly);
      }
    }
  };
</script>
