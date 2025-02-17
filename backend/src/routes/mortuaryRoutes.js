import express from 'express';
import { createChamber, getAllChambers, getChamber, updateChamber, deleteChamber, assignUnit, releaseUnit } from '../controllers/chamberController.js';
import { createDeceasedRecord, getAllDeceasedRecords, getDeceasedRecord, updateDeceasedRecord, deleteDeceasedRecord } from '../controllers/deceasedController.js';
import { userAuth } from '../middleware/userAuth.js';

const router = express.Router();

router.post('/chambers', userAuth, createChamber);
router.get('/chambers', userAuth, getAllChambers);
router.get('/chambers', userAuth, getChamber);
router.put('/chambers', userAuth, updateChamber);
router.delete('/chambers', userAuth, deleteChamber);

router.post('/chambers/assign', userAuth, assignUnit);
router.post('/chambers/release', userAuth, releaseUnit);

router.post('/deceased', userAuth, createDeceasedRecord);
router.get('/deceased', userAuth, getAllDeceasedRecords);
router.get('/deceased/:id', userAuth, getDeceasedRecord);
router.put('/deceased/:id', userAuth, updateDeceasedRecord);
router.delete('/deceased/:id', userAuth, deleteDeceasedRecord);

export default router;
