import { asyncHandler } from "../utils/asynchHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uplodeOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await generateAccessToken();
    const refreshToken = await generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while genrating tokens!");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  const { fullName, email, username, password } = req.body;
  // console.log("Email: ", email);
  // console.log("Password: ", password);

  // validation - not empty
  if (
    [fullName, email, password, username].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are neccesary");
  }
  // Check if user already exists: username, email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with this email or password already exist!");
  }
  // console.log("req.body: ");
  // console.log(req.body);
  // console.log("req.files: ");
  // console.log(req.files);

  // check for image, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is required. ");
  }
  // uplode them into the cloudinary, avatar
  const avatar = await uplodeOnCloudinary(avatarLocalPath);
  const coverImage = await uplodeOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar File is required. ");
  }
  // create user object - create entry in DB
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  // remove passward and token field form response
  const createUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // check for user creation
  if (!createUser) {
    throw new ApiError(500, "Something went wrong while registering the user!");
  }

  // return response
  return res
    .status(201)
    .json(new ApiResponse(200, createUser, "User registerd Successfully!"));
});

const loginUser = asyncHandler(async (req, res) => {
  //take data from body / frontend
  const { username, password, email } = req.body;
  //username or email
  if (!username || !email) {
    throw new ApiError(400, "Username or email required!");
  }
  //find the user (if not give response)
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User with this email or password doesn't exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password is Incorrect!");
  }
  //if user is authentication passed generate refresh and access token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  // send cookie
  const loggedInUser = await User.findById(user._id).select(
    "-password",
    "-refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logges in Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged out!"));
});

export { registerUser, loginUser, logoutUser };
