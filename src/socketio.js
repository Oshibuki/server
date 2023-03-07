import http from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv';
import passport from 'passport'
dotenv.config();

export  function serverStarter(app, sessionMiddleware) {
    const httpserver = http.createServer(app);
    const io = new Server(httpserver);

    app.use((req, res, next) => {
        req.io = io;
        return next();
    });

    // convert a connect middleware to a Socket.IO middleware
    const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

    io.use(wrap(sessionMiddleware));
    io.use(wrap(passport.initialize()));
    io.use(wrap(passport.session()));

    io.use((socket, next) => {
        if (socket.request.user) {
            next();
        } else {
            next(new Error('unauthorized'))
        }
    });

    // io.of(<your namespace>).use(wrap(sessionMiddleware)); //if using passport, it will be socket.request.session.passport.user
    // io.of(<your namespace>).use(wrap(passport.initialize()));
    // io.of(<your namespace>).use(wrap(passport.session())); // this sets it to socket.request.user



    let currentUsers = 0;
    io.on('connection', socket => {
        const timer = setInterval(() => {
            socket.request.session.reload((err) => {
                if (err) {
                    // forces the client to reconnect
                    socket.conn.close();
                    // you can also use socket.disconnect(), but in that case the client
                    // will not try to reconnect
                }
            });
        }, process.env.SESSION_RELOAD_INTERVAL);

        currentUsers++
        console.log('user ' + socket.request.user.username + ' connected');
        io.emit('user count', currentUsers);
        io.emit('user', {
            username: socket.request.user.username,
            currentUsers,
            connected: true
        });
        const sessionId = socket.request.session.id;
        socket.join(sessionId);

        socket.on('disconnect', () => {
            currentUsers--
            console.log(socket.request.user.username+" disconnected");

            io.emit('user', {
                username: socket.request.user.username,
                currentUsers,
                connected: false
            });

            clearInterval(timer);
        });

        socket.on('chat message', (message) => {
            io.emit('chat message', {
                username: socket.request.user.username,
                message: message
            });
        });
    });

    const PORT = process.env.PORT || 3000;

    httpserver.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    });

    return io
}


