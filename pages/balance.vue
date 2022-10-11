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
          <v-spacer />
          <v-btn color="primary" @click="getBalance">
            Check balance
          </v-btn>
        </v-card-actions>
      </v-card>
      <div class="mb-10"></div>
      <v-card>
        <!-- <v-card-title>
          Balance
        </v-card-title> -->
        <v-card-text>
          <v-simple-table>
            <template #default>
              <thead>
                <tr>
                  <th class="text-left">
                    Token
                  </th>
                  <th class="text-left">
                    Balance
                  </th>
                </tr>
              </thead>
              <v-skeleton-loader v-if="isLoading" type="table-cell@4" />
              <tbody v-else>
                <tr v-for="balance, token in balances" :key="token">
                  <td>{{ token }}</td>
                  <td>{{ balance }}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
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
      address: '',
      error: '',
      balances: {},
      isLoading: false,
    }
  },
  methods: {
    cleanup() {
      this.error = ''
      this.balances = {}
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
    }
  }
}
</script>