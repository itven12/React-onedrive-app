import React from "react";
import SearchBar from "../components/SearchBar/SearchBar.jsx";
import FileList from "../components/FileList/FileList.jsx";
import { useNavigate } from "react-router-dom";

export default function HomePage({
  account,
  setAccount,
  files,
  allFiles,
  setCategory,
  setFiles,
  fetchOneDriveFiles,
  navigationBack,
  setFileName,
  searchFiles,
  session,
  resetData,
  loadMoreFiles,
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

  function handleCategoryChange(event) {
    if (event.target === event.currentTarget) return;
    const btnEls = document.querySelectorAll(".category-button");
    btnEls.forEach((btn) => {
      if (btn === event.target) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
    const category = event.target.value;
    setCategory(category);
    if (category === "all") {
      fetchOneDriveFiles();
    } else {
      const filteredFiles = allFiles.filter((file) => {
        return file.file?.mimeType.includes(category);
      });
      const sortedFiles = filteredFiles.sort((file1, file2) => {
        return (
          new Date(file2.lastModifiedDateTime).getTime() -
          new Date(file1.lastModifiedDateTime).getTime()
        );
      });
      setFiles(sortedFiles);
      // allFiles.forEach((file) => console.log(file.file));
    }
  }

  function logout() {
    resetData();
    navigate("/");
  }

  // logout();
  return (
    <>
      <div className="user-info">
        {account && (
          <p>
            {" "}
            Welcome {account.name}, ({account.username}){" "}
          </p>
        )}
      </div>
      <button className="logout-button" onClick={logout}>
        Logout
      </button>
      <SearchBar setFileName={setFileName} handleSearch={searchFiles} />{" "}
      <div className="categories" onClick={handleCategoryChange}>
        <button className="category-button active" value={"all"}>
          All
        </button>
        <button
          className="category-button"
          value={"application"}
          // onClick={handleCategoryChange}
        >
          Documents
        </button>
        <button
          className="category-button"
          value={"image"}
          // onClick={handleCategoryChange}
        >
          Photos
        </button>
        <button
          className="category-button"
          value={"video"}
          // onClick={handleCategoryChange}
        >
          Videos
        </button>
        <button
          className="category-button"
          value={"audio"}
          // onClick={handleCategoryChange}
        >
          Audio
        </button>
      </div>
      <ul className="file-list-container">
        <div className="navigation" onClick={navigationBack}>
          <img className="back-navigation" src="icon-back.png" />
        </div>
        <li className="file-list-header">
          <p className="file-name-header">Name</p>
          <p className="file-modified-header">Modified</p>
          <p className="file-size-header">File size</p>
        </li>

        {files?.length > 0 ? (
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
      <div className="load-more">
        <button className="load-more-button" onClick={loadMoreFiles}>
          Load more files
        </button>
      </div>
    </>
  );
}
