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
  const [category , setCategory] = React.useState("all");

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
        }/children`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      console.log(data);
      setFiles(data.value);
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

  async function loadAllFiles(folderId = null) {
    const token = account.accessToken;
    try {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/${
          folderId ? `items/${folderId}` : "root"
        }/children`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      setAllFiles((prevAllFiles) => {
        const existingIds = new Set(prevAllFiles.map((file) => file.id));
        const uniqueFiles = data.value.filter(
          (file) => !existingIds.has(file.id)
        );
        return [...prevAllFiles, ...uniqueFiles];
      });
      for (const items of data.value) {
        if (items.folder) {
          loadAllFiles(items.id);
        }
      }
    } catch (err) {
      console.error("Error fetching files:", err);
    }

    console.log(allFiles);
  }

  async function searchFiles() {
    if (!fileName) return;
    // const token = account.accessToken;
    // const res = await fetch(
    //   `https://graph.microsoft.com/v1.0/me/drive/root/search(q=${`'${fileName}'`})`,
    //   {
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //     },
    //   }
    // );
    // const data = await res.json();
    // setFiles(data.value);
    // console.log(data, fileName);
    const filteredFiles = allFiles.filter((file) =>
      file.name.toLowerCase().includes(fileName.toLowerCase())
    );
    setFiles(filteredFiles);
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
                  setFiles = {setFiles}
                  fetchOneDriveFiles={fetchOneDriveFiles}
                  navigationBack={navigationBack}
                  setFileName={setFileName}
                  searchFiles={searchFiles}
                  session={session}
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
