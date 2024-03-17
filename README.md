# TaskMaster

This is a minimalistic to-do app in a form of quest log from video game. It divides task into three categories: main quests, side quests and recurring quests. I started creating this app in February 2024 to practise my skills.

### Tech stack

`TypeScript` `CSS` `React` `TS-Node 10.9.2` `Express` `Neo4j`

### Description

Current version contains only app's backend. It is a simple CRUD for quests and account operations (authentication, deletion etc.).

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
