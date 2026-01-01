import React, { useState, useEffect, useRef } from "react";
import Create from "./Create";
import axios from "axios";

function Home() {
  const [todos, setTodos] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingCaretPos, setEditingCaretPos] = useState(null);
  const inputRef = useRef(null);
  const ignoreBlurRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTodos = async (q = "", page = 1, per = itemsPerPage) => {
    try {
      const url = `http://localhost:3001/search?q=${encodeURIComponent(
        q
      )}&page=${page}&perPage=${per}`;
      const res = await axios.get(url);
      setTodos(res.data.items || []);
      setTotalCount(res.data.total || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error(err);
    }
  };

  // reset page when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  // fetch when search, page or page size changes
  useEffect(() => {
    fetchTodos(searchQuery, currentPage, itemsPerPage);
  }, [searchQuery, currentPage, itemsPerPage]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/delete/${id}`);
      // adjust pagination if needed (if current page becomes empty after deletion)
      const newTotal = Math.max(0, totalCount - 1);
      const totalPages =
        itemsPerPage === 0
          ? 1
          : Math.max(1, Math.ceil(newTotal / itemsPerPage));
      const newPage = Math.min(currentPage, totalPages);
      setCurrentPage(newPage);
      // fetch the page (newPage may be same as current)
      fetchTodos(searchQuery, newPage, itemsPerPage);
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (todo, e) => {
    // compute approximate caret position based on click X within the text element
    let caret = null;
    try {
      if (e && e.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX || (e.nativeEvent && e.nativeEvent.clientX);
        if (rect && clickX) {
          const relative = Math.max(
            0,
            Math.min(1, (clickX - rect.left) / (rect.width || 1))
          );
          caret = Math.floor(relative * todo.text.length);
        }
      }
    } catch (err) {
      // ignore calculation errors
    }

    setEditingId(todo._id);
    setEditingText(todo.text);
    setEditingCaretPos(caret);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = async (id, originalText) => {
    try {
      const trimmed = editingText.trim();
      // If empty after trimming, cancel edit instead of saving
      if (!trimmed) {
        setEditingId(null);
        setEditingText("");
        return;
      }
      // If no change, just close editor
      if (originalText !== undefined && originalText === editingText) {
        setEditingId(null);
        setEditingText("");
        return;
      }
      const res = await axios.put(`http://localhost:3001/update/${id}`, {
        text: editingText,
      });
      // re-fetch to ensure consistency with server side views/pagination
      setEditingId(null);
      setEditingText("");
      fetchTodos(searchQuery, currentPage, itemsPerPage);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (editingId && inputRef.current) {
      const pos =
        editingCaretPos != null ? editingCaretPos : editingText.length;
      const p = Math.max(0, Math.min(pos, editingText.length));

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          try {
            inputRef.current.setSelectionRange(p, p);
          } catch (e) {
            // some browsers may throw if control isn't ready
          }
        }
        setEditingCaretPos(null);
      }, 0);
    }
  }, [editingId]);

  // Server provides filtered results based on `searchQuery` so display them directly
  const displayedTodos = todos;

  return (
    <div>
      <h1 id="headerTilte">Add To Do Lists</h1>
      <Create
        onAdd={() => {
          // Re-fetch current page to reflect server state after add
          fetchTodos(searchQuery, currentPage, itemsPerPage);
        }}
        onSearch={(q) => setSearchQuery(q || "")}
      />

      {searchQuery && <p>Showing results for "{searchQuery}"</p>}

      {displayedTodos.length === 0 ? (
        <p>No todos available</p>
      ) : (
        <>
          {(() => {
            const paged =
              itemsPerPage === 0
                ? displayedTodos
                : displayedTodos.slice(0, itemsPerPage);
            return paged.map((todo) => (
              <div key={todo._id} className="task">
                <div className="content">
                  {editingId === todo._id ? (
                    <div className="edit-row">
                      <input
                        ref={inputRef}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            saveEdit(todo._id, todo.text);
                          }
                        }}
                        onBlur={() => {
                          if (ignoreBlurRef.current) {
                            ignoreBlurRef.current = false;
                            return;
                          }
                          saveEdit(todo._id, todo.text);
                        }}
                      />
                      <button
                        type="button"
                        onMouseDown={() => (ignoreBlurRef.current = true)}
                        onClick={() => saveEdit(todo._id, todo.text)}>
                        Save
                      </button>
                      <button
                        type="button"
                        onMouseDown={() => (ignoreBlurRef.current = true)}
                        onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <h3 onDoubleClick={(e) => startEdit(todo, e)}>
                      {todo.text}
                    </h3>
                  )}
                </div>
                <div
                  className="right"
                  onClick={() => handleDelete(todo._id)}
                  title="Delete">
                  <span className="icon right-icon">🗑️</span>
                </div>
              </div>
            ));
          })()}

          <div className="list-controls">
            <select
              id="itemsPerPageSelect"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={0}>All</option>
            </select>
            <span className="list-info">
              Showing {todos.length} of {totalCount}
            </span>
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <span className="page-info">
              Page {currentPage} of{" "}
              {itemsPerPage === 0
                ? 1
                : Math.max(1, Math.ceil(totalCount / itemsPerPage))}
            </span>
            <button
              type="button"
              disabled={
                itemsPerPage !== 0 &&
                currentPage >= Math.max(1, Math.ceil(totalCount / itemsPerPage))
              }
              onClick={() => setCurrentPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
