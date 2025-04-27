import "./FileList.css";

export default function FileList({ file, fetchOneDriveFiles }) {
  return (
    <li className="file-list">
      <p
        className="file-name"
        onClick={() => {
          if (file.folder) {
            fetchOneDriveFiles(file.id, file.parentReference.id);
          } else {
            window.open(file.webUrl);
          }
        }}
      >
        <span className="file-logo">
          <img
            src={
              file.folder
                ? "folder-icon.png"
                : `icon-${
                    file.file.mimeType.slice(-3) == "pdf"
                      ? file.file.mimeType.slice(-3)
                      : "file"
                  }.png`
            }
          />
        </span>
        {file.name}
      </p>
      <p className="date-modified">{file.lastModifiedDateTime.slice(0, 10)}</p>
      <p className="file-size">
        {file.size ? (file.size / (1024 * 1024)).toFixed(2) + "MB" : "0"}
      </p>
    </li>
  );
}
