import { Pool } from 'pg'

let pool: Pool | undefined
let initialized: Promise<void> | undefined

export function getDatabase() {
  if (!pool) {
    const config = useRuntimeConfig()
    pool = new Pool({ connectionString: config.databaseUrl })
  }
  return pool
}

export async function ensureSchema() {
  if (!initialized) {
    initialized = getDatabase().query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(120) NOT NULL,
        description VARCHAR(500),
        event_date DATE NOT NULL,
        end_date DATE NOT NULL,
        start_time TIME,
        status VARCHAR(20) NOT NULL DEFAULT 'planned',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT valid_event_status CHECK (status IN ('planned', 'in_progress', 'completed', 'overdue', 'cancelled'))
      )
    `).then(async () => {
      await getDatabase().query('ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS end_date DATE')
      await getDatabase().query('UPDATE calendar_events SET end_date = event_date WHERE end_date IS NULL')
      await getDatabase().query('ALTER TABLE calendar_events ALTER COLUMN end_date SET NOT NULL')
    }).then(() => undefined)
  }
  await initialized
}