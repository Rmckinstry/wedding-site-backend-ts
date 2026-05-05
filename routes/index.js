import express from 'express';
import db from '../utils/db.js';
import groupsRoute from './groups.js';
import guestsRoute from './guests.js';
import rsvpsRoute from './rsvps.js';

const router = express.Router();

router.use('/groups', groupsRoute);
router.use('/guests', guestsRoute);
router.use('/rsvps', rsvpsRoute);

router.get('/health', async (req, res) => {
    try {
        const client = await db.getClient();
        const result = await client.query('SELECT NOW()');
        client.release();

        res.status(200).json({
            status: 'healthy',
            timestamp: result.rows[0].now,
            message: 'Server and database are operational',
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            message: 'Database connection failed',
            error: error.message,
        });
    }
})

// admin login
// TODO: in the future admin needs to be more fleshed out
// logging in should generate a token if good creds
// certain admin routes should require tokens
router.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;

    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
        console.error('Admin login failed: Wrong username or password');
        res.status(500).json({
            status: 401,
            message: 'Wrong Username or Password',
            error: 'Wrong Username or Password',
        });
    } else {
        res.status(200).json({
            status: 200,
        });
    }
})

// catch-all route for undefined routes if needed
router.use((req, res, next) => {
    res.status(404).send("Sorry, we couldn't find what you're looking for!");
});

export default router;