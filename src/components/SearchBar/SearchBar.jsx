import "./SearchBar.css";

export default function SearchBar({ setFileName, handleSearch }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search for files..."
        name="fileName"
        className="file-name-input"
        onChange={(event) => setFileName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            handleSearch();
          }
        }}
      />
      <button className="search-button" type="submit" onClick={handleSearch}>
        Search
      </button>
    </div>
  );
}
