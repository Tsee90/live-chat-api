const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = require('../queries/userQueries');
const bcrypt = require('bcryptjs');

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      console.log('inside local..', username);
      const user = await db.getUserByName(username);
      console.log(user);
      if (!user) {
        return done(null, false, { message: 'Incorrect username' });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: 'Incorrect password' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

module.exports = passport;
