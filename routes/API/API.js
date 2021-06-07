const router = require('express').Router();
const db = require('../../db');

// CONTROLLERS
const completeCallsByDateRange = require("./controllers/completeCallsByDateRange");
const classTotalsByDateRange = require("./controllers/classTotalsByDateRange");
const companyList = require("./controllers/companyList");
const getColors = require('./controllers/getColors');

//API ROUTES

// returns all call information
router.post('/', (req, res) => completeCallsByDateRange(req, res, db));

// returns tallies of members needed by classification and date range
// FYI, this is an expensive request
router.post('/members_needed_byDate', (req, res) => classTotalsByDateRange(req, res, db));

// returns a list of all companies in the database
router.get("/companies", (req, res) => companyList(req, res, db));

// returns the colors and readable classifications
router.get("/colors", (req, res) => getColors(req, res))

module.exports = router;