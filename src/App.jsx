import React from "react";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/webpack"; // for Vite/Webpack

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
  const [filteredFiles, setFilteredFiles] = React.useState([]);
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

  async function extractTextFromPDF(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  }

  async function searchFiles() {
    const accessToken = session.getAccessToken();
    if (!fileName) return fetchOneDriveFiles();

    let url = nextSearchUrl
      ? nextSearchUrl
      : folderIdState
      ? `https://graph.microsoft.com/v1.0/me/drive/items/${folderIdState}/children/?$top=10`
      : `https://graph.microsoft.com/v1.0/me/drive/root/children?$top=10`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();
    setNextSearchUrl(data["@odata.nextLink"]);

    const filtered_Files = [];

    for (const file of data.value) {
      if (!file.file) continue;

      const res = await fetch(file["@microsoft.graph.downloadUrl"]);
      const arrayBuffer = await res.arrayBuffer();
      const mimeType = file.file.mimeType;
      let text = "";

      try {
        if (mimeType.includes("pdf")) {
          const blob = new Blob([arrayBuffer], { type: mimeType });
          text = await extractTextFromPDF(blob);
        } else if (
          mimeType.includes("wordprocessingml") ||
          mimeType.includes("docx")
        ) {
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
        } else if (mimeType.includes("text")) {
          text = new TextDecoder().decode(arrayBuffer);
        }
      } catch (err) {
        console.warn("Failed to extract content:", file.name, err);
        continue;
      }

      if (
        text.toLowerCase().includes(fileName.toLowerCase()) ||
        file.name.toLowerCase().includes(fileName.toLowerCase())
      ) {
        filtered_Files.push(file);
      }
    }

    if (filtered_Files.length < 10 && nextSearchUrl) {
      await searchFiles(); // recursively load next page
    }

    setFilteredFiles(filtered_Files);
  }

  // async function searchFiles() {
  //   const accessToken = session.getAccessToken();
  //   if (!fileName) return fetchOneDriveFiles();
  //   let url = "";
  //   let keyword = fileName.trim();
  //   if (nextSearchUrl) {
  //     url = nextSearchUrl;
  //   } else if (folderIdState) {
  //     url = `https://graph.microsoft.com/v1.0/me/drive/items/${folderIdState}/children/?$top=10`;
  //   } else {
  //     url = `https://graph.microsoft.com/v1.0/me/drive/root/children?$top=10`;
  //   }
  //   const response = await fetch(url, {
  //     headers: {
  //       Authorization: `Bearer ${accessToken}`,
  //     },
  //   });
  //   const data = await response.json();
  //   const filtered_Files = [];
  //   setNextSearchUrl(data["@odata.nextLink"]);
  //   console.log(data.value);
  //   for (const file of data.value) {
  //     if (!file.file) continue;

  //     const res = await fetch(file["@microsoft.graph.downloadUrl"]);
  //     const arrayBuffer = await res.arrayBuffer();
  //     console.log(arrayBuffer);
  //     const buffer = new Uint8Array(arrayBuffer);
  //     console.log(buffer);
  //     const fileType = file.file?.mimeType.split("/")[1];
  //     let text = "";
  //     if (fileType === "pdf") {
  //       const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  //       for (let i = 1; i <= pdf.numPages; i++) {
  //         const page = await pdf.getPage(i);
  //         const textContent = await page.getTextContent();
  //         const pageText = textContent.items.map((item) => item.str).join(" ");
  //         text += pageText + "\n";
  //       }
  //     } else if (fileType === "docx" || fileType.includes("document")) {
  //       const blob = new Blob([buffer], {
  //         type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  //       });
  //       const result = await mammoth.extractRawText({ arrayBuffer });
  //       text = result.value;
  //     } else if (fileType === "txt") {
  //       text = new TextDecoder().decode(buffer);
  //     }

  //     if (
  //       text.toLowerCase().includes(keyword.toLowerCase()) ||
  //       file.name.toLowerCase().includes(keyword.toLowerCase())
  //     ) {
  //       filtered_Files.push(file);
  //     }
  //   }
  //   if (filtered_Files.length < 10) {
  //     // const nextSearchUrl = data["@odata.nextLink"];
  //     if (nextSearchUrl) {
  //       await searchFiles();
  //     }
  //   }
  //   setFilteredFiles(filtered_Files);
  // }

  // async function extractTextFromPDF(blob) {
  //   const arrayBuffer = await blob.arrayBuffer();
  //   const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  //   let fullText = "";

  //   return fullText;
  // }

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
                  filteredFiles={filteredFiles}
                  nextSearchUrl={nextSearchUrl}
                />
              }
            />
          </Routes>
        </BrowserRouter>
      </main>
    </>
  );
}
