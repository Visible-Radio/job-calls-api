const { validateBody } = require('../utils/validateBody');
/*
==========================ROOT ROUTE=============================
===========COMPLETE JOB CALL INFO FOR RANGE OF DATES=============
    "start": "2020-12-01",
    "end": "2020-12-31",
    "member_class": ["JW", "AW", "AHW", "TEC2"],
    "company": ["PLAN GROUP INC.", "OZZ ELECTRIC"]
*/
function completeCallsByDateRange(req, res, db) {
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
	        queryBuilder.whereIn('company', req.body.company);
	    }
	  })
		.orderBy('call_date_iso')
		.then(calls => res.json(calls))
		.catch(error => res.status(500).json('db error'));
}

module.exports = {
  completeCallsByDateRange
}

