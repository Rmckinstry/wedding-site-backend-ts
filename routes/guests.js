import express from "express";
import {
    getAllGuests,
    getGuestById,
    getGuestsByGroup,
    createGuest,
    editGuest,
    editHasDependent,
    editPlusOneAllowed,
    deleteGuest,
    editEmail,
} from "../controllers/guestController.js";

const router = express.Router();

// GET
router.get("/", getAllGuests);
router.get("/:guestId", getGuestById);
router.get("/group/:groupId", getGuestsByGroup);

// POST
router.post("", createGuest);

// PUT
router.put("/:guestId", editGuest);

// PATCH
router.patch("/dependent/:guestId", editHasDependent);
router.patch("/plus-one/:guestId", editPlusOneAllowed);
router.patch("/email/:guestId", editEmail);

// DELETE
router.delete("/:guestId", deleteGuest);

export default router;
