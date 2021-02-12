const express = require('express');
const cors = require('cors');
const knex = require('knex');

//===================== setup for local db ==============//
/* const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : '',
    password : '',
    // database : 'test'
    database : 'job-calls-test2'
  }
}); */
//========================================================//

//===================== setup for remote db ==============//

const db = knex({
	client: 'pg',
	connection: {
		connectionString: process.env.DATABASE_URL,
		ssl: {
    	rejectUnauthorized: false
  	}
	}
});
//===================== setup for remote db ==============//
const app = express();
app.use(express.json());
app.use(cors());

//==========================ROOT ROUTE=============================
//===========COMPLETE JOB CALL INFO FOR RANGE OF DATES=============
//=========optionally filterable by member class and company=======
// example post body:
/*{
    "start": "2020-12-01",
    "end": "2020-12-31",
    "member_class": ["JW", "AW", "AHW", "TEC2"],
    "company": "PLAN GROUP INC."
}*/
// company only accepts one value, not an array of companies

function validateBody(body) {
	// validate inputs

	if (!body.start || !body.end) return false;

	// must match exactly this date format
	const pattern = /\d\d\d\d-\d\d-\d\d/;
	if (!pattern.test(body.start) || !pattern.test(body.end)) return false;

	// if the request specifies member classes, perform these checks
	if (body.member_class) {
		if (!Array.isArray(body.member_class)
				|| body.member_class.length < 1
				|| body.member_class.length > 32
		) return false;

		// min 1 char, max 8 chars, alphanumeric no spaces
		const pattern = /^[A-Za-z0-9]{1,8}$/;
		if (body.member_class.some(element => !pattern.test(element))) {
			return false;
		}
	}

	if (body.company) {
		// min 1 char, max 25 chars, alphanumeric and space
		const pattern = /^[A-Za-z0-9 ]{1,25}$/;
		if (!pattern.test(body.company)) {
			return false;
		}
	}
	return true;
}

app.post('/', (req, res) => {
	if (!validateBody(req.body)) {
		return res.status(400).json('invalid request body');
	}

	db.select('*').from('job_calls')
		.whereBetween('call_date_iso', [req.body.start, req.body.end])
		.modify((queryBuilder) => {
	    if (req.body.hasOwnProperty('member_class')) {
	        queryBuilder.whereIn('member_class', req.body.member_class);
	    }
	  })
	  .modify((queryBuilder) => {
	    if (req.body.hasOwnProperty('company')) {
	        queryBuilder.where('company', 'ilike', `%${req.body.company}%`);
	    }
	  })
		.orderBy('call_date_iso')
		.then(calls => res.json(calls))
		.catch(error => res.status(500).json('db error'));
})



//========MEMBERS NEEDED BY CLASSIFICATION FOR A DAY OR DAYS==========
app.post('/members_needed_by_date', async (req, res) => {
	if (!validateBody(req.body)) {
		return res.status(400).json('invalid request body');
	}

	const member_classes = req.body.hasOwnProperty('member_class')
		? req.body.member_class
		: [
			'JW', 'AW', 'JHW', 'AHW', 'RJW', 'JL', 'AL', 'TEC1', 'TEC2',
			'TEC3', 'TEC4', 'ATEC', 'CI', 'ETN', 'JCS', 'U'
		];

	const days = await db.select('call_date_iso')
		.from('job_calls')
		.distinct()
		.whereBetween('call_date_iso', [req.body.start, req.body.end])
		.orderBy('call_date_iso')
		.then(days => {
			return days.map(day => Object.values(day)).flat()
				.map(dateStamp => dateStamp.toISOString().match(/\d\d\d\d-\d\d-\d\d/)[0]);
		})
		.catch(error => {
			console.log(error);
			res.status(500).json('problem getting days from DB');
		})

	try {
		const response = await getCountsForDays(days);
		res.status(200).json(response);
	} catch {
		console.log('problem getting records from DB');
		res.status(500).json('Something went wrong');
	}

	async function getCountsForDays(days) {
		const countsForDays = [];
		for (let i = 0; i < days.length; i++) {
			countsForDays.push(await getCountsForClasses(member_classes, days[i]));
		}
		return countsForDays;
	}

	async function getCountsForClasses(member_classes,day) {
		const countsForClasses = [['Date', day]];
		let total = 0;
		for (let i = 0; i < member_classes.length; i++) {
			const countForClass = await getCountForClass(member_classes[i], day);
			total += Number(countForClass[1]);
			countsForClasses.push(countForClass);
		}
		countsForClasses.push(['Total', String(total)]);
		return Object.fromEntries(countsForClasses);
	}

	async function getCountForClass(member_class, day) {
		return await db('job_calls')
		.where('call_date_iso', '=', day)
		.modify((queryBuilder) => {
	    if (req.body.hasOwnProperty('company')) {
	        queryBuilder.where('company', 'ilike', `%${req.body.company}%`);
	    }
	  })
		.sum(`members_needed as ${member_class}`)
		.where('member_class', '=', member_class)
		.then(count => {
				const key = (Object.keys(count[0])[0]);
				const value = (Object.values(count[0])[0]) || '0';
				return [key, value];
		})
	}

});

/* Companies end point, return a list of companies from the DB */
app.get('/companies', (req, res) => {
	db('job_calls').distinct('company').orderBy('company')
		.then(companies => companies.map(company => company.company))
		.then(companyArray => res.json(companyArray));
});

const PORT = process.env.PORT;
app.listen(PORT || 3000, () => {
	console.log(`app is running on port ${PORT}`);
})

//===============TOTAL MEMBERS NEEDED FOR ALL TIME===================
// app.get('/total_members_needed', (req, res) => {
// 	db('job_calls').sum('members_needed').from('job_calls')
// 	.then(sum => res.json(sum[0].sum))
// });

//==========MEMBERS NEEDED BY CLASSIFICATION FOR ALL TIME============
// app.get('/members_needed', (req, res) => {
// 	const totals = {};
// 	const member_classes =[
// 		'JW', 'AW', 'JHW', 'AHW', 'RJW', 'JL', 'AL', 'TEC1', 'TEC2',
// 		'TEC3', 'TEC4', 'ATEC', 'CI', 'ETN', 'JCS', 'U'
// 	];

// 	const dbCalls = [];
// 	member_classes.forEach(member_class => {
// 		dbCalls.push(
// 			db('job_calls')
// 			.sum('members_needed')
// 			.from('job_calls')
// 			.where('member_class', '=', member_class)
// 		);
// 	})

// 	Promise.all(dbCalls).then(values => {
// 		let total = 0;
// 		values.flat().forEach((obj, i) => {
// 			totals[member_classes[i]] = obj.sum;
// 			total += Number(obj.sum);
// 		})
// 		totals.TOTAL = String(total);
// 		res.json(totals);
// 	});
// 	// need to add error handling
// });


