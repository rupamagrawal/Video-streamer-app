import mongoose from "mongoose";
import { asyncHandler } from "../utils/asynchHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const channelId = req.user?._id;
  if (!channelId) {
    throw new ApiError(401, "Unauthorized User");
  }

  const videos = await Video.find({ owner: channelId });
  if (videos.length === 0) {
    throw new ApiError(404, "No Video Found!");
  }

  const totalVideos = videos.length;

  let totalViews = 0;
  let totalLikes = 0;
  //can also use aggregate method but this method is used for small database purpose
  videos.forEach((video) => {
    totalViews += video.views || 0;
    totalLikes += video.likes || 0; //Does not exist now but if wanted to add
  });

  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideos,
        totalLikes,
        totalViews,
        totalSubscribers,
      },
      "Channel Stats Fetched Successfully!"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const channelId = req.user?._id;
  if (!channelId) {
    throw new ApiError(401, "Unauthorised User!");
  }

  const videos = await Video.find({ owner: channelId }).sort({ createdAt: -1 });
  if (videos.length === 0) {
    throw new ApiError(404, "No Videos Found for this Channel!");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { videos }, "Channel Videos Fetched Successfully!")
    );
});

export { getChannelStats, getChannelVideos };
