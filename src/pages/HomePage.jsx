import React from "react";
import SearchBar from "../components/SearchBar/SearchBar.jsx";
import FileList from "../components/FileList/FileList.jsx";
import { useNavigate } from "react-router-dom";

export default function HomePage({
  account,
  setAccount,
  files,
  fetchOneDriveFiles,
  navigationBack,
  setFileName,
  searchFiles,
  session,
  resetData,
}) {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!session.isLoggedIn()) {
      navigate("/");
      resetData();
    } else {
      setAccount(JSON.parse(localStorage.getItem("account")));
    }
  }, []);

  function logout() {
    resetData();
    navigate("/");
  }
  return (
    <>
      <SearchBar setFileName={setFileName} handleSearch={searchFiles} />{" "}
      <div className="user-info">
        {account && (
          <p>
            {" "}
            Welcome {account.name} ({account.username}){" "}
          </p>
        )}
        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>
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
    </>
  );
}
