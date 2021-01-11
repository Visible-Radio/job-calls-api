const express = require('express');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : '',
    password : '',
    database : 'test'
  }
});

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
    "company": ["PLAN GROUP INC."]
}*/
// currently company must be an exact match

app.post('/', (req, res) => {	
	db.select('*').from('job_calls')
		.whereBetween('call_date_iso', [req.body.start, req.body.end])
		.modify((queryBuilder) => {
	    if (req.body.hasOwnProperty('member_class')) {
	        queryBuilder.whereIn('member_class', req.body.member_class);
	    }
	  })
	  .modify((queryBuilder) => {
	    if (req.body.hasOwnProperty('company')) {
	        queryBuilder.whereIn('company', req.body.company);
	    }
	  })
		.orderBy('call_date_iso')		
		.then(calls => res.json(calls))
		.catch(error => res.status(500).json('db error'));			
})

//===============TOTAL MEMBERS NEEDED FOR ALL TIME===================
app.get('/total_members_needed', (req, res) => {		
	db('job_calls').sum('members_needed').from('job_calls')
	.then(sum => res.json(sum[0].sum))
});

//==========MEMBERS NEEDED BY CLASSIFICATION FOR ALL TIME============
app.get('/members_needed', (req, res) => {
	const totals = {};
	const member_classes =[
		'JW', 'AW', 'JHW', 'AHW', 'RJW', 'JL', 'AL', 'TEC1', 'TEC2',
		'TEC3', 'TEC4', 'ATEC', 'CI', 'ETN', 'JCS', 'U'
	];

	const dbCalls = [];
	member_classes.forEach(member_class => {
		dbCalls.push(
			db('job_calls')
			.sum('members_needed')
			.from('job_calls')
			.where('member_class', '=', member_class)
		);
	})
	
	Promise.all(dbCalls).then(values => {
		let total = 0;
		values.flat().forEach((obj, i) => {
			totals[member_classes[i]] = obj.sum;
			total += Number(obj.sum);
		})
		totals.TOTAL = String(total);
		res.json(totals);
	});
	// need to add error handling
});
	
//========MEMBERS NEEDED BY CLASSIFICATION FOR A DAY OR DAYS==========
app.post('/members_needed_by_date', async (req, res) => {

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
		.sum(`members_needed as ${member_class}`)		
		.where('member_class', '=', member_class)
		.then(count => {
				const key = (Object.keys(count[0])[0]);
				const value = (Object.values(count[0])[0]) || '0';
				return [key, value];						
		})		
	}
		
});

const PORT = 3000;
app.listen(PORT || 3000, () => {
	console.log(`app is running on port ${PORT}`);
})


