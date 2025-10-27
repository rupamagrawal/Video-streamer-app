import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" })); //to limit the amount of json
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //this tells the express that data can be from url too
app.use(express.static("public"));
app.use(cookieParser());

//route
import userRouter from "./routes/users.route.js";

//route declaration
app.use("/api/v1/users", userRouter);
//  http://localhost:8000/api/v1/users/regiter

export { app };
