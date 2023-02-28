import express from 'express'
var Router = express.Router();

Router.get('/', (req, res) => {
    res.render('index', {
        title: 'Connected to Database',
        message: 'Please log in',
        showLogin: true,
        showRegistration: true,
        showSocialAuth: true
    });
});

Router.get('/profile', ensureAuthenticated, (req, res) => {
    res.render('profile', { username: req.user.username });
});

Router.get('/chat', ensureAuthenticated, (req, res) => {
    res.render('chat', { user: req.user });
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  };

export default Router



