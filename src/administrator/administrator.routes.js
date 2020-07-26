const express = require('express');
const router = express.Router();

const administratorController = require('./administrator.controllers');

router.get('/accounts', administratorController.getAccounts);

router.get('/transactions/interbank', administratorController.interbankTransaction);

module.exports = router;