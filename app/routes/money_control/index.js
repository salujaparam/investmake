const express = require("express");
const { internalAuth } = require("../../middleware/auth");
const getHoldingDetails = require("./get_holding_details");
const getMultipleHoldingDetails = require("./get_multiple_holding_details");

const router = express.Router();

router.get("/mny_ctrl/holding_details/:isin", internalAuth, getHoldingDetails);

router.get(
  "/mny_ctrl/multiple_holding_details/:isins",
  internalAuth,
  getMultipleHoldingDetails
);

module.exports = router;
