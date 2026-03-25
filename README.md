# spacetime-app-physics

# Licence: MIT

# SpaceTimeDB:
- spacetime cli 2.1.0
- npm spacetimedb 2.1.0

# Program Languages:
- Typescript
- Javascript

# Packages:
- spacetimedb 2.1.0
- three 0.183.2
- typescript 5.9.3
- vite 8.0.0
- vanjs 1.6.0

# Game Features:
- input move ( simple )
- entity ( simple)
- collision 3d ( simple )

# Notes:
- This is just a prototype test.
- Simple collision.
- Need simple physics collision.

# Information:
  Work in progress.

  This topic focus on database, server, typescript, javascript and client browser.
  
  Using SpaceTimeDB, Bun js for web server and browser client to keep things simple to run applications. Web server to host site for statics files.
  
  SpaceTimeDB is is all one for tools, database and server with module plugins. There is command line does have tools and template projects, export and import web assembly as server module api.

  SpaceTimeDB use web socket for the browser client. Reason is that database will listen to table names. Which sent to filter data to client. As well api call from server module to use function names.

# Physics:
  Work in progress.

  There are two ways. One is using the database as variable and logics. Schedule table will loop update tables. Another way is using the packages example 2d box to init and loop but required resetup every time. Or store data in sandbox.
  
  Note I have no tested couple methods. Thinking of table as array to handle objects.

  Will keep the physics simple by using the min and max bounding box checks.

  It will not use vertices checks which add more cpu load.

  - https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection


# Files / Url:
- threesql.html
  - Using the local sql to emulator quick test. 
- index
  - simple collision test from server to client.


## Collision checks:
- Axis-Aligned Bounding Box (AABB)
- Oriented Bounding Box (OBB)

```
```

# SpaceTimeDB Features:
- table
- Schedule Table
  - loop
  - one time trigger
  - time 
- Event Table
- Procedure 
  - for use access out for http fetch request like api auth.
  - table can use but require call func with in to run it.
- Reducers
  - use for client to access action
  - access table
- views
  - read only
  - it can filter out for player can see table data
- Lifecycle
 - server module
    - init
    - onConnect 
    - onDisconnect 
- https://spacetimedb.com/docs/databases/cheat-sheet

# Set Up and Configs:

  SpaceTimeDB set up for server and database application.

## start app:
```
spacetime start
```
- start database and server application.
- note it need to run on terminal.

## spacetime publish server mode: 
```
spacetime publish --server local --module-path spacetimedb spacetime-app-physics
```
- run spacetime to push module app
- This support Typescript to push to module to run server for clients to access web socket.

## spacetime log:
```
spacetime logs -s local -f spacetime-app-game 
```
- Note this run another terminal to access spacetimedb client to log for database name.
- log datbase spacetime-app-game debug 

## spacetime export client module:
```
spacetime generate --lang typescript --out-dir src/module_bindings --module-path spacetimedb
```
- generate typescript for client
- note this export typescript.
- it can be use for export to client

## spacetime database delete:
  Note that clear database in case of update change on tables that error.
```
spacetime publish --server local --module-path spacetimedb spacetime-app-physics --delete-data
```
``` 
spacetime publish --server local spacetime-app-physics --delete-data
```
# spacetime SQL:
```
spacetime sql --server local spacetime-app-physics "SELECT * FROM user"
```
```
spacetime sql --server local spacetime-app-physics "SELECT * FROM message"
```
```
spacetime sql --server local spacetime-app-physics "SELECT * FROM player_input"
```
```
spacetime sql --server local spacetime-app-physics "SELECT * FROM simulation_tick"
```

# Refs:
- https://spacetimedb.com/docs/functions/views
- https://spacetimedb.com/docs/functions/procedures
- https://spacetimedb.com/docs/tutorials/chat-app/
- 

# Notes:
- Anything is possible to build on database and server module.
- 