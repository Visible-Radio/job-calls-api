const router = require('express').Router();
const db = require('../../db');
const bcrypt = require('bcrypt');
const jwtGenerator = require('./utils/jwtGenerator');
const authorization = require('../../middleware/authorization');

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json('incorrect form submission');
  }

  const hash = bcrypt.hashSync(password, 10);

  //email is UNIQUE in schema, so we'll automatically error out if user already exists
  db.transaction(trx => {
    trx.insert({
      user_password: hash,
      user_email: email,
      user_name: name
    })
    .into('users')
    .returning(['user_id', 'user_email'])
    .then( ([ { user_id, user_email } ]) => {
      // we'll also enter the user into the user_alerts table for future use
      return trx('user_alerts')
      .returning('user_id')
      .insert({
        user_id: user_id,
        user_email: user_email
      })
      .then(([ user_id ]) => {
        return jwtGenerator(user_id);
      })
    })

    .then(token => {
      trx.commit();
      res.json({token});
    })
    .catch(error => {
      console.error(error.detail);
      trx.rollback();
      res.status(500).json("Unable to register");
    });
  })
  .catch(error => {
    // rollback throws an error...which node with complain about not handling
    console.log("Rolled Back");
  });

});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json('incorrect form submission');
  }

  db.select('user_email', 'user_password', 'user_id')
    .from('users')
    .where('user_email', '=', email)
    .then(queryResults => {
      if (!queryResults.length) throw new Error('No matching record found');
      const isValid = bcrypt.compareSync(password, queryResults[0].user_password);
      if (isValid) {
        const token = jwtGenerator(queryResults[0].user_id);
        return res.json({ token })
      } else {
        res.status(400).json("wrong credentials")
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).json("Unable to log in");
    })
})

router.get('/is-verify', authorization, async (req, res) => {
  try {
    // if the authorization middleware doesn't error,
    // the user is authorized
    res.json(true);
  } catch (error) {
    console.error(error);
     res.status(500).json("Server Error");
  }
})

module.exports = router;