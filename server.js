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

//==========TOTAL MEMBERS NEEDED FOR A GIVEN DAY OR DAYS===============

	
//========MEMBERS NEEDED BY CLASSIFICATION FOR A DAY OR DAYS==========
app.post('/members_needed_by_date', (req, res) => {
	const member_classes = req.body.hasOwnProperty('member_class') 
		? req.body.member_class
		: [
			'JW', 'AW', 'JHW', 'AHW', 'RJW', 'JL', 'AL', 'TEC1', 'TEC2',
			'TEC3', 'TEC4', 'ATEC', 'CI', 'ETN', 'JCS', 'U'
		];

	const days = db.select('call_date_iso')		
		.from('job_calls')
		.distinct()
		.whereBetween('call_date_iso', [req.body.start, req.body.end])
		.orderBy('call_date_iso')
		.then(dates => {
			const dayTotals = dates.map(obj => {								
				// again we end up with time stamps........hack them off with this regex....			
				const call_date = obj.call_date_iso.toISOString().match(/\d\d\d\d-\d\d-\d\d/)[0]
				console.log(call_date);
				const dbCallsPromises = getDateStats(call_date);
				return Promise.all(dbCallsPromises)
					.then(values => {						
							let dayTotal = 0;
							const dayTotals = {};
							values.flat().forEach((obj, i) => {
								dayTotals[member_classes[i]] = obj.sum;
								dayTotal += Number(obj.sum);
							})
							dayTotals.dayTotal = String(dayTotal);
							dayTotals.DATE = call_date;							
							return dayTotals;						
						}
					)
			})
			return dayTotals;
		}
	)
	.then(dayTotals => Promise.all(dayTotals))
	.then(output => res.json(output));		

	function getDateStats(call_date) {	
		const dbCalls = [];
		member_classes.forEach(member_class => {
			dbCalls.push(
				db('job_calls')
				.where('call_date_iso', '=', call_date)
				.sum('members_needed')
				.from('job_calls')
				.where('member_class', '=', member_class)
			);
		})
		return dbCalls;	
	}

});




const PORT = 3000;
app.listen(PORT || 3000, () => {
	console.log(`app is running on port ${PORT}`);
})