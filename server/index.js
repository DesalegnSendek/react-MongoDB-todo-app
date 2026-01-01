const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const todoModel = require("./models/Todo");

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect("mongodb://127.0.0.1:27017/todos")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/get", (req, res) => {
  todoModel
    .find()
    .then((results) => res.json(results))
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.post("/add", (req, res) => {
  const text = req.body.text;
  todoModel
    .create({ text: text })
    .then((result) => res.json(result))
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.get("/todos", (req, res) => {
  todoModel
    .find()
    .then((results) => res.json(results))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Delete by id
app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;
  todoModel
    .findByIdAndDelete(id)
    .then((result) => res.json({ success: true }))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Update a todo by id
app.put("/update/:id", (req, res) => {
  const id = req.params.id;
  const text = req.body.text;
  todoModel
    .findByIdAndUpdate(id, { text }, { new: true })
    .then((result) => res.json(result))
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
