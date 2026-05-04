<!--
  SalonSearch.vue - 全局搜索組件

  功能：
  1. 封裝搜索欄，支援關鍵字搜索、高級搜索
  2. 支援搜索按鈕、重置按鈕
  3. 根據設備類型自動適配

  技術棧：Vue 3 Composition API + Element Plus
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useDevice } from '@/composables/useDevice'

interface SearchField {
  /** 欄位鍵值 */
  key: string
  /** 欄位標籤 */
  label: string
  /** 佔位文字 */
  placeholder?: string
  /** 欄位類型：input（輸入框）| select（下拉選單）| date（日期）| date-range（日期範圍） */
  type?: 'input' | 'select' | 'date' | 'date-range'
  /** 下拉選項（type 為 select 時使用） */
  options?: { label: string; value: string | number }[]
}

const props = withDefaults(defineProps<{
  /** 搜索欄位配置 */
  fields?: SearchField[]
  /** 搜索關鍵字（簡易模式） */
  keyword?: string
  /** 搜索按鈕文字 */
  searchText?: string
  /** 重置按鈕文字 */
  resetText?: string
  /** 是否顯示高級搜索 */
  showAdvanced?: boolean
  /** 是否為載入狀態 */
  loading?: boolean
}>(), {
  fields: () => [],
  keyword: '',
  searchText: '搜尋',
  resetText: '重置',
  showAdvanced: false,
  loading: false,
})

const emit = defineEmits<{
  (e: 'search', params: Record<string, any>): void
  (e: 'reset'): void
  (e: 'update:keyword', value: string): void
}>()

const { isMobile } = useDevice()

/** 搜索表單數據 */
const searchForm = ref<Record<string, any>>({})

/** 關鍵字雙向綁定 */
const searchKeyword = ref(props.keyword)

function handleSearch(): void {
  const params: Record<string, any> = {}

  // 簡易模式：只傳關鍵字
  if (!props.showAdvanced) {
    params.keyword = searchKeyword.value
  } else {
    // 高級模式：傳所有欄位
    props.fields.forEach((field) => {
      if (searchForm.value[field.key] !== undefined && searchForm.value[field.key] !== '') {
        params[field.key] = searchForm.value[field.key]
      }
    })
  }

  emit('search', params)
}

function handleReset(): void {
  searchKeyword.value = ''
  searchForm.value = {}
  emit('reset')
}

function handleKeywordInput(value: string): void {
  emit('update:keyword', value)
}
</script>

<template>
  <div class="salon-search">
    <!-- 簡易搜索模式 -->
    <div v-if="!showAdvanced" class="salon-search__simple">
      <div class="salon-search__input-wrapper">
        <span class="salon-search__search-icon material-symbols-outlined">search</span>
        <input
          v-model="searchKeyword"
          type="text"
          class="salon-search__input"
          placeholder="搜尋..."
          @input="handleKeywordInput(searchKeyword)"
          @keyup.enter="handleSearch"
        />
      </div>
      <button
        class="salon-search__btn salon-search__btn--primary"
        :disabled="loading"
        @click="handleSearch"
      >
        {{ searchText }}
      </button>
      <button
        class="salon-search__btn salon-search__btn--reset"
        @click="handleReset"
      >
        {{ resetText }}
      </button>
    </div>

    <!-- 高級搜索模式 -->
    <div v-else class="salon-search__advanced">
      <el-form
        :model="searchForm"
        inline
        :label-width="isMobile ? '80px' : '100px'"
        size="default"
      >
        <el-form-item
          v-for="field in fields"
          :key="field.key"
          :label="field.label"
          :prop="field.key"
        >
          <!-- 輸入框 -->
          <el-input
            v-if="field.type === 'input' || !field.type"
            v-model="searchForm[field.key]"
            :placeholder="field.placeholder || `請輸入${field.label}`"
            clearable
          />

          <!-- 下拉選單 -->
          <el-select
            v-else-if="field.type === 'select'"
            v-model="searchForm[field.key]"
            :placeholder="field.placeholder || `請選擇${field.label}`"
            clearable
          >
            <el-option
              v-for="opt in field.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>

          <!-- 日期選擇 -->
          <el-date-picker
            v-else-if="field.type === 'date'"
            v-model="searchForm[field.key]"
            type="date"
            :placeholder="field.placeholder || '選擇日期'"
            value-format="YYYY-MM-DD"
          />

          <!-- 日期範圍 -->
          <el-date-picker
            v-else-if="field.type === 'date-range'"
            v-model="searchForm[field.key]"
            type="daterange"
            range-separator="至"
            start-placeholder="開始日期"
            end-placeholder="結束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleSearch"
          >
            {{ searchText }}
          </el-button>
          <el-button @click="handleReset">
            {{ resetText }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.salon-search {
  width: 100%;

  &__simple {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
  }

  &__search-icon {
    position: absolute;
    left: 14px;
    font-size: 20px;
    color: #8b7076;
    pointer-events: none;
  }

  &__input {
    width: 100%;
    height: 40px;
    padding: 0 16px 0 44px;
    border: 1.5px solid #debfc5;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    color: #1b1c1c;
    background: #ffffff;
    outline: none;
    transition: all 0.2s ease;

    &::placeholder {
      color: #8b7076;
    }

    &:focus {
      border-color: #ac235a;
      box-shadow: 0 0 0 3px rgba(172, 35, 90, 0.1);
    }
  }

  &__btn {
    height: 40px;
    padding: 0 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
    white-space: nowrap;

    &--primary {
      background: #ac235a;
      color: #ffffff;

      &:hover {
        background: #cc3e73;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    &--reset {
      background: #ffffff;
      color: #574146;
      border: 1.5px solid #debfc5;

      &:hover {
        border-color: #ac235a;
        color: #ac235a;
      }
    }
  }

  &__advanced {
    padding: 16px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }
}
</style>
