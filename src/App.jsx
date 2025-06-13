import React from "react";
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
  const [parentFolderStack, setParentFolderStack] = React.useState([]);
  const { instance } = useMsal();
  const [allFiles, setAllFiles] = React.useState([]);
  const [category, setCategory] = React.useState("all");
  const [nextPageUrl, setNextPageUrl] = React.useState(null);
  const [loadingAllFiles, setLoadingAllFiles] = React.useState(false);

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

    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/${
          folderId ? `items/${folderId}` : "root"
        }/children?$top=25`,
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
      loadAllFiles();
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

  async function loadAllFiles(folderId = null, files = [], nextLink = null) {
    setLoadingAllFiles(true);
    const token = account.accessToken;
    try {
      const url =
        nextLink ||
        `https://graph.microsoft.com/v1.0/me/drive/${
          folderId ? `items/${folderId}` : "root"
        }/children?top=50`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      // setNextLoadUrl(data["@odata.nextLink"]);
      files.push(...data.value);
      nextLink = data["@data.nextLink"];
      setAllFiles((prevAllFiles) => {
        const existingIds = new Set(prevAllFiles.map((file) => file.id));
        const uniqueFiles = data.value.filter(
          (file) => !existingIds.has(file.id)
        );
        return [...prevAllFiles, ...uniqueFiles];
      });
      if (nextLink) {
        await loadAllFiles(items.id, files, nextLink);
        return;
      }

      for (const items of files) {
        if (items.folder) {
          await loadAllFiles(items.id);
        }
      }
    } catch (err) {
      console.error("Error fetching files:", err);
    } finally {
      setLoadingAllFiles(false);
    }

    console.log(allFiles);
  }

  async function searchFiles() {
    const accessToken = session.getAccessToken();
    if (!fileName) return fetchOneDriveFiles();
    const searchQueries = fileName.split(" ");
    const filteredFiles = allFiles.filter((file) => {
      return searchQueries.every((query) =>
        file.name.toLowerCase().includes(query.toLowerCase())
      );
    });
    setFiles(filteredFiles);
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
                  loadingAllFiles={loadingAllFiles}
                />
              }
            />
          </Routes>
        </BrowserRouter>
      </main>
    </>
  );
}
