// 

import { schema, table, t, SenderError  } from 'spacetimedb/server';

export const users = table(
  { 
    name: 'users', 
    public: true,
  },
  {
    identity: t.identity().primaryKey(),
    name: t.string().optional(),
    online: t.bool(),
  }
);



