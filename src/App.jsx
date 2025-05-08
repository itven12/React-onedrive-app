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

  async function fetchFiles(folderId, token) {
    const res = await fetch(
      `http://localhost:3000/api/auth/files/${folderId || ""}`,
      {
        method: "GET",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    if (!data.success && data.status >= 500) {
      return alert(data.message + " Please refresh the page.");
    }
    return data.data;
  }

  async function fetchOneDriveFiles(folderId = null, parentId = null) {
    const token = localStorage.getItem("token");
    const fetchedFiles = await fetchFiles(folderId, token);
    setFiles(fetchedFiles);
    console.log(files);
    if (parentId) {
      setParentFolderStack((prev) => [...prev, parentId]);
    }
    if (allFiles.length === 0) {
      loadAllFiles();
    }
  }

  async function loadAllFiles(folderId = null) {
    const token = localStorage.getItem("token");
    const fetchedFiles = await fetchFiles(folderId, token);
    setAllFiles((prevAllFiles) => {
      const existingIds = new Set(prevAllFiles.map((file) => file.id));
      const uniqueFiles = fetchedFiles.filter(
        (file) => !existingIds.has(file.id)
      );
      return [...prevAllFiles, ...uniqueFiles];
    });
    for (const items of fetchedFiles) {
      if (items.folder) {
        loadAllFiles(items.id);
      }
    }
  }

  function searchFiles() {
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
    localStorage.removeItem("token");
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
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<LoginPage account={account} setAccount={setAccount} />}
            />
            <Route
              path="/home"
              element={
                <HomePage
                  account={account}
                  setAccount={setAccount}
                  files={files}
                  fetchOneDriveFiles={fetchOneDriveFiles}
                  navigationBack={navigationBack}
                  setFileName={setFileName}
                  searchFiles={searchFiles}
                  resetData={resetData}
                />
              }
            />
          </Routes>
        </BrowserRouter>
      </main>
    </>
  );
}
