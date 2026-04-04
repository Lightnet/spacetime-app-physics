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

function checkAABBOverlap3D(
  selfPos:THREE.Vector3,

){

}


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

        const body = ctx.db.body3d.entityId.find(_player.entityId);
        // if(!body) return;
        // console.log(body?.params?.tag);

        const selfPos = newPos;       // default if there no shape body
        let selfIsSphere = null;      // sphere params
        let selfIsBox = null;         // box params
        if(body?.params?.tag === 'Box'){
          selfIsBox = body?.params?.value;
        }
        if(body?.params?.tag === 'Sphere'){
          selfIsSphere = body?.params?.value;
        }
        // if(selfIsBox){
          // console.log("Box", selfIsBox)
          // console.log("Box width: ", selfIsBox.width)
        // } // Box { width: 1, height: 1, depth: 1 }
        // if(selfIsSphere){console.log("Sphere", selfIsSphere)} // Sphere { radius: 0.5 }

        // // nope not best to handle collision
        // for (const entity of ctx.db.entity.iter()){
        //   if(entity.id == _player.entityId){// skip this player current own collision.
        //     continue;
        //   }
        //   const otherBody = ctx.db.body3d.entityId.find(entity.id)
        //   if(otherBody){
        //   }
        // }

        let otherBox;
        let otherSphere;
        // best to handle collision since table has collision it.
        for (const otherBody of ctx.db.body3d.iter()){
          // need string to check not uuid which fail to skip...
          if(otherBody.entityId.toString() == _player.entityId.toString()) continue;//skip self collision
          // console.log("otherBody.entityId:", otherBody.entityId.toString(), " otherBody.entityId:", otherBody.entityId.toString());
          const otherTransform = ctx.db.transform3d.entityId.find(otherBody.entityId)
          if(otherTransform){
            if(otherBody.params.tag === 'Box'){
              otherBox = otherBody.params.value;
            }
            if(otherBody.params.tag === 'Sphere'){
              otherSphere = otherBody.params.value;
            }
            //check box collision for now.
            if(selfIsBox && otherBox){

              let otherPos = new THREE.Vector3(
                otherTransform.position.x,
                otherTransform.position.y,
                otherTransform.position.z
              )
              let otherSize = new THREE.Vector3(
                otherBox.width,
                otherBox.height,
                otherBox.depth
              )

              const box1 = new THREE.Box3();
              box1.setFromCenterAndSize(newPos,new THREE.Vector3(selfIsBox.width,selfIsBox.height,selfIsBox.depth))

              const box2 = new THREE.Box3();
              box2.setFromCenterAndSize(otherPos, otherSize)

              if(box1.intersectsBox(box2)){
                console.log("Boom! Collision.");
              }

            }
          }
        }

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
