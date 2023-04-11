'use strict';
import dotenv from 'dotenv';
dotenv.config();
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { fileURLToPath } from 'url';
import { dirname} from 'path';
  
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import express from 'express';
import helmet from "helmet";
const { static: Static, json, urlencoded } = express
var morgan = require('morgan');
var cors = require('cors')
const requestIp = require('request-ip');

import myDB from './database/connection.js';
import { serverStarter } from './socketio.js';

import { matchMakingRouter } from './server-api/index.js';
import { apiRouter } from './protectedRoutes/index.js';
var history = require('connect-history-api-fallback');
import auth from './auth/index.js';

// const MongoStore = connectMongo(session);
// const URI = process.env.MONGO_URI;
// const store = new MongoStore({ url: URI });
const app = express();
app.use(morgan('short'));
app.use(requestIp.mw())
app.use(helmet());
app.use(history())
app.use(Static(__dirname + '/public/dist'));

app.use(cors({
    origin: [
        'http://localhost:4000',
        'https://localhost:4000'
    ],
    credentials: true,
    exposedHeaders: ['set-cookie']
}));
app.use(json());
app.use(urlencoded({ extended: true }));

myDB(async () => {
    auth(app)

    //api
    app.use('/matchmaking', matchMakingRouter)
    app.use('/api', apiRouter)

    app.use((req, res) => {
        res.status(404).type('text')
            .send('Not Found');
    });


}).catch(e => {
    app.route('/').get((req, res) => {
        res.render('index', { title: e, message: 'Unable to connect to database' });
    });
});

serverStarter(app)
