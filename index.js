require("dotenv").config();
const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Server is up");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(require("./app/routes/money_control"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
