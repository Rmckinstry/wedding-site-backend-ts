import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    ssl: process.env.ENV_TAG === 'local' ? true : false
})

export default {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect()
};