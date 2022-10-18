<template>
  <div class="h-screen container mx-auto px-8 py-8">
    <div class="flex flex-col sm:flex-row">
      <UIInput v-model="query" @keyup.enter="search" />
      <UIButton @click="search"> Search </UIButton>
    </div>
    <div v-if="errorMsg" class="mt-2 pl-3 text-sm text-red-400">{{ errorMsg }}</div>
    <div class="mt-10">
      <div v-if="isLoading" class="animate-pulse">
        <div class="bg-gray-200 h-8 rounded-md"></div>
        <div class="bg-gray-200 h-8 mt-2 rounded-md"></div>
      </div>
      <AddressBalances v-else-if="hasBalances" :balances="balances" />
      <TransactionDetails v-else-if="hasTransactionDetails" :transaction="transactionDetails" />
    </div>
  </div>
</template>

<script setup>
const router = useRouter()
const route = useRoute()

const query = ref('')
const errorMsg = ref('')
const balances = ref([])
const transactionDetails = ref({})
const isLoading = ref(false)

const hasBalances = computed(() => Boolean(balances.value.length))
const hasTransactionDetails = computed(() => Boolean(transactionDetails.value.transactionHash)) 

const cleanup = () => {
  errorMsg.value = ''
  balances.value = []
  transactionDetails.value = {}
}

const getBalance = async () => {
  if (!(query.value === route.query.address)) {
    router.push({ query: { address: query.value } })
  }

  const { data, error } = await useFetch('api/balance', {
    params: { address: query.value },
    initialCache: false
  })

  if (error.value) {
    errorMsg.value = error.value.data.statusMessage
  } else if (data.value) {
    balances.value = data.value.balances
  }
}

const getTransactionDetails = async () => {
  if (!(query.value === route.query.tx)) {
    router.push({ query: { tx: query.value } })
  }

  const { data, error } = await useFetch('api/tx', {
    params: { hash: query.value },
    initialCache: false
  })

  if (error.value) {
    errorMsg.value = error.value.data.statusMessage
  } else if (data.value) {
    transactionDetails.value = data.value.details
  }
}

const search = async () => {
  try {
    cleanup()
    isLoading.value = true

    const queryLen = query.value.length
    if (!queryLen) { errorMsg.value = 'required'; return }

    const fnByQueryLen = {
      42: getBalance,
      66: getTransactionDetails,
    }

    const fn = fnByQueryLen[queryLen]
    if (fn) {
      await fn()
    } else {
      errorMsg.value = 'invalid input'
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  const { address, tx } = route.query
  const q = address || tx

  if (q) {
    query.value = q
    await nextTick(async () => {
      await search()
    })
  }
})
</script>