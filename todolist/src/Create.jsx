import React, { useState } from "react";
import axios from "axios";

function Create({ onAdd, onSearch }) {
  const [task, setTask] = useState("");
  const handleAdd = async () => {
    if (!task.trim()) return;
    try {
      const res = await axios.post("http://localhost:3001/add", {
        text: task,
      });

      // notify parent about new todo so UI updates without manual refresh
      if (onAdd) onAdd(res.data);
      setTask("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Insert a new todo..."
        value={task}
        onChange={(e) => setTask(e.target.value)}
      />
      <button type="button" onClick={handleAdd} disabled={!task.trim()}>
        Add
      </button>
      <button type="button" onClick={() => onSearch && onSearch(task.trim())} disabled={!task.trim()}>
        Search
      </button>
      <button type="button" onClick={() => { setTask(''); if (onSearch) onSearch(''); }}>
        Clear
      </button>
    </div>
  );
}

export default Create;
