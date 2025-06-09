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
  const [filteredFiles, setFilteredFiles] = React.useState([]);
  const [fileName, setFileName] = React.useState("");
  const [parentFolderStack, setParentFolderStack] = React.useState([]);
  const { instance } = useMsal();
  const [allFiles, setAllFiles] = React.useState([]);
  const [category, setCategory] = React.useState("all");
  const [nextPageUrl, setNextPageUrl] = React.useState(null);
  const [nextSearchUrl, setNextSearchUrl] = React.useState(null);
  const [folderIdState, setFolderIdState] = React.useState(null);

  const session = {
    isLoggedIn: () => {
      const token = localStorage.getItem("accessToken");
      const expiresAt = new Date(Number(localStorage.getItem("expiresAt")));
      return token && expiresAt > new Date();
    },
    getAccessToken: () => {
      return localStorage.getItem("token");
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

  async function fetchFiles(folderId, token) {
    const res = await fetch(
      `http://localhost:3000/api/auth/files${
        folderId ? `/${folderId}?top=3` : "?top=3"
      }`,
      {
        method: "GET",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          nextPageUrl: nextPageUrl || "",
        },
      }
    );
    const data = await res.json();
    console.log(data);
    setNextPageUrl(data.data["@odata.nextLink"]);
    console.log(data.data["@odata.nextLink"]);
    if (!data.success && data.status >= 500) {
      return alert(data.message + " Please refresh the page.");
    }
    return data.data.value;
  }

  async function fetchOneDriveFiles(folderId = null, parentId = null) {
    const token = session.getAccessToken();
    if (folderId) setFolderIdState(folderId);
    const fetchedFiles = await fetchFiles(folderId, token);
    setFiles(fetchedFiles);
    console.log(files);
    if (parentId) {
      setParentFolderStack((prev) => [...prev, parentId]);
    }
    if (allFiles.length === 0) {
      // loadAllFiles();
    }
  }

  async function loadMoreFiles() {
    if (!nextPageUrl) return;
    const token = session.getAccessToken();
    setNextPageUrl(null);
    const fetchedFiles = await fetchFiles(folderIdState, token);
    setFiles((prevFiles) => [...prevFiles, ...fetchedFiles]);
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

  async function searchFiles() {
    if (!fileName) return fetchOneDriveFiles();

    // const searchQueries = fileName.split(" ");
    // const filteredFiles = allFiles.filter((file) => {
    //   return searchQueries.every((query) =>
    //     file.name.toLowerCase().includes(query.toLowerCase())
    //   );
    // });
    // setFiles(filteredFiles);
    const token = session.getAccessToken();
    console.log("Calling search api");
    const res = await fetch(
      `http://localhost:3000/api/auth/search?top=25&keyword=${fileName}&folderId=${
        folderIdState || ""
      }`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          nexSearchUrl: nextSearchUrl || "",
        },
      }
    );
    const data = await res.json();
    if (data.nexSearchUrl) {
      setNextSearchUrl(data.nexSearchUrl);
    }
    setFilteredFiles(data.data);
    console.log("searchdata:", data);
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
                  loadMoreFiles={loadMoreFiles}
                  filteredFiles={filteredFiles}
                />
              }
            />
          </Routes>
        </BrowserRouter>
      </main>
    </>
  );
}
