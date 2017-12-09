const mongoose = require('mongoose');

// reference to Schema constructor
const Schema = mongoose.Schema;

// create new UserSchema object
const ArticleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  URL: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: false
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }
});

var Article = mongoose.model('Article', ArticleSchema);

module.exports = Article;
