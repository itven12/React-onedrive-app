import React from "react";
import SearchBar from "./components/SearchBar/SearchBar.jsx";
import FileList from "./components/FileList/FileList.jsx";
import { useMsal } from "@azure/msal-react";
import "./App.css";

export default function App() {
  const [account, setAccount] = React.useState(
    JSON.parse(localStorage.getItem("account")) || null
  );
  const [files, setFiles] = React.useState([]);
  const [fileName, setFileName] = React.useState("");
  const [parentFolderStack, setParentFolderStack] = React.useState([]);
  const { instance } = useMsal();

  React.useEffect(() => {
    if (!account) return;
    fetchOneDriveFiles();
  }, [account]);

  function handleLogin() {
    instance
      .loginPopup({
        scopes: ["User.Read", "Files.Read.All"],
      })
      .then((res) => {
        console.log(res);
        const user = {
          name: res.account.name,
          username: res.account.username,
          accessToken: res.accessToken,
        };
        setAccount(user);
        localStorage.setItem("account", JSON.stringify(user));
      })
      .catch((err) => console.log(err));
  }

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
  }

  async function searchFiles() {
    const token = account.accessToken;
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root/search(q=${`'${fileName}'`})`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    setFiles(data.value);
  }

  return (
    <>
      <header>
        <h1>Onedrive File Search</h1>
      </header>
      <main>
        <SearchBar setFileName={setFileName} handleSearch={searchFiles} />
        {!account && (
          <button className="login-button" onClick={handleLogin}>
            Login with Microsoft
          </button>
        )}{" "}
        {account && (
          <div className="user-info">
            <p>
              {" "}
              Welcome {account.name} ({account.username}){" "}
            </p>
          </div>
        )}
        <ul className="file-list-container">
          <div className="navigation" onClick={navigationBack}>
            <img className="back-navigation" src="icon-back.png" />
          </div>
          <li className="file-list-header">
            <p className="file-name">Name</p>
            <p className="file-name">Modified</p>
            <p className="file-name">File size</p>
          </li>

          {files.length > 0 ? (
            files.map((file) => (
              <FileList
                key={file.id}
                file={file}
                fetchOneDriveFiles={fetchOneDriveFiles}
              />
            ))
          ) : (
            <div className="no-files">
              <img className="no-files-icon" src="icon-empty-folder.png" />
              <p className="no-files-text">The folder is empty</p>
            </div>
          )}
        </ul>
      </main>
    </>
  );
}
