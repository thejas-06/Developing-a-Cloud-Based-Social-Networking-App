const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const PostLike = require("../models/PostLike");
const paginate = require("../util/paginate");
const cooldown = new Set();

USER_LIKES_PAGE_SIZE = 9;

const createPost = async (req, res) => {
  try {
    const { title, content, userId } = req.body;

    if (!(title && content)) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    if (cooldown.has(userId)) {
      return res.status(429).json({
        error: "You are posting too frequently. Please try again shortly."
      });
    }

    cooldown.add(userId);
    setTimeout(() => {
      cooldown.delete(userId);
    }, 60000);

    const post = await Post.create({
      title,
      content,
      poster: userId,
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("Create post error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Invalid post data provided" });
    }
    return res.status(500).json({ error: "An error occurred while creating the post" });
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = await Post.findById(postId)
      .populate("poster", "-password")
      .lean();

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (userId) {
      await setLiked([post], userId);
    }

    await enrichWithUserLikePreview([post]);

    return res.json(post);
  } catch (err) {
    console.error("Get post error:", err);
    return res.status(500).json({ error: "An error occurred while fetching the post" });
  }
};

const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content, userId, isAdmin } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.poster != userId && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to update post" });
    }

    post.content = content;
    post.edited = true;

    await post.save();

    return res.json(post);
  } catch (err) {
    console.error("Update post error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Invalid post data provided" });
    }
    return res.status(500).json({ error: "An error occurred while updating the post" });
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId, isAdmin } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.poster != userId && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to delete post" });
    }

    await post.remove();

    await Comment.deleteMany({ post: post._id });

    return res.json(post);
  } catch (err) {
    console.error("Delete post error:", err);
    return res.status(500).json({ error: "An error occurred while deleting the post" });
  }
};

const setLiked = async (posts, userId) => {
  let searchCondition = {};
  if (userId) searchCondition = { userId };

  const userPostLikes = await PostLike.find(searchCondition); //userId needed

  posts.forEach((post) => {
    userPostLikes.forEach((userPostLike) => {
      if (userPostLike.postId.equals(post._id)) {
        post.liked = true;
        return;
      }
    });
  });
};

const enrichWithUserLikePreview = async (posts) => {
  const postMap = posts.reduce((result, post) => {
    result[post._id] = post;
    return result;
  }, {});

  const postLikes = await PostLike.find({
    postId: { $in: Object.keys(postMap) },
  })
    .limit(200)
    .populate("userId", "username");

  postLikes.forEach((postLike) => {
    const post = postMap[postLike.postId];
    if (!post.userLikePreview) {
      post.userLikePreview = [];
    }
    post.userLikePreview.push(postLike.userId);
  });
};

const getUserLikedPosts = async (req, res) => {
  try {
    const likerId = req.params.id;
    const { userId } = req.body;
    let { page, sortBy } = req.query;

    if (!sortBy) sortBy = "-createdAt";
    if (!page) page = 1;

    let posts = await PostLike.find({ userId: likerId })
      .sort(sortBy)
      .populate({ path: "postId", populate: { path: "poster" } })
      .lean();

    posts = paginate(posts, 10, page);

    const count = posts.length;

    let responsePosts = [];
    posts.forEach((post) => {
      responsePosts.push(post.postId);
    });

    if (userId) {
      await setLiked(responsePosts, userId);
    }

    await enrichWithUserLikePreview(responsePosts);

    return res.json({ data: responsePosts, count });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const { userId } = req.body;

    let { page, sortBy, author, search, liked } = req.query;

    if (!sortBy) sortBy = "-createdAt";
    if (!page) page = 1;

    let posts = await Post.find()
      .populate("poster", "-password")
      .sort(sortBy)
      .lean();

    if (author) {
      posts = posts.filter((post) => post.poster.username == author);
    }

    if (search) {
      posts = posts.filter((post) =>
        post.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    const count = posts.length;

    posts = paginate(posts, 10, page);

    if (userId) {
      await setLiked(posts, userId);
    }

    await enrichWithUserLikePreview(posts);

    return res.json({ data: posts, count });
  } catch (err) {
    console.log(err.message);
    return res.status(400).json({ error: err.message });
  }
};

const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const existingPostLike = await PostLike.findOne({ postId, userId });

    if (existingPostLike) {
      return res.status(409).json({ error: "Post is already liked" });
    }

    await PostLike.create({
      postId,
      userId,
    });

    post.likeCount = (await PostLike.find({ postId })).length;

    await post.save();

    return res.json({ success: true });
  } catch (err) {
    console.error("Like post error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Invalid like data provided" });
    }
    return res.status(500).json({ error: "An error occurred while liking the post" });
  }
};

const unlikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const existingPostLike = await PostLike.findOne({ postId, userId });

    if (!existingPostLike) {
      return res.status(409).json({ error: "Post is not liked" });
    }

    await existingPostLike.remove();

    post.likeCount = (await PostLike.find({ postId })).length;

    await post.save();

    return res.json({ success: true });
  } catch (err) {
    console.error("Unlike post error:", err);
    return res.status(500).json({ error: "An error occurred while unliking the post" });
  }
};

const getUserLikes = async (req, res) => {
  try {
    const { postId } = req.params;
    const { anchor } = req.query;

    const postLikesQuery = PostLike.find({ postId: postId })
      .sort("_id")
      .limit(USER_LIKES_PAGE_SIZE + 1)
      .populate("userId", "username");

    if (anchor) {
      postLikesQuery.where("_id").gt(anchor);
    }

    const postLikes = await postLikesQuery.exec();

    const hasMorePages = postLikes.length > USER_LIKES_PAGE_SIZE;

    if (hasMorePages) postLikes.pop();

    const userLikes = postLikes.map((like) => {
      return {
        id: like._id,
        username: like.userId.username,
      };
    });

    return res
      .status(400)
      .json({ userLikes: userLikes, hasMorePages, success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getPost,
  getPosts,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getUserLikedPosts,
  getUserLikes,
};
