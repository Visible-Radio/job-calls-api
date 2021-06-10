-- this isn't a complete schema
-- missing schema for original job_calls table
-- this is for tables that were added for the auth and email alert systems

--don't forget to set uuid extension
--don't forget to set uuid extension on users table
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users(
  user_id uuid PRIMARY KEY DEFAULT
  --user_id SERIAL PRIMARY KEY DEFAULT
  uuid_generate_v4(),
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) UNIQUE NOT NULL,
  user_password VARCHAR(255) NOT NULL
);

--alerts stored as comma separated values, just update the entire entry when changes are made

CREATE TABLE user_alerts(
  user_id uuid PRIMARY KEY,
  user_email VARCHAR(255) UNIQUE NOT NULL,
  alerts_companies TEXT,
  alerts_classes TEXT
);

--insert fake users
INSERT INTO users(
  user_name,
  user_email,
  user_password
) VALUES (
  'pat',
  'pat@pat.com',
  'pat@pat.com'
);