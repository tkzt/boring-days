import { ensureSchema } from '../utils/database'

export default defineNitroPlugin(async () => {
  await ensureSchema()
})