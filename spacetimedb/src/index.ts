// server api

import { ScheduleAt } from 'spacetimedb';
import { schema, table, t, SenderError  } from 'spacetimedb/server';
// import { 
//   // nanoid 
//   customAlphabet
// } from 'nanoid';
// const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);
console.log("spacetime-app-physics");

const PLAYER_RADIUS_XZ = 0.45;     // horizontal radius
const PLAYER_RADIUS_Y  = 0.45;     // vertical (can be 0.9–1.0 if capsule-like)

function checkAABBOverlap3D(
  px: number, py: number, pz: number,           // player center
  ox: number, oy: number, oz: number,           // obstacle center
  hw: number, hh: number, hd: number            // obstacle half-sizes: x,y,z
): boolean {
  return (
    px + PLAYER_RADIUS_XZ > ox - hw &&
    px - PLAYER_RADIUS_XZ < ox + hw &&
    py + PLAYER_RADIUS_Y  > oy - hh &&
    py - PLAYER_RADIUS_Y  < oy + hh &&
    pz + PLAYER_RADIUS_XZ > oz - hd &&
    pz - PLAYER_RADIUS_XZ < oz + hd
  );
}


const Coordinates3D = t.object('Coordinate3D', {
  x: t.f64(),
  y: t.f64(),
  z: t.f64(),
});

const user = table(
  { 
    name: 'user', 
    public: true,
  },
  {
    identity: t.identity().primaryKey(),
    name: t.string().optional(),
    online: t.bool(),
  }
);

const message = table(
  { name: 'message', public: true },
  {
    senderId: t.identity(),
    sent: t.timestamp(),
    text: t.string(),
  }
);

const PlayerInput = table(
  { name: 'player_input', public: true },
  {
    identity: t.identity().primaryKey(),
    directionX: t.f32(),   // -1..1 left/right (or WASD/analog)
    directionY: t.f32(),   // -1..1 forward/back (for top-down 2D)
    jump: t.bool(),        // pressed this tick?
    lastUpdated: t.timestamp(),  // ctx.timestamp millis, for optional expiry
  }
);

const Entity = table(
  { name: 'entity', public: true },
  {
    identity: t.identity().primaryKey(),
    position:Coordinates3D,
    velocity:Coordinates3D,
    size:Coordinates3D,
    direction: Coordinates3D,
  }
);

const Obstacle3D = table({
  name: 'obstacle3d', public: true
},{
  id: t.u64().primaryKey().autoInc(),
  position: Coordinates3D,
  size:Coordinates3D
});

// const Transform3D = table(
//   { name: 'transform3d', public: true },
//   {
//     identity: t.identity().primaryKey(),
//     position:Coordinates3D,
//     velocity:Coordinates3D,
//     size:Coordinates3D,
//   }
// );

//-----------------------------------------------
// TABLE SimulationTick
//-----------------------------------------------
const SimulationTick = table({ 
  name: 'simulation_tick',
  // scheduled: (): any => update_simulation_tick
  scheduled: (): any => update_simulation_tick_collision3d
},{
  scheduled_id: t.u64().primaryKey().autoInc(),
  scheduled_at: t.scheduleAt(),
  // lastTickTs: t.u64(),                   // ctx.timestamp.millis of last tick ???
  last_tick_timestamp:t.timestamp(),
  dt:t.f32(),
});
//-----------------------------------------------
// SPACETIMEDB SCHEMA TABLES
//-----------------------------------------------
const spacetimedb = schema({
  user,
  message,
  Entity,
  Obstacle3D,
  // Transform3D,
  PlayerInput,
  SimulationTick,
});

