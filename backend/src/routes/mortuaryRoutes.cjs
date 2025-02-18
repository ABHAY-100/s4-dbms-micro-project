const express = require('express');
const userAuth = require('../middleware/userAuth.cjs');

const {
  createChamber,
  getAllChambers,
  getChamber,
  updateChamber,
  deleteChamber
} = require('../controllers/chamberController.cjs');

const {
  createDeceasedRecord,
  getAllDeceasedRecords,
  getDeceasedRecord,
  updateDeceasedRecord,
  deleteDeceasedRecord
} = require('../controllers/deceasedController.cjs');

const {
  createNextOfKin,
  getNextOfKinByDeceasedId,
  updateNextOfKin,
  deleteNextOfKin
} = require('../controllers/nextOfKinController.cjs');

const {
  createService,
  getServicesByDeceasedId,
  updateService,
  deleteService,
  getServiceStats
} = require('../controllers/serviceController.cjs');

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

router.post('/services', userAuth, createService);
router.get('/services', userAuth, getServicesByDeceasedId);
router.get('/services/stats', userAuth, getServiceStats);
router.put('/services', userAuth, updateService);
router.delete('/services', userAuth, deleteService);

module.exports = router;
