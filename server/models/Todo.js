const mongoose = require('mongoose');
const TodoSchema = new mongoose.Schema({
    text: String
});

const todoModel = mongoose.model('Todos', TodoSchema);

module.exports = todoModel;
