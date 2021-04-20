const express = require('express');
const cors = require('cors');
const knex = require('knex');

const { validateBody } = require('./utils/validateBody');
const { completeCallsByDateRange } = require('./controllers/completeCallsByDateRange');
const { classTotalsByDateRange } = require('./controllers/classTotalsByDateRange');
const { companyList } = require('./controllers/companyList');

//===================== setup for local db ==============//
const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : '',
    password : '',
    database : 'job-calls-test2'
  }
});
//========================================================//
//===================== setup for remote db ==============//
/* const db = knex({
	client: 'pg',
	connection: {
		connectionString: process.env.DATABASE_URL,
		ssl: {
    	rejectUnauthorized: false
  	}
	}
}); */
//===================== setup for remote db ==============//

const app = express();
app.use(express.json());
app.use(cors());

// returns all call information
app.post('/', (req, res) => completeCallsByDateRange(req, res, db));

// returns tallies of members needed by classification and date range
app.post('/members_needed_by_date', (req, res) => classTotalsByDateRange(req, res, db));

// returns a list of all companies in the database
app.get('/companies', (req, res) => companyList(req, res, db));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`app is running on port ${PORT}`);
})
