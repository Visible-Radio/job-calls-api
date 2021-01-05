

	
//========MEMBERS NEEDED BY CLASSIFICATION FOR A DAY OR DAYS==========
// ORIGINAL
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


//========MEMBERS NEEDED BY CLASSIFICATION FOR A DAY OR DAYS==========
//SLIGHT CLEANING
app.post('/members_needed_by_date_old', (req, res) => {
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
		.then(days => {
			const dayTotals = days.map(day => {								
				// again we end up with time stamps........hack them off with this regex....			
				const call_date = day.call_date_iso.toISOString().match(/\d\d\d\d-\d\d-\d\d/)[0]
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
