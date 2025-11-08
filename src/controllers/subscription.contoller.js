import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asynchHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel Id!");
  }

  const subscriberId = req.user?._id;
  const existingSub = await Subscription.findOne({
    channel: channelId,
    subscriber: subscriberId,
  });
  if (existingSub) {
    await Subscription.findByIdAndDelete(existingSub._id);
    return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed!"));
  }
  await Subscription.create({
    channel: channelId,
    subscriber: subscriberId,
  });

  return res.status(200).json(new ApiResponse(200, {}, "Subscribed!"));
});

const getUserSubscriptions = asyncHandler(async (req, res) => {
  const { subscriberId  } = req.params;
  if (!isValidObjectId(subscriberId )) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  //   const subscribers = (
  //     await Subscription.find({ channel: channelId })
  //   ).populate("subscriber");

  const subscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(subscriberId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
      },
    },
    {
      $unwind: "$subscriberDetails",
    },
    {
      $project: {
        _id: 0,
        subscriberId: "$subscriberDetails._id",
        username: "$subscriberDetails.username",
        fullName: "$subscriberDetails.fullName",
        email: "$subscriberDetails.email",
        avatar: "$subscriberDetails.avatar",
      },
    },
  ]);
  if (subscribers.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No Subscribers Found for this Channel!"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched Succcessfully!")
    );
});

const getChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Subscriber Id");
  }

  //   const subscriber = await Subscription.find({
  //     subscriber: subscriberId,
  //   }).populate("channel");

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
      },
    },
    {
      $unwind: "$channelDetails",
    },
    {
      $project: {
        _id: 0,
        channelId: "$channelDetails._id",
        channelName: "$channelDetails.username",
        fullName: "$channelDetails.fullName",
        email: "$channelDetails.email",
        avatar: "$channelDetails.avatar",
      },
    },
  ]);
  if (subscribedChannels.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No Subscribed Channel Found!"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed channels fetched successfully!"
      )
    );
});

export { toggleSubscription, getUserSubscriptions, getChannelSubscribers };
