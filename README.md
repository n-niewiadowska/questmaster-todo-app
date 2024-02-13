# TaskMaster

This is a minimalistic to-do app in a form of quest log from video game. It divides task into three categories: main quests, side quests and recurring quests.

### Tech stack

`TypeScript` `CSS` `React` `Node` `Express` `Neo4j`

### Description

Right now, only backend of the app is finished. It contains user's operations such as authentication and account deletion, and simple CRUD for quests.

### Run

Current version of the project requires Neo4j Desktop.

1. In `server`, create `.env` file and fill the configuration below with your own addresses:

```env
USER=
PASSWORD=
URI=
DB=
PORT=
```

2. Install dependencies

For server:

```sh
cd server
npm i bcrypt body-parser cookie-parser cors dotenv express neo4j-driver
npm i --save-dev @types/bcrypt @types/cookie-parser @types/cors @types/express @types/node ts-node typescript
```

Also make sure you have ts-node installed globally to run the script.

3. Open your DBMS in Neo4j Desktop.

4. Run server with `ts-node server.ts` or `npm start`.
