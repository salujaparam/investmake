const axios = require("axios");
const funds = require("./funds.json");

const AUTH_KEY = process.env.AUTH_KEY || "";

function extractIsins(raw) {
  if (!raw || typeof raw !== "string") return [];
  const matches = raw.match(/[A-Z0-9]{12}/g) || []; // ISINs are 12 chars
  return matches;
}

async function fetchForIsin(isin) {
  console.log(AUTH_KEY);
  const url = `http://localhost:3000/mny_ctrl/holding_details/${isin}`;
  try {
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer kohli007` },
      timeout: 20000,
    });
    const count = Array.isArray(data?.payload)
      ? data.payload.length
      : undefined;
    console.log(
      `Fetched holdings for ISIN: ${isin} | source=${data.source} | items=${
        count ?? "unknown"
      }`
    );
  } catch (error) {
    console.error(`Error fetching holdings for ISIN: ${isin}`, error.message);
    console.error(error);
  }
}

const script = async () => {
  for (const fund of funds) {
    const rawIsins = fund["ISIN Div Payout/ ISIN GrowthISIN Div Reinvestment"];
    const isins = extractIsins(rawIsins);
    if (isins.length === 0) continue;

    for (const isin of isins) {
      await fetchForIsin(isin);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

script();
