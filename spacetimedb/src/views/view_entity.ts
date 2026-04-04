// 

import { schema, table, t, SenderError, Range  } from 'spacetimedb/server';
import spacetimedb from '../module';
import { entity, player, transform3d } from '../models/table_entity';

export const my_player = spacetimedb.view(
  { name: 'my_player', public: true },
  t.option(transform3d.rowType),
  (ctx) => {
    const _player = ctx.db.player.identity.find(ctx.sender);
    if(_player && _player?.entityId){
      return ctx.db.transform3d.entityId.find(_player?.entityId) ?? undefined;
    }
    return undefined;
    // return ctx.db.player.identity.find(ctx.sender) ?? undefined;
  }
);

export const my_boxes = spacetimedb.view(
  { name: 'my_boxes', public: true },
  // t.option(entity.rowType),
  t.array(entity.rowType),
  (ctx) => {
    // const _player = ctx.db.player.identity.find(ctx.sender);
    // if(_player && _player?.entityId){
    //   return ctx.db.entity.id.find(_player?.entityId) ?? undefined;
    // }
    return ctx.from.entity.leftSemijoin(ctx.from.body3d, (p, m)=> p.id.eq(m.entityId)) ?? [];
    // return undefined;
  }
);