<template>
  <v-row justify="center" align="center">
    <v-col cols="12" sm="8" md="6">
      <v-card>
        <v-card-title class="headline">
          Address
        </v-card-title>
        <v-card-text>
          <v-text-field
          v-model="address"
          :error-messages="error"
          autofocus
          clearable
          placeholder="Enter  here"
        />
        </v-card-text>
        <v-card-actions>
          Check balance:
          <v-spacer />
          <v-btn
            v-for="token in tokens"
            :key="token"
            color="primary"
            @click="getBalance(token)"
          >
            {{ token }}
          </v-btn>
        </v-card-actions>
      </v-card>
      <div class="mb-10"></div>
      <v-card>
        <v-card-title>
          Balance
        </v-card-title>
        <v-card-text>
          <v-skeleton-loader v-if="isLoading" type="text" />
          <strong v-else>{{ balance.value }} {{ balance.token }}</strong>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'BalancePage',
  data() {
    return {
      tokens: ['ETH', 'USDC', 'DAI', 'USDT'],
      address: '',
      error: '',
      balance: {
        value: '',
        token: '',
      },
      isLoading: false,
    }
  },
  methods: {
    cleanup() {
      this.error = ''
      this.balance = {
        value: '',
        token: '',
      }
    },
    async getBalance(token) {
      try {
        this.cleanup()

        if (!this.address) {
          this.error = 'address required'
          return
        }

        this.isLoading = true
        
        const { value } = await this.$axios.$get(
          'api/erc20/v1/balance',
          { params: { token, address: this.address } },
        )

        this.balance.value = value
        this.balance.token = token
      } catch (e) {
        this.error = e.response.data.reason
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>