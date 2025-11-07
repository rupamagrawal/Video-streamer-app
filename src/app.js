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
import dashboardRouter from "./routes/dashboard.router.js";
import commentRouter from "./routes/comment.router.js";
import videoRouter from "./routes/video.router.js";
import heathChechRouter from "./routes/healthCheck.router.js";
import likeRouter from "./routes/like.router.js";
import playlistRouter from "./routes/playlist.router.js";
import subscriptionRouter from "./routes/subscription.router.js";
import tweetRouter from "./routes/tweet.router.js";

//route declaration
app.use("/api/v1/users", userRouter);
//  http://localhost:8000/api/v1/users/regiter
app.use("/api/v1/dashboard", dashboardRouter);

app.use("/api/v1/comment", commentRouter);

app.use("/api/v1/healthCheck", heathChechRouter);

app.use("/api/v1/video", videoRouter);

app.use("/api/v1/like", likeRouter);

app.use("/api/v1/subscription", subscriptionRouter);

app.use("/api/v1/playlist", playlistRouter);

app.use("/api/v1/tweet", tweetRouter);

export { app };
