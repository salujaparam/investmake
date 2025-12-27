const axios = require("axios");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../../data/moneycontrol");

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (_) {}
}

function cacheFilePath(isin) {
  return path.join(DATA_DIR, `${isin}.json`);
}

function isExpired(meta) {
  if (!meta || !meta.validUntil) return true;
  const validUntilMs = new Date(meta.validUntil).getTime();
  return Number.isFinite(validUntilMs) ? Date.now() > validUntilMs : true;
}

module.exports = async (req, res) => {
  const { isin } = req.params;
  const force = String(req.query.force || "false").toLowerCase() === "true";

  ensureDir(DATA_DIR);
  const filePath = cacheFilePath(isin);

  if (fs.existsSync(filePath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const expired = isExpired(cached.meta);
      const needsRefresh = expired || force;
      if (!needsRefresh) {
        return res.json({ ...cached, needsRefresh: false, source: "cache" });
      }
    } catch (_) {
      // continue to live fetch
    }
  }

  const url = "https://mf.moneycontrol.com/service/etf/v1/getSchemeHoldingData";
  const params = { isin, key: "Stocks" };
  const headers = {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    Connection: "keep-alive",
    Origin: "https://www.moneycontrol.com",
    Referer: "https://www.moneycontrol.com/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    "sec-ch-ua":
      '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
  };

  try {
    const response = await axios.get(url, { params, headers, timeout: 15000 });
    const fetchedAt = new Date().toISOString();
    const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const json = {
      meta: {
        source: "moneycontrol",
        url,
        isin,
        fetchedAt,
        validUntil,
      },
      payload: response.data,
      needsRefresh: false,
    };

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf-8");
    return res.json({ ...json, source: "live" });
  } catch (err) {
    console.error(
      `Error fetching holding details for ISIN: ${isin}`,
      err.message
    );
    console.error(err);
    if (fs.existsSync(filePath)) {
      try {
        const cached = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        return res
          .status(200)
          .json({ ...cached, source: "cache", error: "live_fetch_failed" });
      } catch (_) {}
    }
    return res
      .status(502)
      .json({ error: "fetch_failed", details: err.message });
  }
};
