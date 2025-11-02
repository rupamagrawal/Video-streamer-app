import { isValidObjectId, mongoose } from "mongoose";
import { asyncHandler } from "../utils/asynchHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteFromCloudinary,
  extractPublicId,
  uplodeOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  // Convert pagination values to numbers (important)
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;

  // Build dynamic filter object
  const filter = {};
  if (query) {
    filter.title = { $regex: query, $options: "i" };
  }
  if (userId) {
    filter.owner = userId;
  }

  // Fetch videos with filter, sorting, and pagination
  const videos = await Video.find(filter)
    .sort({ [sortBy || "createdAt"]: sortType === "desc" ? -1 : 1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  const totalVideos = await Video.countDocuments(filter);

  if (videos.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No Videos Found!"));
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        totalVideos,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalVideos / limitNumber),
      },
      "Videos Fetched successfully!"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!req.user || !req.user._id) {
    throw new ApiError(
      401,
      "Unauthorised user, Please Login to publish video."
    );
  }

  const videoFileLocalPath = req.files?.videoFile?.[0].path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0].path;
  // TODO: get video, upload to cloudinary, create video

  if (!title || !description || !videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "All Fields are required!");
  }

  const videoUpload = await uplodeOnCloudinary(videoFileLocalPath);
  const thumbnailUpload = await uplodeOnCloudinary(thumbnailLocalPath);

  if (!videoUpload || !thumbnailUpload) {
    throw new ApiError(500, "Video uplode failed. Please try again!");
  }

  const video = await Video.create({
    videoFile: videoUpload.url,
    thumbnail: thumbnailUpload.url,
    title,
    description,
    duration: videoUpload.duration || 0,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video uploded successfully!"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video ID is required!");
  }

  const video = await Video.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $unwind: "$ownerDetails",
    },
    {
      $project: {
        title: 1,
        description: 1,
        thumbnail: 1,
        videoFile: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        "ownerDetails.username": 1,
        "ownerDetails.email": 1,
      },
    },
  ]);

  if (!video.length) {
    throw new ApiError(404, "No Video exist with this id!");
  }

  //increments view count when this API is hit
  await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully!"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video Id needed!");
  }

  const { title, description } = req.body;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found!");
  }

  const user = req.user?._id;
  if (video.owner.toString() !== user.toString()) {
    throw new ApiError(403, "You are not authorized to update this video!");
  }

  if (title) video.title = title;
  if (description) video.description = description;

  const thumbnailLocalPath = req.file?.path || req.files?.thumbnail?.[0]?.path;
  if (thumbnailLocalPath) {
    const thumbnailUpload = await uplodeOnCloudinary(thumbnailLocalPath);
    if (!thumbnailUpload) {
      throw new ApiError(500, "thumbnail Upload Failed!");
    }

    if (video.thumbnail) {
      const oldThumbnail = extractPublicId(video.thumbnail);
      if (oldThumbnail) {
        await deleteFromCloudinary(video.thumbnail);
      }
    }
    video.thumbnail = thumbnailUpload.url;
  }

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Updated Succcessfully!"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id!");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found!");
  }

  const user = req.user?._id;
  if (video.owner.toString() !== user.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video!");
  }

  const videoPId = extractPublicId(video.videoFile);
  const thumbnailPid = extractPublicId(video.thumbnail);

  if (videoPId) await deleteFromCloudinary(videoPId);
  if (thumbnailPid) await deleteFromCloudinary(thumbnailPid);

  await video.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted Succcessfully!"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found!");
  }

  const user = req.user?._id;
  if (video.owner.toString() !== user.toString()) {
    throw new ApiError(403, "You are not authorized to change publish status!");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "Video publish status toggled successfully!")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
