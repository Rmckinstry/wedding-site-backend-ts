import db from "../utils/db.js";
import { isNumber } from "../utils/utils.js";

const tableName = "guests";

// GET
export const getAllGuests = async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM ${tableName}`);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "There was an error while loading guests. Please try again later.", error: error.message });
    }
};

export const getGuestById = async (req, res) => {
    try {
        const { guestId } = req.params;

        if (!isNumber(guestId)) {
            return res.status(400).json({ status: 400, message: 'id needs to be a valid number.' })
        }
        const result = await db.query(`SELECT * FROM ${tableName} WHERE guest_id = $1`, [guestId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ status: 404, message: 'Guest not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Internal Server Error", error: error.message });
    }
};

export const getGuestsByGroup = async (req, res) => {
    try {
        const { groupId } = req.params;

        if (!isNumber(groupId)) {
            return res.status(400).json({ status: 400, message: 'id needs to be a valid number.' })
        }

        const query = `
            SELECT 
                g.*,
                gr.group_name
            FROM
                guests AS g
            JOIN
                groups AS gr
            ON 
                g.group_id = gr.id
            WHERE
                g.group_id = $1

        `
        const result = await db.query(query, [groupId]);

        const groupName = result.rows.length > 0 ? result.rows[0].group_name : null;

        if (groupName === null) {
            return res.status(404).json({ status: 404, message: 'Group not found' });
        }

        const guests = result.rows.map(({ group_name, ...guest }) => guest);

        res.json({ group_name: groupName, guests: guests });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "There was an error pulling up the group information. Please try again later.", error: error.message });
    }
};

// POST
export const createGuest = async (req, res) => {
    try {
        const { name, email, plusOneAllowed, hasDependents, groupId, songRequests } = req.body;

        if (!name || groupId === undefined || isNaN(groupId) || typeof plusOneAllowed !== 'boolean' || typeof hasDependents !== 'boolean' || isNaN(songRequests)) {
            return res.status(400).json({ status: 400, message: "Missing or invalid required guest fields (name, email, groupId, plusOneAllowed, hasDependents, songRequests)" });
        }

        const result = await db.query(
            `INSERT INTO ${tableName} (name, email, plus_one_allowed, has_dependents, group_id, song_requests) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *`,
            [name, email, plusOneAllowed, hasDependents, groupId, songRequests]
        );
        res.status(201).json({
            status: 201,
            message: "Guest created successfully",
            data: result.rows[0],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Internal Server Error", error: error.message });
    }
};

// PUT
export const editGuest = async (req, res) => {
    try {
        const { guestId } = req.params;

        if (!isNumber(guestId)) {
            return res.status(400).json({ status: 400, message: 'id needs to be a valid number.' })
        }

        const { name, email, plusOneAllowed, hasDependents, groupId, addedByGuestId, additionalGuestType, songRequests } = req.body;

        if (!name || groupId === undefined || isNaN(groupId) || typeof plusOneAllowed !== 'boolean' || typeof hasDependents !== 'boolean' || isNaN(songRequests)) {
            return res.status(400).json({ status: 400, message: "Missing or invalid required guest fields (name, email, groupId, plusOneAllowed, hasDependents, songRequests)" });
        }

        const result = await db.query(
            `UPDATE ${tableName} 
            SET name = $1, email = $2, plus_one_allowed = $3, has_dependents = $4, group_id = $5, added_by_guest_id = $6, additional_guest_type = $7, song_requests = $8 
            WHERE guest_id = $9
            RETURNING *`,
            [name, email, plusOneAllowed, hasDependents, groupId, addedByGuestId, additionalGuestType, songRequests, guestId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 404, message: 'Guest not found' });
        }

        res.status(200).json({
            status: 200,
            message: "Guest updated successfully",
            data: result.rows[0],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Internal Server Error", error: error.message });
    }
};

// PATCH
export const editHasDependent = async (req, res) => {
    try {
        const { guestId } = req.params;
        const { hasDependents } = req.body;

        if (!isNumber(guestId)) {
            return res.status(400).json({ status: 400, message: 'id needs to be a valid number.' })
        }

        if (typeof hasDependents !== 'boolean') {
            return res.status(400).json({ status: 400, message: 'hasDepedents flag is required and needs to be a boolean value.' })
        }

        const result = await db.query(
            `UPDATE ${tableName}
            SET has_dependents = $1
            WHERE guest_id = $2
            RETURNING *`,
            [hasDependents, guestId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 404, message: "Guest not found" });
        }

        res.status(200).json({
            status: 200,
            message: "Dependent Flag Updated",
            data: result.rows[0],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Internal Server Error", error: error.message });
    }
};

export const editPlusOneAllowed = async (req, res) => {
    try {
        const { guestId } = req.params;
        const { plusOneAllowed } = req.body;

        if (!isNumber(guestId)) {
            return res.status(400).json({ status: 400, message: 'id needs to be a valid number.' })
        }

        if (typeof plusOneAllowed !== 'boolean') {
            return res.status(400).json({ status: 400, message: 'plusOneAllowed flag is required and needs to be a boolean value.' })
        }

        const result = await db.query(
            `UPDATE ${tableName}
            SET plus_one_allowed = $1
            WHERE guest_id = $2
            RETURNING *`,
            [plusOneAllowed, guestId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 404, message: "Guest not found" });
        }

        res.status(200).json({
            status: 200,
            message: "Plus One Allowed Flag Updated",
            data: result.rows[0],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Internal Server Error", error: error.message });
    }
};

export const editEmail = async (req, res) => {
    try {
        const { guestId } = req.params;
        const { email } = req.body;

        if (!isNumber(guestId)) {
            return res.status(400).json({ status: 400, message: 'id needs to be a valid number.' })
        }

        if ((typeof email === 'string' && email !== "") && !email.includes('@')) {
            return res.status(400).json({ status: 400, message: "Invalid email provided" });
        }

        const result = await db.query(
            `UPDATE ${tableName}
            SET email = $1
            WHERE guest_id = $2
            RETURNING *`,
            [email, guestId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 404, message: "Guest not found" });
        }

        res.status(200).json({
            status: 200,
            message: "Email Updated",
            data: result.rows[0],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Internal Server Error", error: error.message });

    }
};


// DELETE
export const deleteGuest = async (req, res) => {
    try {
        const { guestId } = req.params;

        if (!isNumber(guestId)) {
            return res.status(400).json({ status: 400, message: 'id needs to be a valid number.' })
        }

        const result = await db.query(`DELETE FROM ${tableName} WHERE guest_id = $1`, [guestId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 404, message: 'Guest not found' });
        }

        res.status(200).json({ status: 200, message: `Guest ${guestId} deleted successfully` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Internal Server Error", error: error.message });

    }
}