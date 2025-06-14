import "./SearchBar.css";

export default function SearchBar({
  setFileName,
  handleSearch,
  loadingAllFiles,
}) {
  console.log(loadingAllFiles);
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search for files..."
        name="fileName"
        className="file-name-input"
        onChange={(event) => setFileName(event.target.value)}
      />
      {loadingAllFiles ? null : (
        <button className="search-button" type="submit" onClick={handleSearch}>
          Search
        </button>
      )}
    </div>
  );
}
