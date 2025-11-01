import { isValidObjectId, mongoose } from "mongoose";
import { asyncHandler } from "../utils/asynchHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "Unauthorised User!");
  }

  const { content } = req.body;
  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Empty Tweet is not allowed!");
  }

  const tweet = await Tweet.create({
    owner: userId,
    content: content.trim(),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { tweet }, "Tweet created successfully!"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorised User!");
  }

  const { page = 1, limit = 10 } = req.query;

  const tweet = await Tweet.find({ owner: userId })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  if (!tweet.length) {
    return res.status(200).json(new ApiResponse(200, [], "No tweets Found!"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweets fetched Succcessfully!"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorised User!");
  }

  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  const { content } = req.body;
  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Empty Tweet is not allowed!");
  }

  //   const tweet = await Tweet.findById(tweetId);
  //   if (!tweet) {
  //     throw new ApiError(404, "Tweet not found!");
  //   }

  //   if (tweet.owner.toString() !== userId.toString()) {
  //     throw new ApiError(403, "You can update only your own tweets!");
  //   }

  //   tweet.content = content;
  //   await tweet.save();

  // **Use upper one or this one**

  const updatedTweet = await Tweet.findOneAndUpdate(
    { _id: tweetId, owner: userId },
    { content: content.trim() },
    { new: true }
  );

  if (!updatedTweet) {
    throw new ApiError(
      404,
      "Tweet not found or you are not authorized to update it!"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet Updated Succcessfully!"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorised User!");
  }

  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found!");
  }

  if (tweet.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You can delete only your own tweets!");
  }

  await tweet.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet Deleted Succcessfully!"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
