import { asyncHandler } from "../utils/asynchHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "Hey Rupam U R amazing",
  });
});

export { registerUser };
