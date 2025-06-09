import React from "react";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import LoginPage from "./pages/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import { useMsal } from "@azure/msal-react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import "./App.css";

export default function App() {
  const [account, setAccount] = React.useState(null);
  const [files, setFiles] = React.useState([]);
  const [fileName, setFileName] = React.useState("");
  const [folderIdState, setFolderIdState] = React.useState(null);
  const [parentFolderStack, setParentFolderStack] = React.useState([]);
  const { instance } = useMsal();
  const [allFiles, setAllFiles] = React.useState([]);
  const [category, setCategory] = React.useState("all");
  const [nextPageUrl, setNextPageUrl] = React.useState(null);
  const [nextSearchUrl, setNextSearchUrl] = React.useState(null);

  const session = {
    isLoggedIn: () => {
      const token = localStorage.getItem("accessToken");
      const expiresAt = new Date(Number(localStorage.getItem("expiresAt")));
      return token && expiresAt > new Date();
    },
    getAccessToken: () => {
      return localStorage.getItem("accessToken");
    },
  };

  React.useEffect(() => {
    if (!account) return;
    fetchOneDriveFiles();
  }, [account]);

  React.useEffect(() => {
    console.log(allFiles);
  }, [allFiles]);

  function navigationBack() {
    const prevFolderId = [...parentFolderStack].pop();
    fetchOneDriveFiles(prevFolderId);
    setParentFolderStack((prev) => prev.slice(0, -1));
  }

  async function fetchOneDriveFiles(folderId = null, parentId = null) {
    const token = account.accessToken;
    if (folderId) setFolderIdState(folderId);

    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/${
          folderId ? `items/${folderId}` : "root"
        }/children?$top=3`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      console.log(data, data["@odata.nextLink"]);
      setFiles(data.value);
      setNextPageUrl(data["@odata.nextLink"]);
    } catch (err) {
      console.error("Error fetching files:", err);
    }

    if (parentId) {
      setParentFolderStack((prev) => [...prev, parentId]);
    }

    if (allFiles.length === 0) {
      // loadAllFiles();
    }
  }

  async function loadMoreFiles() {
    const token = account.accessToken;
    console.log("loading more files");
    console.log(nextPageUrl);
    if (!nextPageUrl) return;

    try {
      const res = await fetch(nextPageUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setFiles((prevFiles) => [...prevFiles, ...data.value]);
      setNextPageUrl(data["@odata.nextLink"] || null);
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  }

  async function searchFiles() {
    const accessToken = session.getAccessToken();
    if (!fileName) return fetchOneDriveFiles();
    let url = "";
    let keyword = fileName.trim();
    if (nextSearchUrl) {
      url = nextSearchUrl;
    } else if (folderIdState) {
      url = `https://graph.microsoft.com/v1.0/me/drive/items/${folderIdState}/children/?$top=10`;
    } else {
      url = `https://graph.microsoft.com/v1.0/me/drive/root/children?$top=10`;
    }
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    const filteredFiles = [];
    setNextSearchUrl(data["@odata.nextLink"]);
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
        await searchFiles();
      }
    }
  }

  function resetData() {
    localStorage.clear();
    setFileName("");
    setAllFiles([]);
    setParentFolderStack([]);
    setFiles([]);
    setAccount(null);
  }

  return (
    <>
      <header>
        <h1>Onedrive File Search</h1>
      </header>

      <main>
        <BrowserRouter basename="/React-onedrive-app/">
          <Routes>
            <Route
              path="/"
              element={
                <LoginPage
                  account={account}
                  setAccount={setAccount}
                  session={session}
                />
              }
            />
            <Route
              path="/home"
              element={
                <HomePage
                  account={account}
                  setAccount={setAccount}
                  files={files}
                  allFiles={allFiles}
                  setCategory={setCategory}
                  setFiles={setFiles}
                  fetchOneDriveFiles={fetchOneDriveFiles}
                  navigationBack={navigationBack}
                  setFileName={setFileName}
                  searchFiles={searchFiles}
                  session={session}
                  resetData={resetData}
                  loadMoreFiles={loadMoreFiles}
                />
              }
            />
          </Routes>
        </BrowserRouter>
      </main>
    </>
  );
}