function validateName(name: string) {
  if (!name) {
    throw new SenderError('Names must not be empty');
  }
}
//-----------------------------------------------
// SET USER NAME
//-----------------------------------------------
export const set_name = spacetimedb.reducer({ name: t.string() }, (ctx, { name }) => {
  // console.info("Name: ",name);
  validateName(name);
  const user = ctx.db.user.identity.find(ctx.sender);
  if (!user) {
    throw new SenderError('Cannot set name for unknown user');
  }
  ctx.db.user.identity.update({ ...user, name });
});
function validateMessage(text: string) {
  if (!text) {
    throw new SenderError('Messages must not be empty');
  }
}
//-----------------------------------------------
// SEND MESSAGE
//-----------------------------------------------
export const send_message = spacetimedb.reducer({ text: t.string() }, (ctx, { text }) => {
  validateMessage(text);
  console.info(`User ${ctx.sender}: ${text}`);
  ctx.db.message.insert({
    senderId: ctx.sender,
    text,
    sent: ctx.timestamp,
  });
});
//-----------------------------------------------
// UPDATE SIMULATION TICK TEST
//-----------------------------------------------
export const update_simulation_tick = spacetimedb.reducer({ arg: SimulationTick.rowType }, (ctx, { arg }) => {
  // Invoked automatically by the scheduler
  // arg.message, arg.scheduled_at, arg.scheduled_id
  // console.log('update_simulation_tick');
  // console.log(arg);

  const fixedDtMs = 50;           // your fixed tick rate
  const dt = fixedDtMs / 1000;    // in seconds
  // console.log("update_simulation_tick");
  // console.log("player input counts:", ctx.db.PlayerInput.count());

  for (const player of ctx.db.PlayerInput.iter()){
    // console.log(player);
    // console.log(player.identity.toHexString(), " x:", player.directionX, " y:", player.directionY, " Jump:", player.jump);
    // console.log("player input >>", " x:", player.directionX, " y:", player.directionY, " Jump:", player.jump);

    const entity = ctx.db.Entity.identity.find(player.identity);
    // const entity = ctx.db.Transform3D.identity.find(player.identity);
    // console.log(entity);
    if(entity){

      const speed = 5.0; // units per second
      if(player.directionX == 0){
        entity.velocity.x = 0;
      }else{
        entity.velocity.x += player.directionX * speed * dt;
      }

      if(player.directionY == 0){
        entity.velocity.z = 0;
      }else{
        entity.velocity.z += player.directionY * speed * dt;
      }
      
      // Integrate position
      entity.position.x += entity.velocity.x * dt;
      entity.position.z += entity.velocity.z * dt;

      //update data from table row match
      ctx.db.Entity.identity.update(entity)
      // ctx.db.Entity.identity.update({
      //   ...entity,
      // })

      // console.log("Position x: ", entity.position.x , " z: ", entity.position.z );

    }else{// if does not exist create tmp
       ctx.db.Entity.insert({
         identity: player.identity,
         position: { x: 0.0, y: 0.0, z: 0.0 },
         velocity: { x: 0.0, y: 0.0, z: 0.0 },
         size: { x: 1.0, y: 1.0, z: 1.0 },
         direction: { x: 1.0, y: 1.0, z: 1.0 },
       });
    }
  }
});


