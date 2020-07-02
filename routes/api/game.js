const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const config = require('config');
const Room = require('../../models/GameRoom');
const User = require('../../models/User');
const Game = require('../../models/Game');
// @route GET api/game/room
// @desc get all current game rooms
// @access Private

router.get('/room', auth, async (req, res) => {
  try {
    const rooms = await Room.find().populate('host', 'name');
    res.send(rooms);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// @route POST api/game/room
// @desc create new game room
// @access Private

router.post('/room', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user.room) {
      return res.status(400).json({ msg: 'Already in room' });
    }
    const newRoom = new Room({
      host: req.user.id,
    });
    newRoom.observers.push(user.id);
    const room = await newRoom.save();
    user.room = room._id;
    await user.save();
    res.json(room);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// @route GET api/game/room/:id
// @desc get room info by Id
// @access Private
router.get('/room/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ msg: 'Not Found Room' });
    }
    res.send(room);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// @route DELETE api/game/room/
// @desc delete all room
// @access Private
router.delete('/room/', auth, async (req, res) => {
  try {
    await Room.deleteMany({});
    await Game.deleteMany({});
    const users = await User.find();
    users.forEach(async (user) => {
      user.room = null;
      await user.save();
    });

    res.send([]);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
