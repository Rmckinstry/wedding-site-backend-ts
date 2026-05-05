import {
    createRSVPs,
    getAllRSVPs,
    getRSVP,
    deleteRSVP,
    getGuestRSVP,
    getGroupRSVPs,
    editAttendance,
    createRSVPAdditonal,
    editSongs
} from '../services/rsvpService.js';
import { isNumber } from '../utils/utils.js'

export const getAllRSVPHandler = async (req, res) => {
    try {
        const result = await getAllRSVPs()
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
    }
}

export const getRSVPHandler = async (req, res) => {
    try {
        const { rsvpId } = req.params;

        if (!rsvpId || !isNumber(rsvpId)) {
            return res.status(400).json({ status: 400, message: "rsvpId must be a valid integer" });
        }

        const result = await getRSVP(rsvpId);
        if (!result) {
            return res.status(404).json({ status: 400, message: 'RSVP not found' });
        }

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
    }
}

export const getGuestRSVPHandler = async (req, res) => {
    try {
        const { guestId } = req.params;

        if (!guestId || !isNumber(guestId)) {
            return res.status(400).json({ status: 400, message: "guestId must be a valid integer" })
        }
        const result = await getGuestRSVP(guestId);

        if (!result) {
            return res.status(404).json({ json: 404, message: `RSVP for guestid ${guestId} not found` });
        }

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
    }
}

export const getGroupRSVPHandler = async (req, res) => {
    try {
        const { groupId } = req.params;
        if (!groupId || !isNumber(groupId)) {
            return res.status(400).json({ status: 400, message: "groupId must be a valid integer" })
        }

        const result = await getGroupRSVPs(groupId);

        // current version doesn't work because UI depends on the empty array. Maybe change this to see if the group exists?
        // if (result.length === 0) {
        //     return res.status(404).json({ status: 404, message: `No RSVPs for group ${groupId} found.` });
        // }

        res.json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: 'There was an error pulling up your groups RSVP information. Please try again later.', error: error.message });
    }
}

export const createRSVPHandler = async (req, res) => {
    try {
        const { rsvpList } = req.body;

        // validating input
        if (!rsvpList.groupId || typeof rsvpList.groupId !== 'number') {
            return res.status(400).json({ status: 400, message: "groupId must be a valid integer" });
        }

        if (!Array.isArray(rsvpList.rsvps) || rsvpList.rsvps.length === 0) {
            return res.status(400).json({ status: 400, message: "rsvps must be a non empty array of rsvp objects" });
        }

        for (const rsvp of rsvpList.rsvps) {
            if (!rsvp.guestId || typeof rsvp.attendance !== 'boolean' || typeof rsvp.spotify !== 'string') {
                return res.status(400).json({
                    status: 400, error: "Each RSVP must have a valid guestId (int), attendance (boolean), and spotify (string)",
                });
            }
        }

        const rsvps = await createRSVPs(rsvpList);

        res.status(201).json({
            status: 201,
            message: "RSVP(s) created successfully.",
            data: rsvps,
        });
    } catch (error) {
        console.error("Error in createRSVPHandler:", error.message);

        if (error.message.includes("Group already has existing RSVPs")) {
            return res.status(409).json({
                status: 409,
                message: "Group has already RSVP'd.",
                error: error.message,
            });
        }

        return res.status(500).json({
            status: 500,
            message: "There was an error while creating the RSVPs for the group. Please try again.",
            error: error.message,
        });
    }
}

export const createAdditonalHandler = async (req, res) => {
    try {
        const { additional, groupId } = req.body["postData"];

        //validating input
        if (!Array.isArray(additional) || additional.length === 0) {
            return res.status(400).json({ status: 400, message: "additional must be an array of valid guest objects" });
        }

        if (!groupId || typeof groupId !== "number") {
            return res.status(400).json({ status: 400, message: "groupId must be a valid integer" })
        }

        for (const ag of additional) {
            if (typeof ag.guestId !== 'number' || (ag.type !== 'plus_one' && ag.type !== 'dependent') || typeof ag.name !== 'string') {
                return res.status(400).json({
                    status: 400, error: "Each additional guest must have a valid guestId (int), name (string), and type (string)",
                });
            }
        }

        const additionalGuest = await createRSVPAdditonal(additional, groupId);

        res.status(201).json({
            status: 201,
            message: "Additonal Guest created successfully & RSVP submitted",
            data: additionalGuest,
        });
    } catch (error) {
        console.error('Error in createAdditonalHandler -', error)
        if (error.message === "Plus one not allowed for this guest" ||
            error.message === "Dependents not allowed for this guest") {
            return res.status(403).json({
                status: 403,
                message: error.message,
                error: error.message //is this the best way we can do this? does error arg need to be changed
            });
        }
        return res.status(500).json({
            status: 500,
            message: 'There was an error while trying to add your additional guests.',
            error: "Internal Server Error",
        });
    }
}

export const deleteRSVPHandler = async (req, res) => {
    try {
        const { rsvpId } = req.params;

        if (!rsvpId || !isNumber(rsvpId)) {
            return res.status(400).json({ status: 400, message: "rsvpId must be a valid integer" })
        }

        const result = await deleteRSVP(rsvpId);

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 404, message: 'RSVP not found' });
        }

        res.status(200).json({ status: 200, message: `RSVP ${rsvpId} deleted successfully` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: 'There was an error while atttempting to delete the RSVP', error: error.message });
    }
}

export const editAttendanceHandler = async (req, res) => {
    try {
        const { rsvpId } = req.params;
        const { attendance } = req.body;

        if (!rsvpId || !isNumber(rsvpId)) {
            return res.status(400).json({ status: 400, message: "rsvpId must be a valid integer" })
        }

        if (typeof attendance !== "boolean") {
            return res.status(400).json({ json: 400, message: "attendance must be type boolean" })
        }

        const result = await editAttendance(rsvpId, attendance);

        if (result.length === 0) {
            return res.status(404).json({ status: 404, message: 'RSVP not found' });
        }

        res.status(200).json({
            status: 200,
            message: "Attendance Updated",
            data: result,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
    }
}

export const editSongsHandler = async (req, res) => {
    try {
        const { rsvpId } = req.params;
        const { songs } = req.body;

        if (!rsvpId || !isNumber(rsvpId)) {
            return res.status(400).json({ status: 400, message: "rsvpId must be a valid integer" });
        }

        if (typeof songs !== "string") {
            return res.status(400).json({ status: 400, message: "songs must be type string" });
        }
        const result = await editSongs(rsvpId, songs);

        if (result.length === 0) {
            return res.status(404).json({ status: 404, message: 'RSVP not found' });
        }

        res.status(200).json({
            status: 200,
            message: `Songs Updated for RSVP ${rsvpId}`,
            data: result,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: `Internal Server Error - Error when updating songs.`, error: error.message });
    }
}