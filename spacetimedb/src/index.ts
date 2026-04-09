//-----------------------------------------------
// server api module
//-----------------------------------------------
// import {
//   BoxParams,
//   Shape,
// } from './models/table_entity';

import spacetimedb, { init, onConnect, onDisconnect, update_simulation_tick_collision3d } from './module';
import { set_name } from './reducers/reducer_user';
import { 
  create_entity,
  delete_entity,
  create_player,
  delete_player,
  set_player_position,
  create_player_transform3d,
  create_entity_transform3d,
  set_transform3d_position,
  remove_transform3d,
  create_entity_box,
  create_entity_sphere,
  remove_entity_body3d,
  //
  create_entity_box_test,
  // ,
} from './reducers/reducer_entity';
import { update_input } from './reducers/reducer_controller';
import {
  my_player,
  my_boxes,
  scene_transform3d,
} from './views/view_entity';

import { 
  test_collision,
  // update_tick_test,
} from './reducers/reducer_test';
//-----------------------------------------------
// EXPORT
//-----------------------------------------------
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
  create_entity,
  delete_entity,
  create_player,
  delete_player,
  set_player_position,
  create_player_transform3d,
  create_entity_transform3d,
  set_transform3d_position,
  remove_transform3d,
  create_entity_box,
  create_entity_sphere,
  remove_entity_body3d,
  //...
  create_entity_box_test,
  // add_physics_object,
  // view 
  my_player,
  my_boxes,
  scene_transform3d,
  // type:
  // BoxParams,// nope
  // Shape, // nope
  // test
  test_collision,
  // update_tick_test,
}
// function testimport(){
//   import('./reducers/reducer_test').then(m => {
//     // m.update_tick_test
//   });
//   // console.log(test);
// }

// testimport();

//-----------------------------------------------
// EXPORT SPACETIMEDB
//-----------------------------------------------
export default spacetimedb;
// console.log("end set up: spacetime-app-physics");
