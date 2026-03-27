// server api

import { ScheduleAt } from 'spacetimedb';
import { schema, table, t, SenderError  } from 'spacetimedb/server';

import spacetimedb, { init, onConnect, onDisconnect, update_simulation_tick_collision3d } from './module';

import { set_name } from './reducers/reducer_user';

import { set_player_position, create_obstacle, update_obstacle_position_id, delete_obstacle } from './reducers/reducer_entity'

import { update_input } from './reducers/reducer_controller';

export {
  init,
  onConnect,
  onDisconnect,
  set_name,

  update_input,
  update_simulation_tick_collision3d,

  // entity
  set_player_position,
  create_obstacle,
  update_obstacle_position_id,
  delete_obstacle,
}


//-----------------------------------------------
// EXPORT SPACETIMEDB
//-----------------------------------------------
export default spacetimedb;
// console.log("end set up: spacetime-app-physics");
