import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import neo4j from "neo4j-driver";
import userRoutes from "./routes/userRoutes";
import questRoutes from "./routes/questRoutes";
require("dotenv").config({ path: "./.env" });

const app = express();
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

const URI = process.env.URI || ""; 
const USER = process.env.USER || "";
const PASSWORD = process.env.PASSWORD || "";
const DB = process.env.DB || "";
const PORT = process.env.PORT || 5000;

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
app.locals.session = driver.session({ database: DB });

app.use("/user", userRoutes);
app.use("/quests", questRoutes);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}.`));