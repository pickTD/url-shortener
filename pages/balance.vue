<template>
  <v-row justify="center" align="center">
    <v-col cols="12" sm="8" md="6">
        <v-text-field
          v-model="address"
          :error-messages="error"
          autofocus
          clearable
          placeholder="Enter address here"
        />
        <v-btn color="primary" @click="getBalance">
          Check balance
        </v-btn>
      <div class="mb-10"></div>
      <v-skeleton-loader v-if="isLoading" type="table-cell" />
      <template v-else-if="balances.length">
        <v-row dense>
          <v-col
            v-for="token in sortedBalances"
            :key="token.key + token.address"
            cols="6"
          >
            <v-card>
              <v-card-text class="d-flex align-center">
                <v-img
                  :src="token.logoURI"
                  :title="token.name"
                  class="flex-grow-0 mr-5"
                  width="40"
                  height="40"
                  contain
                />
                <div class="flex-grow-1">
                  <v-tooltip top>
                    <template #activator="{ on }">
                      <span v-on="on">{{ formatBalance(token.balance) }}</span>
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
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'BalancePage',
  data() {
    return {
      address: '',
      error: '',
      balances: [],
      isLoading: false,
    }
  },
  computed: {
    sortedBalances() {
      return [...this.balances].sort((a, b) => {
        if (+a.balance > 0 && +b.balance === 0) {
          return -1
        } else if (+a.balance === 0 && +b.balance > 0) {
          return 1
        }
        return 0
      })
    }
  },
  methods: {
    cleanup() {
      this.error = ''
      this.balances = []
    },
    async getBalance() {
      try {
        this.cleanup()

        if (!this.address) {
          this.error = 'address required'
          return
        }

        this.isLoading = true
        
        const { balances } = await this.$axios.$get(
          'api/erc20/v1/balance',
          { params: { address: this.address } },
        )

        this.balances = balances
      } catch (e) {
        this.error = e.response.data.reason
      } finally {
        this.isLoading = false
      }
    },
    formatBalance(balance) {
      return (+balance).toFixed(2)
    }
  }
}
</script>