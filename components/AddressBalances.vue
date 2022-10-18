<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
    <div
      v-for="token in sortedBalances"
      :key="token.key"
      class="px-4 py-3 flex items-center border border-gray-200 rounded-md shadow-sm"
    >
      <img
        :src="token.logoURI || '/unknown-token.png'"
        :title="token.name"
        :alt="token.symbol"
        class="w-10 h-10 mr-5"
      >
      <div class="flex flex-col text-gray-700">
        <span :title="token.balance" class="font-medium">{{ formatBalance(token.balance) }}</span>
        <span :title="token.name">{{ token.symbol }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatBalance } from '@/utils/format'

const props = defineProps({
  balances: Array
})

const sortedBalances = computed(() => [...props.balances].sort((a, b) => {
  if (+a.balance > 0 && +b.balance === 0) {
    return -1
  } else if (+a.balance === 0 && +b.balance > 0) {
    return 1
  }
  return 0
}))
</script>