import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asynchHandler";
import { ApiError } from "../utils/ApiErrors";
import { Playlist } from "../models/playlist.model";
import { ApiResponse } from "../utils/ApiResponse";

const createPlaylist = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized User!");
  }
  const { name, description } = req.body;
  if (!name) {
    throw new ApiError(400, "Playlist Name is required!");
  }
  const isPlaylistNameExist = await Playlist.findOne({
    name: name,
    owner: userId,
  });
  if (isPlaylistNameExist) {
    throw new ApiError(409, "Playlist already Exist!");
  }

  const playlist = await Playlist.create({
    name: name,
    description: description,
    owner: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created Successfully!"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized USer");
  }

  const playlist = await Playlist.find({ owner: userId });
  if (playlist.length === 0) {
    throw new ApiError(404, "No Playlist Found!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist Found!"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PLaylist ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not Found!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist Found!"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id!");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id!");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "playlist with Id not found!");
  }

  const userId = req.user?._id;
  if (playlist.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "User not allowed to edit other user playlist");
  }

  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video already exists in playlist!");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $push: { videos: videoId } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video added Successfully!"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id!");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id!");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist with Id not found!");
  }

  const userId = req.user?._id;
  if (playlist.owner.toString() !== userId.toString()) {
    throw new ApiError(401, "User not allowed to edit other user playlist");
  }

  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(401, "Video with Id not found in Playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlist,
    { $pull: { videos: videoId } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video delete Succcessfully!"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(401, "Invalid Playlist Id");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist with Id not exist");
  }

  const userId = req.user?._id;
  if (playlist.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "User not allowed to delete other user's playlist");
  }

  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted Successfully!"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(401, "Invalid Playlist Id");
  }

  if (!name && !description) {
    throw new ApiError(
      400,
      "Nothing to update — please provide a name or description"
    );
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist with Id not exist");
  }

  const userId = req.user?._id;
  if (playlist.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "User not allowed to delete other user's playlist");
  }

  const updatePlaylist = await Playlist.findByIdAndUpdate(
    playlist,
    {
      $set: {
        ...(name && { name }),
        ...(description && { description }),
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatePlaylist,
        "Playlist Details Updated Succcessfully!"
      )
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
