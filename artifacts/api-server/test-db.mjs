import pg from 'pg';

const connectionString = 'postgresql://neondb_owner:npg_KBStn9wYiP0q@ep-divine-mode-ax2j83qo-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new pg.Pool({ connectionString });

async function initDB() {
  try {
    console.log('Connecting to Neon PostgreSQL...');
    const res = await pool.query('SELECT NOW()');
    console.log('Neon DB Connected Successfully! Server time:', res.rows[0].now);

    // Create tables if not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(255) PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        conversation_id VARCHAR(255) REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Conversations & Messages tables initialized successfully in Neon DB!');
  } catch (err) {
    console.error('Database Error:', err);
  } finally {
    await pool.end();
  }
}

initDB();
