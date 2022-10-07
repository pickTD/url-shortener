<template>
  <v-row justify="center" align="center">
    <v-col cols="12" sm="8" md="6">
      <v-simple-table>
        <template #default>
          <thead>
            <tr>
              <th class="text-left">
                ID
              </th>
              <th class="text-left">
                Original URL
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in list"
              :key="item.id"
            >
              <td>{{ item.id }}</td>
              <td>
                <a :href="item.url" target="_blank"> {{ item.url }} </a>
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </v-col>
  </v-row>
  
</template>

<script>
export default {
  name: 'URLsList',
  data() {
    return {
      list: []
    }
  },
  async fetch() {
    const { list } = await this.$axios.$get('api/v1/list')
    this.list = list
  }
}
</script>