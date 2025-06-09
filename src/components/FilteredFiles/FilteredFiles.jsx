import React from "react";
import FileList from "../FileList/FileList.jsx";

export default function FilteredFiles({ filteredFiles, fetchOneDriveFiles }) {
  return (
    <ul className="filtered-files file-list-container">
      {filteredFiles.length > 0 ? (
        filteredFiles.map((file) => (
          <FileList
            key={file.id}
            file={file}
            fetchOneDriveFiles={fetchOneDriveFiles}
          />
        ))
      ) : (
        <p>No files found</p>
      )}
    </ul>
  );
}
