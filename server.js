const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const cors = require('cors');
const jwtAuth = require('socketio-jwt-auth');
const config = require('config');
const roomFunc = require('./socket/roomFunc');
const User = require('./models/User');
// Connect Database
connectDB();
const PORT = process.env.PORT || 5000;
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(bodyParser.json()); // support json encoded bodies
app.use(cors({ origin: '*' }));
// Settings for CORS
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/game', require('./routes/api/game'));
io.origins('*:*');
const nsp = io.of(/^\/room_.*/);
nsp.use(
  jwtAuth.authenticate(
    {
      secret: config.get('jwtSecret'), // required, used to verify the token's signature
      algorithm: 'HS256', // optional, default to be HS256
    },
    function (payload, done) {
      // done is a callback, you can use it as follows
      User.findById(payload.user.id, function (err, user) {
        if (err) {
          // return error
          return done(err);
        }
        if (!user) {
          // return fail with an error message
          return done(null, false, 'user does not exist');
        }
        // return success with a user info
        return done(null, user);
      });
    }
  )
);
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}
nsp.on('connection', (socket) => {
  roomFunc(socket);
});
http.listen(PORT, () => console.log(`Server started on port ${PORT}`));
