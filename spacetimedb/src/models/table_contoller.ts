//-----------------------------------------------
// TABLE INPUT
//-----------------------------------------------
// import { ScheduleAt } from 'spacetimedb';
import { schema, table, t, SenderError  } from 'spacetimedb/server';
//-----------------------------------------------
// player input
//-----------------------------------------------
export const PlayerInput = table(
  { name: 'player_input', public: true },
  {
    identity: t.identity().primaryKey(),
    directionX: t.f32().default(0),   // -1..1 left/right (or WASD/analog)
    directionY: t.f32().default(0),   // -1..1 forward/back (for top-down 2D)
    directionZ: t.f32().default(0),   //
    jump: t.bool(),        // pressed this tick?
    lastUpdated: t.timestamp(),  // ctx.timestamp millis, for optional expiry
  }
);
//-----------------------------------------------
// mouse input
//-----------------------------------------------
export const mouseInput = table(
  { name: 'mouse_input', public: true },
  {
    identity: t.identity().primaryKey(),
    x: t.f32(),                     // -1..1 left/right (or WASD/analog)
    y: t.f32(),                     // -1..1 forward/back (for top-down 2D)
    left: t.bool(),                 //
    right: t.bool(),                //
    middle: t.bool(),               //
    lastUpdated: t.timestamp(),  // ctx.timestamp millis, for optional expiry
  }
);



