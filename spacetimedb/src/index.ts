//-----------------------------------------------
// server api module
//-----------------------------------------------
import {
  BoxParams,
  Shape,
} from './models/table_entity';

import spacetimedb, { init, onConnect, onDisconnect, update_simulation_tick_collision3d } from './module';
import { set_name } from './reducers/reducer_user';
import { 
  set_player_position, 
  // create_obstacle, 
  // update_obstacle_position_id, 
  // delete_obstacle,
  // create_box,
  // create_sphere,
  create_player_transform3d,
  delete_player_transform3d,
  create_player_box,
  create_player_sphere,
  delete_player_body,
  // delete_player_box,
  // create_player_sphere,
  // delete_player_sphere,
  // create_player_point,
  // delete_player_point,
  add_physics_object,
  // ,
} from './reducers/reducer_entity';
import { update_input } from './reducers/reducer_controller';
import {
  my_player,
  my_boxes,
} from './views/view_entity';

import { test_collision } from './reducers/reducer_test';

export {
  //spacetimedb
  init,
  onConnect,
  onDisconnect,
  // user
  set_name,
  // input
  update_input,
  // physics
  update_simulation_tick_collision3d,
  // entity
  set_player_position,
  create_player_transform3d,
  delete_player_transform3d,
  create_player_box,
  create_player_sphere,
  delete_player_body,
  
  // create_obstacle,
  // create_box,
  // delete_player_box,
  // create_sphere,
  // update_obstacle_position_id,
  // delete_obstacle,
  // create_player_sphere,
  // delete_player_sphere,
  // create_player_point,
  // delete_player_point,

  add_physics_object,
  // view 
  my_player,
  my_boxes,
  // type:
  // BoxParams,// nope
  // Shape, // nope
  // test
  test_collision,
}


//-----------------------------------------------
// EXPORT SPACETIMEDB
//-----------------------------------------------
export default spacetimedb;
// console.log("end set up: spacetime-app-physics");
