import { requireUser } from '../../utils/auth'

export default defineEventHandler(event => requireUser(event))