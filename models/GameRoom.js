const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
  ],
  observers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
  ],
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  hostName: {
    type: String,
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'games',
  },
  playing: {
    type: Boolean,
    default: false,
  },
});
module.exports = Room = mongoose.model('rooms', RoomSchema);
