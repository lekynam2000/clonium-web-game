import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import Register from '../auth/Register';
import Login from '../auth/Login';
import Alert from '../layout/Alert';
import NotFound from '../layout/NotFound';
import RoomList from '../game/RoomList';
import Game from '../game/Game';
import PrivateRoute from '../routing/PrivateRoute';
export const Routes = (props) => {
  return (
    <section className='container'>
      <Alert />
      <Switch>
        <Route exact path='/'>
          <Redirect to='/rooms' />
        </Route>
        <Route exact path='/register' component={Register} />
        <Route exact path='/login' component={Login} />
        <PrivateRoute exact path='/rooms' component={RoomList} />
        <PrivateRoute exact path='/game/:id' component={Game} />
        <Route component={NotFound} />
      </Switch>
    </section>
  );
};
