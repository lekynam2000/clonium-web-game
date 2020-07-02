const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rooms',
  },
  gameLogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'games',
    },
  ],
});
module.exports = User = mongoose.model('users', UserSchema);
