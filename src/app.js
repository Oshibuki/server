'use strict';
import dotenv from 'dotenv';
dotenv.config();

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
var morgan = require('morgan');
const winston = require('winston')
import express from 'express';
const { static: Static, json, urlencoded } = express
import session from 'express-session';
import connectMongo from 'connect-mongo';
var cookieParser = require('cookie-parser')
var cors = require('cors')


import myDB from './database/connection.js';
import { matchMakingRouter} from './server-api/index.js';
import auth from './auth/index.js';
import { serverStarter } from './socketio.js';

// const MongoStore = connectMongo(session);
// const URI = process.env.MONGO_URI;
// const store = new MongoStore({ url: URI });
const app = express();
app.use(morgan('short'));
app.set('view engine', 'pug');
app.set('views', 'src/views/pug');

app.use(cookieParser());
const sessionMiddleware = session({
    secret: 'wow very secret',
    cookie: {
      maxAge: 600000,
      secure: true
    },
    saveUninitialized: false,
    resave: false,
    unset: 'destroy'
});
app.use(sessionMiddleware);
app.use(cors({
    origin: [
      'http://localhost:4000',
      'https://localhost:4000'
    ],
    credentials: true,
    exposedHeaders: ['set-cookie']
}));
app.use('/public', Static(process.cwd() + '/public'));
app.use(json());
app.use(urlencoded({ extended: true }));

myDB(async () => {
    auth(app)

    //api
    app.use('/matchmaking', matchMakingRouter)

    app.use((req, res, next) => {
        res.status(404).type('text')
            .send('Not Found');
    });


}).catch(e => {
    app.route('/').get((req, res) => {
        res.render('index', { title: e, message: 'Unable to connect to database' });
    });
});

serverStarter(app, sessionMiddleware)
