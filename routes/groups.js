import express from 'express';
import {getAllGroups, getGroup, addGroup, editGroupName, deleteGroup} from '../controllers/groupController.js'

const router = express.Router();

// GET
router.get('/', getAllGroups);
router.get('/:id', getGroup);
// POST
router.post('/', addGroup);
// PUT
router.put('/:id', editGroupName);
// DELETE
router.delete('/:id', deleteGroup);

export default router;