//-----------------------------------------------
// UPDATE SIMULATION TICK COLLISION TEST
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

  for (const input_player of ctx.db.PlayerInput.iter()){

    if(!input_player){
      return;
    }

    // console.log("delta time: ", dt);
    const entity = ctx.db.Entity.identity.find(input_player.identity);
    // console.log(entity);
    // console.log(entity?.x, " : ", entity?.y);

    if(entity){

      const speed = 5.0; // units per second

      // ── Apply input acceleration ───────────────────────────────────────
      if(input_player.directionX == 0){
        entity.velocity.x = 0;
      }else{
        entity.velocity.x += input_player.directionX * speed * dt;
      }
      if(input_player.directionY == 0){
        entity.velocity.z = 0;
      }else{
        entity.velocity.z += input_player.directionY * speed * dt;
      }
      
      // ── Movement prediction + collision ────────────────────────────────────────
      let newPos = {
        x: entity.position.x + entity.velocity.x * dt,
        y: entity.position.y + entity.velocity.y * dt,
        z: entity.position.z + entity.velocity.z * dt,
      };

      let collided = false;

      for (const obs of ctx.db.Obstacle3D.iter()) {
        const hx = obs.size.x / 2;
        const hy = obs.size.y / 2;
        const hz = obs.size.z / 2;

        if (!checkAABBOverlap3D(
          newPos.x, newPos.y, newPos.z,
          obs.position.x, obs.position.y, obs.position.z,
          hx, hy, hz
        )) {
          continue;
        }

        collided = true;

        // ── Compute signed penetration on each axis ───────────────────────
        const penX = [
          (newPos.x + PLAYER_RADIUS_XZ) - (obs.position.x - hx),   // left/negative x
          (obs.position.x + hx) - (newPos.x - PLAYER_RADIUS_XZ),   // right/positive x
        ];
        const penY = [
          (newPos.y + PLAYER_RADIUS_Y)  - (obs.position.y - hy),
          (obs.position.y + hy)  - (newPos.y - PLAYER_RADIUS_Y),
        ];
        const penZ = [
          (newPos.z + PLAYER_RADIUS_XZ) - (obs.position.z - hz),
          (obs.position.z + hz) - (newPos.z - PLAYER_RADIUS_XZ),
        ];

        // Pick the smallest **positive** penetration
        let minPen = Infinity;
        let bestAxis: 'x' | 'y' | 'z' | null = null;
        let bestSign = 0; // which side

        // X
        if (penX[0] > 0 && penX[0] < minPen) { minPen = penX[0]; bestAxis = 'x'; bestSign = -1; }
        if (penX[1] > 0 && penX[1] < minPen) { minPen = penX[1]; bestAxis = 'x'; bestSign = +1; }
        // Y
        if (penY[0] > 0 && penY[0] < minPen) { minPen = penY[0]; bestAxis = 'y'; bestSign = -1; }
        if (penY[1] > 0 && penY[1] < minPen) { minPen = penY[1]; bestAxis = 'y'; bestSign = +1; }
        // Z
        if (penZ[0] > 0 && penZ[0] < minPen) { minPen = penZ[0]; bestAxis = 'z'; bestSign = -1; }
        if (penZ[1] > 0 && penZ[1] < minPen) { minPen = penZ[1]; bestAxis = 'z'; bestSign = +1; }

        if (bestAxis && minPen < Infinity) {
          // ── Correct only one axis (the one with least penetration) ─────
          if (bestAxis === 'x') {
            newPos.x = entity.position.x;           // full revert, or: -= minPen * bestSign
            entity.velocity.x *= 0.1;               // strong damping
          } else if (bestAxis === 'y') {
            newPos.y = entity.position.y;
            entity.velocity.y *= 0.1;
            // If you later add gravity: can set velocity.y = 0 when hitting floor (bestSign < 0)
          } else if (bestAxis === 'z') {
            newPos.z = entity.position.z;
            entity.velocity.z *= 0.1;
          }
        }

        // You can continue checking other obstacles (multi-collision)
        // or break; if you want to handle only first collision per tick
      }

      // ── Commit new position ─────────────────────────────────────────────
      entity.position.x = newPos.x;
      entity.position.y = newPos.y;
      entity.position.z = newPos.z;
      
      // update player position
      ctx.db.Entity.identity.update({ ...entity });

    }else{
      ctx.db.Entity.insert({
        identity: ctx.sender,
        position:{x: 0, y: 0, z: 0},
        velocity:{x: 0, y: 0, z: 0},
        size:{x: 1, y: 1, z: 1},
        direction:{x: 0, y: 0, z: 0},
      })
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
// PLAYER INPUT
//-----------------------------------------------
// Client calls this to send/update their input
export const update_input = spacetimedb.reducer(
  {
    x: t.f32(),
    y: t.f32(),
    jump: t.bool(),
  },
  (ctx, args) => {
    const id = ctx.sender; // or ctx.caller if different
    // console.log("input id: ", id);
    // if (!id) throw new SenderError("Not authenticated");
    if (!id) return;

    const player_input = ctx.db.PlayerInput.identity.find(id);
    if(player_input){// update
      // console.log("update input x: ", args.x, " y: ", args.y, " Jump:", args.jump);
      ctx.db.PlayerInput.identity.update({...player_input,
        directionX:args.x,
        directionY:args.y,
        jump:args.jump
      });
    }else{// create
      // console.log("create input");
      ctx.db.PlayerInput.insert({
        identity: id,
        directionX: args.x,
        directionY: args.y,
        jump: args.jump,
        lastUpdated: ctx.timestamp,
      });
    }
  }
);
//-----------------------------------------------
// TEST FOO
//-----------------------------------------------
export const test_foo = spacetimedb.reducer({},(ctx, args) => {
  console.log("test")
});
//-----------------------------------------------
// SET PLAYER POSITION
//-----------------------------------------------
export const set_player_position = spacetimedb.reducer({
  x:t.f64(),
  y:t.f64(),
  z:t.f64(),
},(ctx, args) => {
  const entity = ctx.db.Entity.identity.find(ctx.sender);
  console.log("entity: ", entity);
  if(entity){
    entity.position.x = 0;
    entity.position.y = 0;
    entity.position.z = 0;
    ctx.db.Entity.identity.update(entity);
  }
});
//-----------------------------------------------
// 
//-----------------------------------------------



//-----------------------------------------------
// SPAWN OBSTACLE
//-----------------------------------------------
export const create_obstacle = spacetimedb.reducer({
  x:t.f64(),
  y:t.f64(),
  z:t.f64(),
},(ctx, args) => {
  // console.log("create obstacle");
  ctx.db.Obstacle3D.insert({
    position: {x:args.x,y:args.y,z:args.z},
    size: {x:1,y:1,z:1},
    id: 0n
  });
});
//-----------------------------------------------
// UPDATE OBSTACLE
//-----------------------------------------------
export const update_obstacle_position_id = spacetimedb.reducer({
  id:t.u64(),
  x:t.f64(),
  y:t.f64(),
  z:t.f64(),
},(ctx, args) => {
  // console.log("update obstacle")
  let obstacle = ctx.db.Obstacle3D.id.find(args.id);
  if(obstacle){
    ctx.db.Obstacle3D.id.update({...obstacle,
      position: {x:args.x,y:args.y,z:args.z}
    });
  }
});
//-----------------------------------------------
// DELETE OBSTACLE
//-----------------------------------------------
export const delete_obstacle = spacetimedb.reducer({
  id: t.u64()
},(ctx, {id})=>{
  console.log("delete id:", id);
  ctx.db.Obstacle3D.id.delete(id);
})


//-----------------------------------------------
// init
//-----------------------------------------------
export const init = spacetimedb.init(ctx => {
  console.log("===============INIT SPACETIMEDB APP NAME:::=========");
  ctx.db.SimulationTick.insert({
    scheduled_id: 0n,
    // scheduled_at: ScheduleAt.interval(5_000_000n),// Schedule to run every 5 seconds (5,000,000 microseconds)
    scheduled_at: ScheduleAt.interval(33_333n),// Schedule to run every 1 seconds (1,000,000 microseconds)
    last_tick_timestamp: ctx.timestamp,
    dt:0.0,
  });
});
//-----------------------------------------------
// onConnect
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
// onDisconnect
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
