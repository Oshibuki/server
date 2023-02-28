'use strict';
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
const { static:Static, json, urlencoded } = express
import myDB from './database/connection.js';
import router from './routes/index.js';
import auth from './auth/index.js';

import session from 'express-session';
import { authorize } from 'passport.socketio';
import cookieParser from 'cookie-parser';
import connectMongo from 'connect-mongo';
const MongoStore = connectMongo(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

const app = express();

app.set('view engine', 'pug');
app.set('views', 'src/views/pug');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false },
  key: 'express.sid',
  store: store,
  unset: 'destroy',
}));

app.use('/public', Static(process.cwd() + '/public'));
app.use(json());
app.use(urlencoded({ extended: true }));

myDB(async () => {
  auth(app)
  app.use('/',router)

  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
  
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});

import http from 'http'
const httpserver = http.createServer(app);
import {Server} from 'socket.io'
const io =new Server(httpserver);
io.use(
  authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail,
    unset: 'destroy',
  })
);

function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}


let currentUsers = 0;
io.on('connection', socket => {
  currentUsers++
  console.log('user ' + socket.request.user.username + ' connected');
  io.emit('user count', currentUsers);
  io.emit('user', {
  username: socket.request.user.username,
  currentUsers,
  connected: true
});

  socket.on('disconnect', () => {
  currentUsers--
    console.log(currentUsers);

    io.emit('user', {
  username: socket.request.user.username,
  currentUsers,
  connected: false
});
});

  socket.on('chat message', (message) => {
  
io.emit('chat message', {
  username: socket.request.user.username,
  message:message
});
});
});

  
const PORT = process.env.PORT || 3000;
httpserver.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
