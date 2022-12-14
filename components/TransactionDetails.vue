<template>
  <div class="px-4 py-3 flex flex-col gap-5 border border-gray-200 rounded-md shadow-sm text-sm">
    <div
      v-for="row in transactionDetailsTable"
      :key="row.title"
      class="flex flex-col lg:flex-row"
    >
      <template v-if="row.content && row.content.length">
        <span class="font-semibold lg:w-1/4 xl:w-1/5 2xl:w-1/6">
          {{ row.title }}
        </span>
        <div v-if="row.type === 'transfers'" class="flex flex-col gap-2">
          <div v-for="(transfer, idx) in row.content" :key="idx" class="flex flex-col xl:flex-row xl:gap-2">
            <div class="flex flex-col md:flex-row md:gap-1">
              <span class="font-medium">From:</span>
              <span class="truncate">{{ transfer.from }}</span>
            </div>
            <div class="flex flex-col md:flex-row md:gap-1">
              <span class="font-medium">To:</span>
              <span class="truncate">{{ transfer.to }}</span>
            </div>
            <div class="flex flex-col md:flex-row md:gap-1">
              <span class="font-medium">For:</span>
              {{ `${formatBalance(transfer.amount)} ${transfer.token.symbol}` }}
            </div>
          </div>
        </div>
        <div v-else-if="row.type === 'actions'" class="flex flex-col gap-2">
          <div v-for="(action, idx) in row.content" :key="idx" class="flex flex-col md:flex-row md:gap-2">
            <span class="font-medium">{{ action.name }}:</span>
            <div class="flex items-center gap-1">
              <span v-if="action.underlyingAsset.amount">{{ formatBalance(action.underlyingAsset.amount) }}</span>
              <img
                :src="action.underlyingAsset.logoURI || '/unknown-token.png'"
                alt=""
                class="w-3 h-3"
              >
              <span>{{ action.underlyingAsset.symbol }}</span>
            </div>
            <span>({{ action.protocolName }})</span>
          </div>
        </div>
        <span v-else class="truncate">{{ row.content }}</span>
      </template>
    </div>
  </div>
</template>

<script setup>
import { formatBalance } from '@/utils/format'

const props = defineProps({
  transaction: Object
})

const transactionDetailsTable = computed(() => {
  const {
    transactionHash,
    status,
    blockNumber,
    confirmations,
    from,
    to,
    transfers,
    value,
    aavev2Events
  } = props.transaction

  return [
    { title: 'Transaction Hash:', content: transactionHash },
    { title: 'Status:', content: status },
    { title: 'Block:', content: `${blockNumber}; confirmations: ${confirmations}` },
    { title: 'Transaction Action:', content: aavev2Events, type: 'actions' },
    { title: 'From:', content: from },
    { title: 'To:', content: to },
    { title: 'Transfers:', content: transfers, type: 'transfers' },
    { title: 'Value:', content: `${formatBalance(value)} Ether` },
  ]
})
</script>