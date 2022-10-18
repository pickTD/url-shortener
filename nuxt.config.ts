// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  app: {
    head: {
      charset: 'utf-16',
      viewport: 'width=device-width, initial-scale=1', 
      title: 'Insta blockchain explorer',
      meta: [
        { name: 'description', content: '' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/icon_64x64.png' }
      ],
    }
  },
  modules: ['@nuxtjs/tailwindcss']
})
