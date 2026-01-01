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

  useEffect(() => {
    axios
      .get("http://localhost:3001/get")
      .then((result) => setTodos(result.data))
      .catch((err) => console.error(err));
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/delete/${id}`);
      setTodos((prev) => prev.filter((t) => t._id !== id));
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
      setTodos((prev) => prev.map((t) => (t._id === id ? res.data : t)));
      setEditingId(null);
      setEditingText("");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (editingId && inputRef.current) {
      const pos =
        editingCaretPos != null ? editingCaretPos : editingText.length;
      const p = Math.max(0, Math.min(pos, editingText.length));
      // wait a tick for the input to be present/focused
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

  // Filter todos locally based on searchQuery
  const displayedTodos = todos.filter((t) =>
    t.text.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div>
      <h1>Add To Do Lists</h1>
      <Create
        onAdd={(todo) => setTodos((prev) => [todo, ...prev])}
        onSearch={(q) => setSearchQuery(q || "")}
      />

      {searchQuery && <p>Showing results for "{searchQuery}"</p>}

      {displayedTodos.length === 0 ? (
        <p>No todos available</p>
      ) : (
        displayedTodos.map((todo) => (
          <div key={todo._id} className="task">
            <div className="left" onClick={() => startEdit(todo)} title="Edit">
              <span className="icon left-icon">✏️</span>
            </div>
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
                <h3 onDoubleClick={(e) => startEdit(todo, e)}>{todo.text}</h3>
              )}
            </div>
            <div
              className="right"
              onClick={() => handleDelete(todo._id)}
              title="Delete">
              <span className="icon right-icon">🗑️</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Home;
