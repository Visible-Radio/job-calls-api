function companyList(req, res, db){
	db('job_calls').distinct('company').orderBy('company')
		.then(companies => companies.map(company => company.company))
		.then(companyArray => res.json(companyArray));
};

module.exports = {
  companyList
}