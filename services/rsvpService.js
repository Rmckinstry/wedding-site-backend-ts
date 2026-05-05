import db from "../utils/db.js";

const tableName = "rsvps";

export const getAllRSVPs = async () => {
    try {
        const result = await db.query(`SELECT * FROM ${tableName}`);
        return result.rows
    } catch (error) {
        console.error("Error at getAllRSVPs", error);
        throw new Error(`Failed to fetch RSVPs: ${error.message}`)
    }
}

export const getRSVP = async (rsvpId) => {
    try {
        const result = await db.query(`SELECT * FROM ${tableName} WHERE rsvp_id = $1`, [rsvpId]);
        return result.rows[0];

    } catch (error) {
        console.error("Error at getRSVP", error);
        throw new Error(`Failed to fetch RSVP: ${error.message}`)
    }
}

export const getGuestRSVP = async (guestId) => {
    try {
        const result = await db.query(`SELECT * FROM ${tableName} WHERE guest_id = $1`, [guestId]);
        return result.rows[0];

    } catch (error) {
        console.error("Error at getGuestRSVP", error);
        throw new Error(`Failed to fetch guest RSVP: ${error.message}`)
    }
}

export const getGroupRSVPs = async (groupId) => {
    try {
        const result = await db.query(
            `SELECT g.guest_id, r.rsvp_id, r.attendance, r.spotify, r.created_at, r.updated_at
            FROM guests AS g
            JOIN groups AS gp ON g.group_id = gp.id
            JOIN rsvps AS r ON g.guest_id = r.guest_id
            WHERE gp.id = $1`
            , [groupId])
        return result.rows
    } catch (error) {
        console.error("Error at getGroupRSVPs", error);
        throw new Error(`Failed to fetch group RSVPs: ${error.message}`)
    }
}

export const createRSVPs = async (rsvpList) => {
    const client = await db.getClient();
    const { groupId, rsvps, additional } = rsvpList;

    try {
        await client.query('BEGIN');

        // Checking if any guest has an rsvp
        const guestIds = rsvps.map(rsvp => rsvp.guestId);
        const groupCheck = await client.query(
            `SELECT DISTINCT g.group_id
                 FROM guests g
                 JOIN rsvps r ON g.guest_id = r.guest_id
                 WHERE g.guest_id = ANY($1)`,
            [guestIds]
        );

        if (groupCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            throw new Error('Cannot create RSVPs: Group already has existing RSVPs');
        }

        //creating main rsvps
        const createdRSVPs = [];
        for (const rsvp of rsvps) {
            const { guestId, attendance, spotify } = rsvp;
            const timestamp = new Date().toISOString();

            const result = await client.query(
                `INSERT INTO ${tableName} (guest_id, attendance, spotify, created_at)
                    VALUES ($1, $2, $3, $4)
                    RETURNING *`,
                [guestId, attendance, spotify, timestamp]
            );
            createdRSVPs.push(result.rows[0]);
        }

        let additionalGuests = [];
        if (additional && additional.length > 0) {
            additionalGuests = await createRSVPAdditonal(additional, groupId, client);
        }

        await client.query('COMMIT');
        return { createdRSVPs, additionalGuests };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Failed to create RSVPs - rolling back transaction:", error);
        throw error;
    } finally {
        client.release();
    }
}

export const createRSVPAdditonal = async (additional, groupId, providedClient = null) => {
    /*
        additional : {
            name : string,
            type : 'plus_one' | 'dependent',
            guestId : number
        }
    */

    //can handle other methods calling it or it can be treated as a standalone transaction
    const client = providedClient || await db.getClient();
    const isOwnClient = !providedClient;

    try {
        if (isOwnClient) await client.query("BEGIN");

        const createdGuests = [];

        for (const guest of additional) {

            //check if primary guest flags
            const primaryGuestFlags = await client.query(
                `SELECT plus_one_allowed, has_dependents FROM guests WHERE guest_id = $1`,
                [guest.guestId]
            )

            const plusOneAllowed = primaryGuestFlags.rows[0]["plus_one_allowed"];
            const dependentsAllowed = primaryGuestFlags.rows[0]["has_dependents"];

            // Cancel transaction if flag for matching additionalType is false
            if (guest.type === "plus_one" && !plusOneAllowed) {
                if (isOwnClient) await client.query('ROLLBACK');
                throw new Error("Plus one not allowed for this guest");
            }
            if (guest.type === "dependent" && !dependentsAllowed) {
                if (isOwnClient) await client.query('ROLLBACK');
                throw new Error("Dependents not allowed for this guest");
            }

            const timestamp = new Date().toISOString();

            // create Guest record for additional guest
            const newGuest = await db.query(
                `INSERT INTO guests (name, email, plus_one_allowed, has_dependents, group_id, added_by_guest_id, additional_guest_type, song_requests) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                RETURNING *`,
                [guest.name, null, false, false, groupId, guest.guestId, guest.type, 1]
            );
            const newGuestId = newGuest.rows[0].guest_id;

            //create rsvp with new guest id
            const newAdditonalRSVP = await client.query(
                `INSERT INTO ${tableName} (guest_id, attendance, spotify, created_at)
                VALUES ($1, $2, $3, $4)
                RETURNING *`,
                [newGuestId, true, "", timestamp]
            );

            //use primary guest id and switch plus one to false if applicable
            if (guest.type === "plus_one" && plusOneAllowed) {
                const result = await db.query(
                    `UPDATE guests
                    SET plus_one_allowed = $1
                    WHERE guest_id = $2
                    RETURNING *`,
                    [false, guest.guestId]
                );
            }

            createdGuests.push({ guestInfo: newGuest.rows[0], rsvpInfo: newAdditonalRSVP.rows[0] })

        }

        if (isOwnClient) await client.query('COMMIT');

        return createdGuests
    } catch (error) {
        if (isOwnClient && client) await client.query('ROLLBACK');
        console.error("Error creating additional guest & RSVPs:", error);
        throw error;
    } finally {
        if (isOwnClient && client) client.release;
    }
}

export const deleteRSVP = async (rsvpId) => {
    try {
        const result = await db.query(`DELETE FROM ${tableName} WHERE rsvp_id = $1`, [rsvpId]);
        return result;

    } catch (error) {
        console.error("Error at deleteRSVP", error);
        throw new Error(`Failed to delete RSVP: ${error.message}`)
    }
}

export const editAttendance = async (rsvpId, attendance) => {
    try {
        let updateTime = new Date().toISOString();
        const result = await db.query(
            `UPDATE ${tableName}
            SET attendance = $1, updated_at = $2
            WHERE rsvp_id = $3
            RETURNING *`,
            [attendance, updateTime, rsvpId]
        )

        return result.rows
    } catch (error) {
        console.error("Error at deleteRSVP", error);
        throw new Error(`Failed to edit RSVP attendance: ${error.message}`)
    }
}

export const editSongs = async (rsvpId, songs) => {
    try {
        let updateTime = new Date().toISOString();
        const result = await db.query(
            `UPDATE ${tableName}
            SET spotify = $1, updated_at = $2
            WHERE rsvp_id = $3
            RETURNING *`,
            [songs, updateTime, rsvpId]
        )

        return result.rows
    } catch (error) {
        console.error("Error at deleteRSVP", error);
        throw new Error(`Failed to edit RSVP songs: ${error.message}`)
    }
}