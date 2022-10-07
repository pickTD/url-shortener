export default {
  head: {
    titleTemplate: '%s - url-shortener',
    title: 'url-shortener',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },

  server: {
    port: 3000,
    host: '0.0.0.0',
  },

  css: [],

  plugins: [],

  components: true,

  buildModules: [
    '@nuxtjs/eslint-module',
    '@nuxtjs/vuetify',
  ],

  modules: [
    '@nuxtjs/axios',
  ],

  axios: {
    baseURL: 'http://localhost:3000/',
  },

  vuetify: {
    customVariables: ['~/assets/variables.scss'],
  },

  build: {},

  serverMiddleware: [
    { path: '/api/v1', handler: '~/serverMiddleware/apiServer.js' }
  ],
}
