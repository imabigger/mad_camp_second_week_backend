const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
});

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  region: {  // 'resion'에서 'region'으로 수정
    type: String,
    required: true
  },
  topic: {  // 'Topic'에서 'topic'으로 수정
    type: String,
    required: true
  },
  board: {
    type: Number,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  imageUrls: [{
    type: String,
  }],
  comments: [commentSchema],
  views: {
    type: Number,
    default: 0
  }
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
