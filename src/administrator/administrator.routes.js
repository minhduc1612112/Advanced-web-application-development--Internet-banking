const express = require('express');
const router = express.Router();

const administratorController = require('./administrator.controllers');

router.get('/employees', administratorController.getEmployees);
router.post('/employees',administratorController.createEmployee);
router.delete('/employees/:_id',administratorController.deleteEmployee);

router.get('/accounts', administratorController.getAccounts);

router.get('/transactions/interbank', administratorController.interbankTransaction);

module.exports = router;