// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'postgresql://calendar:calendar@localhost:5432/boring_days',
    authSecret: process.env.NUXT_AUTH_SECRET || 'development-only-change-this-secret',
    userPassword: process.env.NUXT_USER_PASSWORD || ''
  }
})
