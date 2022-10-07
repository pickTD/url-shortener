<template>
  <link-shortener :is-loading="isLoading" :original-url="originalUrl" />
</template>

<script>
import LinkShortener from '~/components/LinkShortener.vue'
export default {
  name: 'ShortURLPage',
  components: { LinkShortener },
  data() {
    return {
      isLoading: true,
      originalUrl: '',
    }
  },
  async fetch() {
    try {
      const { originalUrl } = await this.$axios.$get(`api/v1/${this.$route.params.id}`)
      this.originalUrl = originalUrl
    } catch (e) {
      if (e?.response?.status === 404) {
        this.$nuxt.error({ statusCode: 404 })
      }
    } finally {
      this.isLoading = false
    }
  }
}
</script>
