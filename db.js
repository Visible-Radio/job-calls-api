const knex = require("knex");

//setup for remote db
/* const db = knex({
	client: 'pg',
	connection: {
		connectionString: process.env.DATABASE_URL,
		ssl: {
    	rejectUnauthorized: false
  	}
	}
}); */

// setup for local db

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "",
    password: "",
    database: "job-calls-test2",
  },
});


module.exports = db;