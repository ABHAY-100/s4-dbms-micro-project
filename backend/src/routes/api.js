const express = require('express');
const router = express.Router();
const deceasedController = require('../controllers/deceasedController');
const chamberController = require('../controllers/chamberController');
const auth = require('../middleware/auth');

// Deceased routes
router.post('/deceased', auth, deceasedController.createDeceased);
router.get('/deceased', auth, deceasedController.getAllDeceased);
router.get('/deceased/:id', auth, deceasedController.getDeceased);
router.put('/deceased/:id', auth, deceasedController.updateDeceased);
router.delete('/deceased/:id', auth, deceasedController.deleteDeceased);

// Chamber routes
router.post('/chambers', auth, chamberController.createChamber);
router.get('/chambers', auth, chamberController.getAllChambers);
router.get('/chambers/:id', auth, chamberController.getChamber);
router.put('/chambers/:id', auth, chamberController.updateChamber);
router.delete('/chambers/:id', auth, chamberController.deleteChamber);

module.exports = router;
