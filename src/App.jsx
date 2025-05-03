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

  async function fetchOneDriveFiles(folderId = null, parentId = null) {
    const token = account.accessToken;

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
    setFiles(data.value);
    if (parentId) {
      setParentFolderStack((prev) => [...prev, parentId]);
    }
    console.log(data);
    if (allFiles.length === 0) {
      loadAllFiles();
    }
  }

  async function loadAllFiles(folderId = null) {
    const token = account.accessToken;
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
    console.log(data);
    setAllFiles((prevAllFiles) => [...prevAllFiles, ...data.value]);
    for (const items of data.value) {
      if (items.folder) {
        await loadAllFiles(items.id);
      }
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
                />
              }
            />
          </Routes>
        </BrowserRouter>
      </main>
    </>
  );
}
