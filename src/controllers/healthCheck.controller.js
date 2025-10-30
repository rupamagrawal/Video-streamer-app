import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asynchHandler";

const healthCheck = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { status: "OK" }, "Server is Healthy!"));
});

export { healthCheck };
