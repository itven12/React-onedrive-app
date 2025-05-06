const express = require("express");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { msalInstance } = require("./auth");

dotenv.config();

const app = express();
const PORT = process.env.PORT;
// const process.env.SECRET_KEY =
//   "yXqffN72sjS1qfNYr9uPXpVNK3y7a5qblHF/XvouTiXTqf9j6YVI+C/vl3OmXMsMrU1HlwV61B88PKrj/EBEFQ==";
app.use(cors());
app.use(express.json());

function authenticateToken(req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
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

app.post("/api/auth/login", (req, res) => {
  const user = req.body;
  console.log(user);
  const token = jwt.sign({ ...user }, process.env.SECRET_KEY, {
    expiresIn: "1h",
  });
  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: user,
    token,
  });
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
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root/children`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await response.json();
    res.status(200).json({
      success: true,
      message: "Files fetched successfully",
      data: data.value,
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
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await response.json();
    res.status(200).json({
      success: true,
      message: "Files fetched successfully",
      data: data.value,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching files",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server started at PORT: ${PORT}`);
});
