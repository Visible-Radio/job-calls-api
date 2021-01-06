//========MEMBERS NEEDED BY CLASSIFICATION FOR A DAY OR DAYS==========
// refactored using async/await and good old fashioned for loops
// cleanest yet
app.post('/members_needed_by_date_aa', async (req, res) => {

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
			}
		)	
	console.log(days);

	const response = await getCountsForDays(days);	
	res.json(response);

	async function getCountsForDays(days) {
		const countsForDays = [];
		for (let i = 0; i < days.length; i++) {
			countsForDays.push(await getCountsForClasses(member_classes, days[i]));	
		}
		return countsForDays;	
	}

	async function getCountsForClasses(member_classes,day) {
		const countsForClasses = [['Date:', day]];
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
		.from('job_calls')
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

//========MEMBERS NEEDED BY CLASSIFICATION FOR A DAY OR DAYS==========
// Refactored and still pretty dang gross! 
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
		.then(days => {
			return days.map(day => Object.values(day)).flat()
				.map(dateStamp => dateStamp.toISOString().match(/\d\d\d\d-\d\d-\d\d/)[0]);
			}
		)
		.then(daysISO => {
				return daysISO.map(day => {										
					const callCountPromises = member_classes.map(member_class => {
						return Promise.resolve(
							db('job_calls')
							.where('call_date_iso', '=', day)
							.sum(`members_needed as ${member_class}`)
							.from('job_calls')
							.where('member_class', '=', member_class)
							.modify((queryBuilder) => {
	    					if (req.body.hasOwnProperty('company')) {
	        				queryBuilder.whereIn('company', req.body.company);
	    					}
	  					})										
						)					
					})
					return (Promise.all(callCountPromises)					
					.then(resolved => {
						const daysTotals = {};												
						let counter = 0;

						resolved.forEach((count,i) => {
							if (Object.values(resolved[i][0])[0] !== null) {
								daysTotals[Object.keys(resolved[i][0])] = Object.values(resolved[i][0])[0];
								counter += Number(Object.values(resolved[i][0])[0]);
							} else {
								daysTotals[Object.keys(resolved[i][0])] = '0';
							}							
						})
						daysTotals.TOTAL = String(counter);	
						daysTotals.date = day;							
						return daysTotals;
					}))
					return;
				})				
				return;
			}
		)
		.then(dayTotals => (Promise.all(dayTotals)))
		.then(dayTotals => res.json(dayTotals))
		.catch(error => res.json('something went wrong'));
});

	
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
