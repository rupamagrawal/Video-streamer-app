// require('dotenv').config({path:'./env'})

import dotenv from "dotenv";
import connetDB from "./db/index.js";

dotenv.config({ path: "./env" });

connetDB();

/*
import express from "express";
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

    app.on("error", (error) => {
      console.log("ERROR", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on PORT ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("ERROR:", error);
    throw err;
  }
})();
// this are called iffies: when we create a function and execute it immediatly, professionals ussualy start iffies with a semicolon so that if prev line doesnt have any it shouldn't give any error.

*/
