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

	// if the request specifies companies, perform these checks
	if (body.company) {
		if (!Array.isArray(body.company)
			|| body.company.length < 1
			|| body.company.length > 8
		) return false;
		// min 1 char, max 40 chars, alphanumeric and space
		// added extra permitted chars when select menu implemented
		// apparently knex passes params in as ? placeholders anyway,
		// thereby protecting the query from malicious input
		const pattern = /^[A-Za-z0-9 \.\-\(\)\&\\\/]{1,40}$/;
		if (body.company.some(company => !pattern.test(company))) {
			return false;
		}

	}
	return true;
}

module.exports = {
	validateBody
}