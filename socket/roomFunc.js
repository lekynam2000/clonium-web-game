const gameMethod = require('../material/gameMethod');
const { compareSync } = require('bcryptjs');
module.exports = async function (socket) {
  const newNamespace = socket.nsp;
  const Room = require('../models/GameRoom');
  const Game = require('../models/Game');
  const User = require('../models/User');
  const roomId = newNamespace.name.split('_')[1];
  const id = socket.request.user._id.toString();
  const roomInfo = await Room.findById(roomId).populate('players', 'name');
  if (!roomInfo) {
    return socket.emit('errorGame', { msg: 'Not found room' });
  }
  if (roomInfo.playing) {
    let game = await Game.findById(roomInfo.game);
    let msg = {
      game,
      gameId: game._id,
      turn: game.turn,
      phase: game.phase,
      status: game.status,
    };
    socket.emit('started', msg);
  }
  socket.emit('getHostName', roomInfo.hostName && roomInfo.hostName);
  addObserver(roomId, id, socket, newNamespace);
  socket.emit('changePlayer', { players: roomInfo.players });
  roomInfo.players.forEach((player) => {
    if (player._id == id) {
      socket.emit('changeRole', { role: 'player' });
    }
  });
  if (roomInfo.host) newNamespace.emit('changeHost', { host: roomInfo.host });
  socket.emit('changeObserver', { observers: roomInfo.observers });
  socket.on('sendHostName', async (msg) => {
    const room = await Room.findById(roomId);
    room.hostName = msg;
    await room.save();
    newNamespace.emit('getHostName', msg);
  });
  socket.on('toggleRole', async () => {
    const room = await Room.findById(roomId);
    let index = inArray(room.players, id);
    if (index > -1) {
      addObserver(roomId, id, socket, newNamespace, true);
    } else {
      index = inArray(room.observers, id);
      if (index > -1) {
        addPlayer(roomId, id, socket, newNamespace);
      }
    }
  });
  socket.on('addPlayer', () => {
    addPlayer(roomId, id, socket, newNamespace);
  });
  socket.on('start', async () => {
    try {
      const room = await Room.findById(roomId).populate('players', 'name');
      if (room.players.length === 4 && !room.playing) {
        room.playing = true;
        const initGameMatrix = gameMethod.createSquareMatrix();
        const gameMatrix = gameMethod.createSquareMatrix();
        const players = room.players.length;
        const playersMap = room.players.map((p) => p._id);
        const remainPlayers = [0, 1, 2, 3];

        const newGame = new Game({
          initGameMatrix,
          gameMatrix,
          players,
          playersMap,
          remainPlayers,
        });
        const calcStatus = gameMethod.calculateStatus.bind(newGame);
        calcStatus();
        console.log(newGame.status);
        const game = await newGame.save();
        room.game = game.id;
        let msg = {
          game,
          gameId: game._id,
          turn: game.turn,
          phase: game.phase,
          status: game.status,
        };
        newNamespace.emit('started', msg);
        await room.save();
      } else if (room.players.length != 4) {
        socket.emit('errorGame', {
          msg: 'Number of players must be 4 to start game',
        });
      }
    } catch (error) {
      console.error(error);
      socket.emit('errorGame', { msg: 'Internal Server Error' });
    }
  });
  socket.on('play', async (msg) => {
    try {
      const playerId = id;
      const { row, col, gameId } = msg;
      const copyGameMethod = { ...gameMethod };
      const game = await Game.findById(gameId);
      const currGame = Object.assign(copyGameMethod, game._doc);
      const result = currGame.play(
        currGame.playersMap.indexOf(playerId),
        row,
        col
      );
      let animateArray = currGame.animateArray;
      game.gameMatrix = currGame.gameMatrix;
      game.turn = currGame.turn;
      game.phase = currGame.phase;
      game.status = currGame.status;
      game.remainPlayers = currGame.remainPlayers;
      await game.save();
      if (animateArray.length == 0) {
        animateArray = [
          {
            result: {
              gameMatrix: game.gameMatrix,
              width: game.width,
              height: game.height,
            },
          },
        ];
        newNamespace.emit('updateGame', {
          animateArray,
          player: playerId,
          turn: game.turn,
          phase: game.phase,
          status: game.status,
          explode: false,
        });
      } else {
        newNamespace.emit('updateGame', {
          animateArray,
          player: playerId,
          turn: game.turn,
          phase: game.phase,
          status: game.status,
          explode: true,
        });
      }
      console.log('Result: ', result);
      if (result.winner > -1) {
        console.log('Winner: ', result.winner);
        newNamespace.emit('endgame', { winner: result.winner });
        const users = await User.find({
          _id: { $in: game.playersMap },
        });
        for (let user of users) {
          user.gameLogs.push(game._id);
          await user.save();
        }
        const room = await Room.findById(roomId);
        room.playing = false;
        await room.save();
        // newNamespace.emit('refresh', true);
      }
    } catch (error) {
      console.error(error);
    }
  });
  socket.on('resign', async () => {
    console.log('resign: ', id);
    try {
      const room = await Room.findById(roomId);
      let index = inArray(room.players, id);
      if (index >= 0) {
        const game = await Game.findById(room.game);
        let player_index = game.remainPlayers.indexOf(index);
        if (player_index >= 0) {
          game.remainPlayers.splice(player_index, 1);
          for (let i = 0; i < game.height; i++) {
            for (let j = 0; j < game.width; j++) {
              if (game.gameMatrix[i][j].player == index) {
                // game.gameMatrix[i][j].player = null;
                // game.gameMatrix[i][j].dot = 0;
                game.gameMatrix[i][j] = { player: null, dot: 0 };
              }
            }
          }
          game.status[index].dots = 0;
          game.status[index].pieces = 0;
          while (game.remainPlayers.indexOf(game.phase) < 0) {
            game.phase = (game.phase + 1) % game.players;
            if (game.phase == 0) {
              game.turn++;
            }
          }
          game.gameMatrix = JSON.parse(JSON.stringify(game.gameMatrix));
          await game.save();
          newNamespace.emit('updateGame', {
            animateArray: [
              {
                result: {
                  gameMatrix: JSON.parse(JSON.stringify(game.gameMatrix)),
                  width: game.width,
                  height: game.height,
                },
              },
            ],
            player: id,
            turn: game.turn,
            phase: game.phase,
            status: game.status,
            explode: false,
          });
          if (game.remainPlayers.length == 1) {
            newNamespace.emit('endgame', { winner: game.remainPlayers[0] });
            room.playing = false;
            await room.save();
          }
        }
      } else {
        socket.emit('errorGame', { msg: 'Only players can resign' });
      }
    } catch (error) {
      console.error(error);
      socket.emit('errorGame', { msg: 'Internal Server Error' });
    }
  });
  socket.on('forceDisconnect', () => {
    disconnect(socket, roomId, id, newNamespace);
    console.log('forceDisconnect ', id);
  });
  socket.on('disconnect', () => {
    console.log('Disconnect: ', id);
    disconnect(socket, roomId, id, newNamespace);
  });
};
async function addObserver(roomId, id, socket, newNamespace, change = false) {
  console.log('AddObserver: ' + id);

  try {
    const user = await User.findById(id);
    if (user.room && user.room != roomId) {
      socket.emit('errorGame', { msg: 'Already in a room' });
    } else {
      let room = await Room.findById(roomId);
      let index = inArray(room.players, id);
      if (index >= 0 && room.playing) {
        return;
      }
      if (index >= 0 && change) {
        room.players.splice(index, 1);
        await room.save();
        room = await Room.findById(roomId).populate('players', 'name');
        socket.emit('changePlayer', { players: room.players });
      } else if (index >= 0) {
        return socket.emit('errorGame', { msg: 'Already is observer' });
      }
      index = inArray(room.observers, id);
      if (index > -1) {
        return;
      }
      room.observers.push(id);
      await room.save();
      user.room = room.id;
      await user.save();
      socket.emit('changeRole', { role: 'observer' });
      newNamespace.emit('changeObserver', { observers: room.observers });
    }
  } catch (error) {
    console.error(error);
    socket.emit('errorGame', { msg: 'Internal Server Error' });
  }
}
function inArray(array, id, keyCompare = null) {
  let index;
  array.forEach((el, _index) => {
    if (keyCompare) {
      if (el[keyCompare].toString().localeCompare(id) === 0) {
        index = _index;
      }
    } else {
      if (el.toString().localeCompare(id) === 0) {
        index = _index;
      }
    }
  });
  if (index > -1) {
    return index;
  }
  return -1;
}
async function disconnect(socket, roomId, id, newNamespace) {
  try {
    const room = await Room.findById(roomId).populate('players', 'name');
    // socket.disconnect();
    const user = await User.findById(id);
    user.room = null;
    await user.save();
    if (!room.playing) {
      let index = inArray(room.players, id, '_id');
      if (index > -1) {
        room.players.splice(index, 1);
        if (id.toString() === room.host.toString()) {
          if (room.players.length > 0) {
            room.host = room.players[0].id;
          } else {
            if (room.observers.length > 0) {
              room.host = room.observers[0];
            } else {
              await room.remove();
              return;
            }
          }
          newNamespace.emit('changeHost', { host: room.host });
        }
        await room.updateOne({
          host: room.host,
          players: room.players,
        });
        newNamespace.emit('changePlayer', { players: room.players });
      } else {
        index = inArray(room.observers, id);
        if (index > -1) {
          room.observers.splice(index, 1);
          if (id.toString() === room.host.toString()) {
            if (room.players.length > 0) {
              room.host = room.players[0].id;
            } else {
              if (room.observers.length > 0) {
                room.host = room.observers[0];
              } else {
                await room.remove();
                return;
              }
            }
            console.log('Host: ', room.host);
            newNamespace.emit('changeHost', { host: room.host });
          }
          await room.updateOne({
            host: room.host,
            observers: room.observers,
          });
          newNamespace.emit('changeObserver', { observers: room.observers });
        } else {
          console.error('Undefined User');
        }
      }
    } else {
      let index = inArray(room.observers, id);
      if (index > -1) {
        room.observers.splice(index, 1);
        if (id.toString() === room.host.toString()) {
          if (room.players.length > 0) {
            room.host = room.players[0].id;
          } else {
            if (room.observers.length > 0) {
              room.host = room.observers[0];
            } else {
              await room.remove();
              return;
            }
          }
          newNamespace.emit('changeHost', { host: room.host });
        }
        await room.save();
        newNamespace.emit('changeObservers', { observers: room.observers });
      }
    }
  } catch (error) {
    console.error(error);
    socket.emit('errorGame', { msg: 'Internal Server Error' });
  }
}

async function addPlayer(roomId, id, socket, newNamespace) {
  let room = await Room.findById(roomId);
  const user = await User.findById(id);
  if (user.room && user.room != room.id) {
    return socket.emit('errorGame', { msg: 'Already in room' });
  }
  if (!room.playing && room.players.length < 4) {
    if (!user.room) {
      user.room = room.id;
      await user.save();
    }
    let flag = false;
    room.players.forEach((player) => {
      if (player == id) {
        flag = true;
      }
    });
    if (flag) {
      return socket.emit('errorGame', { msg: 'Already player' });
    }
    room.players.push(id);

    await room.save();
    room = await Room.findById(roomId).populate('players', 'name');

    newNamespace.emit('changePlayer', { players: room.players });
    let index = inArray(room.observers, id);

    if (index >= 0) {
      room.observers.splice(index, 1);
      await room.save();
      newNamespace.emit('changeObserver', { observers: room.observers });
      socket.emit('changeRole', { role: 'player' });
    }
  } else if (room.playing) {
    socket.emit('errorGame', { msg: 'Cannot join playing room' });
  } else {
    socket.emit('errorGame', { msg: 'Players full' });
  }
}
