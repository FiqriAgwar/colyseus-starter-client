const path = require("path");
const express = require("express");

const app = express();
const DIST_DIR = path.join(__dirname, "/dist");
const SRC_DIR = path.join(__dirname, "/src/Assets");
const HTML_FILE = path.join(__dirname, "/index.html");

app.use("/dist", express.static(DIST_DIR));
app.use("/src/Assets", express.static(SRC_DIR));
app.get("*", (req, res) => {
  res.sendFile(HTML_FILE);
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {});
