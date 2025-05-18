import React from "react";
import "./FileList.css";

export default function FileList({ file, fetchOneDriveFiles }) {
  const fileListEl = React.useRef(null);
  React.useEffect(() => {
    const element = fileListEl.current;
    const observer = new IntersectionObserver(
      ([entry], observer) => {
        // const element = entry.target;
        if (entry.isIntersecting) {
          element.classList.remove("hidden");
          // observer.unobserve(element);
        } else {
          return;
        }
      },
      {
        root: null,
        threshold: 0.1,
      }
    );

    // const fileListEls = document.querySelectorAll(".file-list");

    observer.observe(element);
    return () => {
      observer.unobserve(element);
    };
  }, []);

  return (
    <li ref={fileListEl} className="file-list hidden">
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
