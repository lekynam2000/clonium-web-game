import React, { useEffect, useState, Fragment } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { setAlert } from '../../actions/alert';
import io from 'socket.io-client';
import { init } from './createCanvas';
function Game({ auth, match, history, dispatch }) {
  const token = sessionStorage.getItem('token');
  useEffect(() => {
    var socket = io(`/room_${match.params.id}`, {
      query: `auth_token=${token}`,
    });
    setSocket(socket);
    socket.on('changePlayer', (msg) => {
      setPlayers(msg.players);
    });
    socket.on('changeObserver', (msg) => {
      setObservers(msg.observers);
    });
    socket.on('changeHost', (msg) => {
      setHost(msg.host);
    });
    socket.on('getHostName', (msg) => {
      setHostName(msg);
    });
    socket.on('changeRole', (msg) => {
      setRole(msg.role);
    });
    socket.on('errorGame', (err) => {
      alertMessage(err.msg);
    });
    socket.on('started', (msg) => {
      // setPlayers(msg.players);
      let animate = init(msg.game, (row, col) => {
        playFunc(socket, msg.gameId, row, col);
      });
      setPlaying(true);
      setAnimateFunc({ animate });
    });

    socket.on('endgame', (msg) => {
      console.log(msg);
      setWinner(msg.winner);
      setPlaying(false);
    });
    addEL('changeRole', changeRole, socket);
    // addEL('leaveRoom', leave, socket);
    addEL('startGame', startGame, socket);
    return () => {
      socket.emit('forceDisconnect');
    };
  }, []);

  const [mySocket, setSocket] = useState(null);
  const [turn, setTurn] = useState(0);
  const [phase, setPhase] = useState(0);
  // const [gameMatrix, setGameMatrix] = useState([[]]);
  const [animateFunc, setAnimateFunc] = useState(null);
  const [players, setPlayers] = useState([]);
  const [observers, setObservers] = useState([]);
  const [role, setRole] = useState('observer');
  const [playing, setPlaying] = useState(false);
  const [host, setHost] = useState(null);
  const [hostName, setHostName] = useState('');
  const [winner, setWinner] = useState(null);
  const [status, setStatus] = useState([]);
  const colorArray = [
    0xfc0303,
    0xf1f514,
    0x111111,
    0xe309ad,
    0xe3092d,
    0x09cde3,
    0x0918e3,
    0x1a1717,
  ];
  const getColor = (hex) => {
    var color = `#${hex.toString(16)}`;
    return color;
  };
  useEffect(() => {
    mySocket &&
      animateFunc &&
      mySocket.on('updateGame', (msg) => {
        animateFunc.animate(
          msg.animateArray,
          players.indexOf(msg.player),
          msg.explode
        );

        setTurn(msg.turn);
        setPhase(msg.phase);
        setStatus(msg.status);
      });
  }, [mySocket, animateFunc]);
  useEffect(() => {
    if (mySocket && !auth.loading && host == auth._id.toString()) {
      mySocket.emit('sendHostName', auth.user.name);
    }
  }, [mySocket, host, auth.loading]);
  const alertMessage = (msg, type = 'danger') => {
    dispatch(setAlert(msg, type));
  };
  const playFunc = (socket, gameId, row, col) => {
    socket.emit('play', { row, col, gameId });
  };
  const addEL = (id, func, socket) => {
    let ele = document.getElementById(id);
    if (ele) {
      // try {
      //   ele.removeEventListener('click', func);
      // } catch {
      //   console.log('twice');
      // }
      ele.addEventListener('click', {
        handleEvent: function () {
          func(socket);
        },
      });
    } else {
      console.log('not found element: ' + id);
    }
  };
  const addPlayer = (socket) => {
    socket.emit('addPlayer', true);
  };
  // const leave = (socket) => {
  //   // socket.emit('leave', true);
  //   history.push('/rooms');
  // };
  const addObserver = (socket) => {
    socket.emit('addObserver', true);
  };
  const changeRole = (socket) => {
    socket.emit('toggleRole', true);
  };
  const startGame = (socket) => {
    socket.emit('start', true);
  };
  const resign = (socket) => {
    if (playing) {
      let r = window.confirm('Do you really want to resign?');
      if (r == true) {
        socket.emit('resign', true);
      }
    }
  };
  return (
    <div className='game'>
      <div className='left-sidebar'>
        <h2>Hello: {auth.user && auth.user.name}</h2>
        <p>Host: {hostName}</p>
        <p>Observer: {observers.length}</p>
        <p>Turn: {turn}</p>
        <p>Role: {role}</p>
        {players.length > 0 && playing && <p>Phase: {players[phase].name}</p>}
        <div className='btn-group'>
          {!playing && (
            <button className='btn btn-primary' id='changeRole'>
              {role == 'observer' ? 'Join as player' : 'Become Observer'}
            </button>
          )}
          <Link to='/rooms'>
            <button className='btn btn-danger' id='leaveRoom'>
              Leave
            </button>
          </Link>
          {!host || (auth._id && auth._id.toString() == host) ? (
            <button className='btn btn-success' id='startGame'>
              Start
            </button>
          ) : (
            <p></p>
          )}

          <button
            className='btn btn-primary'
            id='resign'
            disabled={!playing}
            onClick={() => {
              resign(mySocket);
            }}
          >
            Resign
          </button>
        </div>
      </div>
      <div id='webgl'></div>
      <div className='right-sidebar'>
        {winner != null && <p>There is one remaining player. Game finished</p>}
        <h2>Players</h2>
        <ul className='statusList'>
          {players.map((player, index) => (
            <li
              key={index}
              style={{ 'background-color': getColor(colorArray[index]) }}
              className={index == phase ? 'active' : ''}
            >
              <div className='statusName'>{player.name}</div>
              {status[index] && (
                <Fragment>
                  <div className='statusDots'>{status[index].dots}d</div>
                  <div className='statusPieces'> {status[index].pieces}p</div>
                </Fragment>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
const mapPropsFromState = (state) => ({
  auth: state.auth,
});
export default withRouter(connect(mapPropsFromState, null)(Game));
