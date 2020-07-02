import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import setAuthToken from '../../utils/setAuthToken';
const domain = '';
function RoomList({ history }) {
  const [gameRooms, setGameRooms] = useState([]);
  useEffect(() => {
    let token = sessionStorage.getItem('token');
    setAuthToken(token);
    axios.get(domain + '/api/game/room/').then((res) => {
      setGameRooms(res.data);
    });
    var reloadPeriodically = setInterval(() => {
      axios.get(domain + '/api/game/room/').then((res) => {
        setGameRooms(res.data);
      });
    }, 2 * 1000);
    return () => {
      clearInterval(reloadPeriodically);
    };
  }, []);
  const createRoom = () => {
    axios.post(domain + '/api/game/room/').then((res) => {
      if (res) {
        console.log(res);
        history.push(`/game/${res.data._id}`);
      }
    });
  };
  const deleteAllrooms = () => {
    axios.delete(domain + '/api/game/room/').then((res) => {
      setGameRooms([]);
    });
  };
  return (
    <div>
      <div
        className='btn btn-primary'
        onClick={() => {
          createRoom();
        }}
      >
        Create new Room
      </div>
      {/* <div
        className='btn btn-danger'
        onClick={() => {
          deleteAllrooms();
        }}
      >
        Delete All Rooms
      </div> */}
      <ul className='roomList'>
        {gameRooms.map((room, index) => (
          <li key={room.id}>
            <Link to={`/game/${room._id}`}>
              <h3>Game Room {index + 1}</h3>
              <p>Host: {room.host.name}</p>
              <p>Id: {room._id}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default withRouter(RoomList);
