const Comment = require("../models/Comment");
const Post = require("../models/Post");
const paginate = require("../util/paginate");
const cooldown = new Set();

const createComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content, parentId, userId } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (cooldown.has(userId)) {
      return res.status(429).json({
        error: "You are commenting too frequently. Please try again shortly."
      });
    }

    cooldown.add(userId);
    setTimeout(() => {
      cooldown.delete(userId);
    }, 30000);

    const comment = await Comment.create({
      content,
      parent: parentId,
      post: postId,
      commenter: userId,
    });

    post.commentCount += 1;

    await post.save();

    await Comment.populate(comment, { path: "commenter", select: "-password" });

    return res.status(201).json(comment);
  } catch (err) {
    console.error("Create comment error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Invalid comment data provided" });
    }
    return res.status(500).json({ error: "An error occurred while creating the comment" });
  }
};

const getPostComments = async (req, res) => {
  try {
    const postId = req.params.id;

    const comments = await Comment.find({ post: postId })
      .populate("commenter", "-password")
      .sort("-createdAt");

    let commentParents = {};
    let rootComments = [];

    for (let i = 0; i < comments.length; i++) {
      let comment = comments[i];
      commentParents[comment._id] = comment;
    }

    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      if (comment.parent) {
        let commentParent = commentParents[comment.parent];
        commentParent.children = [...commentParent.children, comment];
      } else {
        rootComments = [...rootComments, comment];
      }
    }

    return res.json(rootComments);
  } catch (err) {
    console.error("Get post comments error:", err);
    return res.status(500).json({ error: "An error occurred while fetching comments" });
  }
};

const getUserComments = async (req, res) => {
  try {
    const userId = req.params.id;

    let { page, sortBy } = req.query;

    if (!sortBy) sortBy = "-createdAt";
    if (!page) page = 1;

    let comments = await Comment.find({ commenter: userId })
      .sort(sortBy)
      .populate("post");

    return res.json(comments);
  } catch (err) {
    console.error("Get user comments error:", err);
    return res.status(500).json({ error: "An error occurred while fetching user comments" });
  }
};

const updateComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { userId, content, isAdmin } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.commenter != userId && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to update comment" });
    }

    comment.content = content;
    comment.edited = true;
    await comment.save();

    return res.json(comment);
  } catch (err) {
    console.error("Update comment error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Invalid comment data provided" });
    }
    return res.status(500).json({ error: "An error occurred while updating the comment" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { userId, isAdmin } = req.body;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.commenter != userId && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to delete comment" });
    }

    await comment.remove();

    const post = await Post.findById(comment.post);

    post.commentCount = (await Comment.find({ post: post._id })).length;

    await post.save();

    return res.json(comment);
  } catch (err) {
    console.error("Delete comment error:", err);
    return res.status(500).json({ error: "An error occurred while deleting the comment" });
  }
};

module.exports = {
  createComment,
  getPostComments,
  getUserComments,
  updateComment,
  deleteComment,
};
