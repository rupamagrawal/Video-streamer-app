import mongoose from "mongoose";
import { asyncHandler } from "../utils/asynchHandler";
import { ApiError } from "../utils/ApiErrors";
import { Comment, Video } from "../models/comment.model";
import { ApiResponse } from "../utils/ApiResponse";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Invalid video ID");
  }

  const { page = 1, limit = 10 } = req.query;

  const videoExist = await Video.findById(videoId);
  if (!videoExist) {
    throw new ApiError(400, "Video not Found!");
  }

  const comments = await Comment.aggregate([
    {
      $match: { video: new mongoose.Types.ObjectId(videoId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $skip: (Number(page) - 1) * Number(limit),
    },
    {
      $limit: Number(limit),
    },
  ]);

  if (!comments || comments.length === 0) {
    throw new ApiError(404, "No Comments Found for this video!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comment fetched Successfully!"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Invalid video ID");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized user");
  }

  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Comment text is required");
  }

  const videoExist = await Video.findById(videoId);
  if (!videoExist) {
    throw new ApiError(400, "Video not found!");
  }

  const newComment = await Comment.create({
    content,
    video: videoId,
    owner: userId,
  });

  return res
    .status(200)
    .json(new ApiResponse(201, newComment, "Comment created Successfully!"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment

  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment ID is missing!");
  }

  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Comment text is required!");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized user!");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError("Comment not found!");
  }

  if (comment.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only edit your own comments!");
  }

  comment.content = content;
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment Updted Successfuly!"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const {commentId} = req.params;
  if(!commentId){
    throw new ApiError(400, "Comment ID not found!");
  }

  const comment = await Comment.findById(commentId);
  if(!comment){
    throw new ApiError(404, "Comment not found!")
  }

  const userId = req.user?._id;
  if(!userId){
    throw new ApiError(401, "Unauthorized user");
  }

  if(comment.owner.toString() !== userId.toString()){
    throw new ApiError(403, "You can only edit your own comments!");
  }

  await comment.deleteOne();

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Comment deleted Succcessfully!"))

});

export { getVideoComments, addComment, updateComment, deleteComment };
