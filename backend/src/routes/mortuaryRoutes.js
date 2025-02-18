import express from 'express';
import { createChamber, getAllChambers, getChamber, updateChamber, deleteChamber } from '../controllers/chamberController.js';
import { createDeceasedRecord, getAllDeceasedRecords, getDeceasedRecord, updateDeceasedRecord, deleteDeceasedRecord } from '../controllers/deceasedController.js';
import { createNextOfKin, getNextOfKinByDeceasedId, updateNextOfKin, deleteNextOfKin } from '../controllers/nextOfKinController.js';
import { userAuth } from '../middleware/userAuth.js';

const router = express.Router();

router.post('/chambers', userAuth, createChamber);
router.get('/chambers', userAuth, getChamber);
router.get('/chambers/all', userAuth, getAllChambers);
router.put('/chambers', userAuth, updateChamber);
router.delete('/chambers', userAuth, deleteChamber);

router.post('/deceased', userAuth, createDeceasedRecord);
router.get('/deceased/all', userAuth, getAllDeceasedRecords);
router.get('/deceased', userAuth, getDeceasedRecord);
router.put('/deceased', userAuth, updateDeceasedRecord);
router.delete('/deceased', userAuth, deleteDeceasedRecord);

router.post('/next-of-kin', userAuth, createNextOfKin);
router.get('/next-of-kin', userAuth, getNextOfKinByDeceasedId);
router.put('/next-of-kin', userAuth, updateNextOfKin);
router.delete('/next-of-kin', userAuth, deleteNextOfKin);

export default router;
