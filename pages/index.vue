<template>
  <v-row justify="center" align="center">
    <v-col cols="12">
        <v-text-field
          v-model="query"
          :error-messages="error"
          autofocus
          clearable
          placeholder="Address | Txn hash"
        />
        <v-btn color="primary" @click="search">
          Search
        </v-btn>
      <div class="mb-10"></div>
      <v-skeleton-loader v-if="isLoading" type="table-cell" />
      <template v-else-if="hasBalances">
        <v-row dense>
          <v-col
            v-for="token in sortedBalances"
            :key="token.key + token.address"
            cols="6"
          >
            <v-card>
              <v-card-text class="d-flex align-center">
                <v-img
                  :src="token.logoURI || '/no-coin-image.png'"
                  :title="token.name"
                  class="flex-grow-0 mr-5"
                  width="40"
                  height="40"
                  contain
                />
                <div class="flex-grow-1">
                  <v-tooltip top open-delay="500">
                    <template #activator="{ on }">
                      <span style="cursor: alias" v-on="on">{{ formatBalance(token.balance) }}</span>
                    </template>
                    <span>{{ token.balance }}</span>
                  </v-tooltip>
                  <b>{{ token.symbol }}</b>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </template>
      <template v-else-if="hasTransactionDetails">
        <v-card>
          <v-card-text>
            <v-simple-table>
              <template #default>
                <tbody>
                  <tr v-for="row in transactionDetailsTable" :key="row.title">
                    <td>{{ row.title }}</td>
                    <td v-if="row.type === 'transfers'">
                      <div v-for="(t, idx) in row.content" :key="idx">
                        <b>From:</b> {{ t.from }}
                        <b>To:</b> {{ t.to }}
                        <b>For:</b> {{ `${formatBalance(t.amount)} ${t.token.symbol}` }}
                      </div>
                    </td>
                    <td v-else>{{ row.content }}</td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-card-text>
      </v-card>
      </template>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'IndexPage',
  data() {
    return {
      query: '',
      error: '',
      balances: [],
      transactionDetails: {},
      isLoading: false,
    }
  },
  computed: {
    hasBalances() { return Boolean(this.balances.length) },
    hasTransactionDetails() { return Boolean(this.transactionDetails.transactionHash) },
    sortedBalances() {
      return [...this.balances].sort((a, b) => {
        if (+a.balance > 0 && +b.balance === 0) {
          return -1
        } else if (+a.balance === 0 && +b.balance > 0) {
          return 1
        }
        return 0
      })
    },
    transactionDetailsTable() {
      const {
        transactionHash,
        status,
        blockNumber,
        confirmations,
        from,
        to,
        transfers,
        value,
      } = this.transactionDetails

      return [
        { title: 'Transaction Hash:', content: transactionHash },
        { title: 'Status:', content: status },
        { title: 'Block:', content: `${blockNumber}; confirmations: ${confirmations}` },
        { title: 'From:', content: from },
        { title: 'To:', content: to },
        { title: 'Transfers:', content: transfers, type: 'transfers' },
        { title: 'Value:', content: this.formatBalance(value) },
      ]
    }
  },
  methods: {
    cleanup() {
      this.error = ''
      this.balances = []
      this.transactionDetails = {}
    },
    async getBalance() {
      try {
        const { balances } = await this.$axios.$get(
          'api/v1/balance',
          { params: { address: this.query } },
        )

        this.balances = balances
      } catch (e) {
        this.error = e.response.data.reason
      }
    },
    async getTransactionDetails() {
      try {
        const { details } = await this.$axios.$get(
          'api/v1/txn-details',
          { params: { hash: this.query } },
        )

        this.transactionDetails = details
      } catch (e) {
        this.error = e.response.data.reason
      }
    },
    async search() {
      try {
        this.cleanup()
        this.isLoading = true

        const queryLen = this.query.length
        if (!queryLen) { this.error = 'required'; return }

        const fnByQueryLen = {
          42: this.getBalance,
          66: this.getTransactionDetails,
        }

        const fn = fnByQueryLen[queryLen]
        if (fn) {
          await fn()
        } else {
          this.error = 'invalid input'
        }
      } finally {
        this.isLoading = false
      }
    },
    formatBalance(balance) {
      return parseFloat(balance).toLocaleString({
        maximumFractionDigits: 4,
        roundingPriority: 'lessPrecision'
      })
    }
  }
}
</script>