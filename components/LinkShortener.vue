<template>
  <v-row justify="center" align="center">
    <v-col cols="12" sm="8" md="6">
      <v-skeleton-loader v-if="isLoading" type="article, actions" max-width />
      <v-card v-else>
        <v-card-title class="headline">
          Link
        </v-card-title>
        <v-card-text>
          <v-text-field
          v-model="link"
          :error-messages="error"
          autofocus
          clearable
          placeholder="Enter URL here"
          @keyup.enter="shorten"
          @keyup.esc="clearInput"
        />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="shorten"> Shorten </v-btn>
          <v-btn color="secondary" @click="copy"> Copy </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: "LinkShortener",
  props: {
    isLoading: { type: Boolean, default: false },
    originalUrl: { type: String, default: '' }
  },
  data() {
    return {
      link: '',
      error: '',
    }
  },
  watch: {
    link() {
      this.clearError()
    }
  },
  mounted() {
    if (this.originalUrl) {
      this.link = this.originalUrl
    }
  },
  methods: {
    async shorten() {
      try {
        const { shortURL } = await this.$axios.$post('api/v1/shorten', { url: this.link })
        this.link = shortURL
      } catch (e) {
        if (e?.response?.status === 422) {
          this.error = e.response.data.error
        }
      }
    },
    copy() {
      navigator.clipboard.writeText(this.link)
    },
    clearError() {
      this.error = ''
    },
    clearInput() {
      this.clearError()
      this.link = ''
    }
  }
}
</script>
