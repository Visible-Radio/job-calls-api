 const { validateBody } = require('../utils/validateBody.js');

async function classTotalsByDateRange(req, res, db) {
	if (!validateBody(req.body)) {
		return res.status(400).json('invalid request body');
	}

	const member_classes = req.body.hasOwnProperty('member_class')
		? req.body.member_class
		: [
			'JW', 'AW', 'JHW', 'AHW', 'RJW', 'JL', 'AL', 'TEC1', 'TEC2',
			'TEC3', 'TEC4', 'ATEC', 'CI', 'ETN', 'JCS', 'U', 'GEO',
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
	        queryBuilder.whereIn('company', req.body.company);
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
};

module.exports = {
  classTotalsByDateRange
}