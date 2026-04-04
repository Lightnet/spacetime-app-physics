//-----------------------------------------------
// module design to keep it simple
//-----------------------------------------------
import { ScheduleAt } from 'spacetimedb';
import { schema, table, t, SenderError  } from 'spacetimedb/server';
import { user } from './models/table_user';
import { message } from './models/table_message';
import { 
  player, 
  entity,
  transform3d,
  body3d,
  // box,
  // sphere,
  physicsObjects,
} from './models/table_entity';
import { PlayerInput } from './models/table_contoller';
import * as THREE from 'three'
//-----------------------------------------------
// TABLE SimulationTick
// typescript circular dependency files
//   - must place in single file with simulation tick reducer function
//   - note that if there change in reducer function the data must be delete
//-----------------------------------------------
export const SimulationTick = table({ 
  name: 'simulation_tick',
  // scheduled: (): any => update_simulation_tick
  scheduled: (): any => update_simulation_tick_collision3d
},{
  scheduled_id: t.u64().primaryKey().autoInc(),
  scheduled_at: t.scheduleAt(),
  last_tick_timestamp:t.timestamp(),
  dt:t.f32(),
});
//-----------------------------------------------
// SPACETIMEDB SCHEMA TABLES
//-----------------------------------------------
const spacetimedb = schema({
  user,
  message,
  player,
  entity,
  transform3d,
  body3d,
  // box,
  // sphere,
  // Transform3D,
  PlayerInput,
  SimulationTick,
  // 
  physicsObjects,
  // SampleEntity,
  // SampleBox,
  // SampleSphere,
});
//-----------------------------------------------
// update simulation tick
//-----------------------------------------------
export const update_simulation_tick_collision3d = spacetimedb.reducer({ arg: SimulationTick.rowType }, (ctx, { arg }) => {
  // Invoked automatically by the scheduler
  // arg.message, arg.scheduled_at, arg.scheduled_id
  // console.log('update_simulation_tick');
  // console.log(arg);
  const now = ctx.timestamp;                    // current wall time
  let dt = 0;                       // we'll compute this
  if (arg.last_tick_timestamp) {        // not first tick
    const elapsed_ms = now.since(arg.last_tick_timestamp).millis;
    // console.log("elapsed_ms: ", elapsed_ms);
    dt = elapsed_ms / 1000.0;       // in seconds
  } else {
    dt = 0.033;                     // first tick guess / fallback
  }
  const speed = 5.0; // units per second

  // console.log("PlayerInput coutns: ",ctx.db.PlayerInput.count());
  for (const input_player of ctx.db.PlayerInput.iter()){
    // console.log(input_player);
    // console.log("move?")
    if(!input_player){
      return;
    }
    //do not use ctx.sender here...
    const _player = ctx.db.player.identity.find(input_player.identity);
    // console.log("_player: ",_player)
    // console.log("_player: ",_player?.entityId?.to)
    if(_player){
      if(_player.entityId){
        // console.log(_player.entityId.toString())
        const transform = ctx.db.transform3d.entityId.find(_player.entityId);
        if(!transform) return;

        // ── Apply input acceleration ───────────────────────────────────────
        if(input_player.directionX == 0){
          transform.velocity.x = 0;
        }else{
          transform.velocity.x += input_player.directionX * speed * dt;
        }
        if(input_player.directionY == 0){
          transform.velocity.z = 0;
        }else{
          transform.velocity.z += input_player.directionY * speed * dt;
        }

        // ── Movement prediction + collision 
        let newPos = new THREE.Vector3(
          transform.position.x + transform.velocity.x * dt,
          transform.position.y + transform.velocity.y * dt,
          transform.position.z + transform.velocity.z * dt
        );

        // update position for table entity
        transform.position.x = newPos.x;
        transform.position.y = newPos.y;
        transform.position.z = newPos.z;
        // console.log("z:", transform.velocity.z)
        // console.log("x: ", transform.position.x," z: ", transform.position.z)
        // update entity position
        ctx.db.transform3d.entityId.update(transform);

      }
    }
    if(_player){
      // if(_player.entityId){
      //   // console.log("test")
      //   const player_entity = ctx.db.entity.id.find(_player.entityId)
      //   if(!player_entity){
      //     return;
      //   }
      //   // console.log("move")
      //   // ── Apply input acceleration ───────────────────────────────────────
      //   if(input_player.directionX == 0){
      //     player_entity.velocity.x = 0;
      //   }else{
      //     player_entity.velocity.x += input_player.directionX * speed * dt;
      //   }
      //   if(input_player.directionY == 0){
      //     player_entity.velocity.z = 0;
      //   }else{
      //     player_entity.velocity.z += input_player.directionY * speed * dt;
      //   }
      //   // ── Movement prediction + collision 
      //   let newPos = new THREE.Vector3(
      //     player_entity.position.x + player_entity.velocity.x * dt,
      //     player_entity.position.y + player_entity.velocity.y * dt,
      //     player_entity.position.z + player_entity.velocity.z * dt
      //   );
      //   // check if the point, box, sphere shape
      //   const selfPos = newPos;
      //   const selfIsSphere = ctx.db.sphere.entityId.find(player_entity.id) !== null;
      //   const selfIsBox = ctx.db.box.entityId.find(player_entity.id) !== null;
      //   if(selfIsSphere){
      //     // console.log("sphere: detect");
      //   }
      //   if(selfIsBox){
      //     // console.log("selfIsBox: detect");
      //   }
      //   // update position for table entity
      //   player_entity.position.x = newPos.x;
      //   player_entity.position.y = newPos.y;
      //   player_entity.position.z = newPos.z;
      //   // console.log("z:", player_entity.velocity.z)
      //   // update entity position
      //   ctx.db.entity.id.update(player_entity);
      // }
    }
  }
  // ── Save the time for next call ─────────────────────────────────────────
  ctx.db.SimulationTick.scheduled_id.update({
    ...arg,
    last_tick_timestamp: now,
    dt:dt,
    // accumulator: arg.accumulator   // if using fixed style
  });
});
//-----------------------------------------------
// spacetimedb init
//-----------------------------------------------
export const init = spacetimedb.init(ctx => {
  console.log("[ ====::: INIT SPACETIMEDB APP PHYSICS:::==== ]");
  ctx.db.SimulationTick.insert({
    scheduled_id: 0n,
    // scheduled_at: ScheduleAt.interval(5_000_000n),// Schedule to run every 5 seconds (5,000,000 microseconds)
    scheduled_at: ScheduleAt.interval(33_333n),// Schedule to run every 1 seconds (1,000,000 microseconds)
    last_tick_timestamp: ctx.timestamp,
    dt:0.0,
  });
});
//-----------------------------------------------
// spacetimedb onConnect
//-----------------------------------------------
export const onConnect = spacetimedb.clientConnected(ctx => {
  const user = ctx.db.user.identity.find(ctx.sender);
  console.log("SENDER: ",ctx.sender);
  if (user) {
    ctx.db.user.identity.update({ ...user, online: true });
  } else {
    ctx.db.user.insert({
      identity: ctx.sender,
      name: undefined,
      online: true,
    });
  }
});
//-----------------------------------------------
// spacetimedb onDisconnect
//-----------------------------------------------
export const onDisconnect = spacetimedb.clientDisconnected(ctx => {
  const user = ctx.db.user.identity.find(ctx.sender);
  if (user) {
    ctx.db.user.identity.update({ ...user, online: false });
  } else {
    console.warn(
      `Disconnect event for unknown user with identity ${ctx.sender}`
    );
  }
});
//-----------------------------------------------
// EXPORT SPACETIMEDB
//-----------------------------------------------
export default spacetimedb;
// console.log("end set up: spacetime-app-physics");
