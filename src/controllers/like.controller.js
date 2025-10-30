import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model";
import { ApiError } from "../utils/ApiErrors";
import { asyncHandler } from "../utils/asynchHandler";
import { ApiResponse } from "../utils/ApiResponse";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID!");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });
  if (existingLike) {
    await existingLike.deleteOne();
    const totalLikes = await Like.countDocuments({ video: videoId });
    return res
      .status(200)
      .json(new ApiResponse(200, { totalLikes }, "Video Disliked!"));
  }

  await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, {}, "Video Liked!"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment ID!");
  }

  const existingCommentLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });
  if (existingCommentLike) {
    await existingCommentLike.deleteOne();
    const totalCommentLike = await Like.countDocuments({ comment: commentId });
    return res
      .status(200)
      .json(new ApiResponse(200, { totalCommentLike }, "Comment disliked!"));
  }

  await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });
  const totalCommentLike = await Like.countDocuments({ comment: commentId });

  return res
    .status(200)
    .json(new ApiResponse(200, { totalCommentLike }, "Comment Liked!"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID!");
  }

  const existingTweetLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (existingTweetLike) {
    await existingTweetLike.deleteOne();
    const totalTweetLike = await Like.countDocuments({ tweet: tweetId });
    return res
      .status(200)
      .json(new ApiResponse(200, { totalTweetLike }, "Tweet Disliked!"));
  }

  await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });
  const totalTweetLike = await Like.countDocuments({ tweet: tweetId });
  return res
    .status(200)
    .json(new ApiResponse(200, { totalTweetLike }, "Tweet Liked!"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.find({
    likedBy: req.user?._id,
    video: { $exists: true },
  }).populate("video");

  if (!likedVideos.length) {
    throw new ApiError(404, "No Liked Videos Found!");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { likedVideos },
        "Liked Videos Fetched Successfully!"
      )
    );
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
