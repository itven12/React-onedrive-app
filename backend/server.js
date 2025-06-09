const express = require("express");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const { msalInstance } = require("./auth");
const { data } = require("react-router-dom");

dotenv.config();

const app = express();
const PORT = process.env.PORT;
// const process.env.SECRET_KEY =
// "yXqffN72sjS1qfNYr9uPXpVNK3y7a5qblHF/XvouTiXTqf9j6YVI+C/vl3OmXMsMrU1HlwV61B88PKrj/EBEFQ==";
app.use(cors());
app.use(express.json());

function authenticateToken(req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
  // console.log(token);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access Denied!",
    });
  }
  try {
    const verified = jwt.verify(token, process.env.SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid Token!" });
  }
}

async function downloadAndSeachFile(fileId, accessToken, keyword) {}

app.post("/api/auth/login", (req, res) => {
  const user = req.body;
  console.log(user);
  try {
    const token = jwt.sign({ ...user }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: user,
      token,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error logging in",
    });
  }
});

app.get("/api/auth/user", authenticateToken, (req, res) => {
  const { user } = req;
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "User not found!",
    });
  }
  res.status(200).json({
    success: true,
    message: "User fetched successfully",
    data: user,
  });
});

app.get("/api/auth/files", authenticateToken, async (req, res) => {
  const { user } = req;
  const { accessToken } = user;
  const top = req.query.top || 25;
  console.log(top);
  // const nextPageUrl = req.body.nextPageUrl;
  const nextPageUrl = req.header("nextPageUrl");
  console.log(nextPageUrl);
  const url =
    nextPageUrl ||
    `https://graph.microsoft.com/v1.0/me/drive/root/children?$top=${top}`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    res.status(200).json({
      success: true,
      message: "Files fetched successfully",
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching files",
    });
  }
});

app.get("/api/auth/files/:id", authenticateToken, async (req, res) => {
  const { user } = req;
  const { id: folderId } = req.params;
  console.log(folderId);
  const { accessToken } = user;
  const top = req.query.top || 25;
  const nextPageUrl = req.header("nextPageUrl");
  const url =
    nextPageUrl ||
    `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children/?$top=${top}`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    res.status(200).json({
      success: true,
      message: "Files fetched successfully",
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching files",
      status: 500,
    });
  }
});

app.get("/api/auth/search", authenticateToken, async (req, res) => {
  console.log("Search API called");
  const { user } = req;
  const { accessToken } = user;
  const { keyword, top, folderId } = req.query;
  console.log(folderId);
  // console.log(keyword, top, user);/
  const nextSearchUrl = req.header("nextSearchUrl");
  const token = req.header("Authorization")?.split(" ")[1];

  let url = "";
  if (nextSearchUrl) {
    url = nextSearchUrl;
  } else if (folderId) {
    url = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children/?$top=${top}`;
  } else {
    url = `https://graph.microsoft.com/v1.0/me/drive/root/children?$top=${top}`;
  }
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    const filteredFiles = [];
    console.log(data.value);
    for (const file of data.value) {
      if (!file.file) continue;

      const res = await fetch(file["@microsoft.graph.downloadUrl"]);
      const arrayBuffer = await res.arrayBuffer();
      console.log(arrayBuffer);
      const buffer = Buffer.from(arrayBuffer);
      console.log(buffer);
      const fileType = file.file?.mimeType.split("/")[1];
      let text = "";
      if (fileType === "pdf") {
        const data = await pdfParse(buffer);
        text = data.text;
      } else if (fileType === "docx" || fileType.includes("document")) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else if (fileType === "txt") {
        text = buffer.toString("utf-8");
      }
      if (
        text.toLowerCase().includes(keyword.toLowerCase()) ||
        file.name.toLowerCase().includes(keyword.toLowerCase())
      ) {
        filteredFiles.push(file);
      }
    }
    if (filteredFiles.length < 10) {
      const nextSearchUrl = data["@odata.nextLink"];
      if (nextSearchUrl) {
        const res = await fetch(
          `http://locaklhost:3000/api/auth/search?keyword=${keyword}&top=${top}&folderId=${
            folderId || ""
          }`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              nextSearchUrl: nextSearchUrl,
            },
          }
        );
      }
    }
    return res.status(200).json({
      success: true,
      message: "Files fetched successfully",
      data: filteredFiles,
      nextSearchUrl: data["@odata.nextLink"] || null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error searching files",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server started at PORT: ${PORT}`);
});
