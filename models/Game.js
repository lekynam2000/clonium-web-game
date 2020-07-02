const mongoose = require('mongoose');
const square = new mongoose.Schema({
  player: {
    type: Number,
  },
  dot: {
    type: Number,
    default: 0,
  },
});

const GameSchema = new mongoose.Schema({
  initGameMatrix: [[square]],
  gameMatrix: [[square]],
  turn: {
    type: Number,
    default: 0,
  },
  phase: {
    type: Number,
    default: 0,
  },
  queue: [
    {
      row: {
        type: Number,
        required: true,
      },
      col: {
        type: Number,
        require: true,
      },
    },
  ],
  players: {
    type: Number,
  },
  playersMap: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
  ],
  remainPlayers: [{ type: Number }],
  status: [
    {
      player: {
        type: Number,
      },
      dots: {
        type: Number,
      },
      pieces: {
        type: Number,
      },
    },
  ],
  width: {
    type: Number,
    default: 10,
  },
  height: {
    type: Number,
    default: 10,
  },
});
GameSchema.methods.bindGame = async function (id, func) {
  const game = await this.model('games').findById(id);
  return func.bind(game);
};
module.exports = Game = mongoose.model('games', GameSchema);
