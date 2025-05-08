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
  resetData,
}) {
  const navigate = useNavigate();

  React.useEffect(() => {
    console.log("Fetching user");
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please Login First");
      navigate("/");
    }
    fetch("http://localhost:3000/api/auth/user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        if (!data.success) {
          alert(data.message + " Please login again.");
          navigate("/");
        }
        setAccount(data.data);
      });
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
