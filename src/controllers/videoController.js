import Video from "../models/Video";
import Comment from "../models/Comment";
import User from "../models/User";

export const home = async (req, res) => {
  const videos = await Video.find({})
    .sort({ createdAt: "desc" })
    .populate("owner");
  return res.render("home", { pageTitle: "Home", videos });
};
export const watch = async (req, res) => {
  const { id } = req.params;

  const video = await Video.findById(id)
    .populate({ path: "owner" })
    .populate({
      path: "comments",
      populate: { path: "owner" },
    });
  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }

  return res.render("watch", { pageTitle: video.title, video });
};

export const getEdit = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }
  if (String(video.owner) !== String(_id)) {
    req.flash("error", "You are not the owner of the video");
    return res.status(403).redirect("/");
  }
  return res.render("edit", { pageTitle: `Edit: ${video.title}`, video });
};

export const postEdit = async (req, res) => {
  const {
    user: { _id },
  } = req.session;
  const { id } = req.params;
  const { title, description, hashtags } = req.body;
  const video = await Video.findById({ _id: id });
  if (!video) {
    return res.render("404", { pageTitle: "Video not found." });
  }
  if (String(video.owner) !== String(_id)) {
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndUpdate(id, {
    title,
    description,
    hashtags: Video.formatHashtags(hashtags),
  });
  req.flash("success", "Change saved");
  return res.redirect(`/videos/${id}`);
};

export const getUpload = (req, res) => {
  return res.render("upload", { pageTitle: "Upload Video" });
};

export const postUpload = async (req, res) => {
  const {
    user: { _id },
  } = req.session;
  const { video, thumb } = req.files;
  const { title, description, hashtags } = req.body;
  const isServer = process.env.NODE_ENV === "production";
  try {
    const newVideo = await Video.create({
      title,
      description,
      fileUrl: isServer ? video[0].location : video[0].path,
      thumbUrl: isServer
        ? thumb[0].location.replace(/[\\]/g, "/")
        : thumb[0].location.replace(/[\\]/g, "/"),
      owner: _id,
      hashtags: Video.formatHashtags(hashtags),
    });
    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    user.save();
    return res.redirect("/");
  } catch (error) {
    return res.status(400).render("upload", {
      pageTitle: "Upload Video",
      errorMessage: error._message,
    });
  }
};

export const deleteVideo = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  const user = await User.findById(_id);

  if (!video) {
    return res.status(404).render("404", { pageTitle: "Video not found." });
  }
  if (String(video.owner) !== String(_id)) {
    return res.status(403).redirect("/");
  }

  await Comment.deleteMany({ video: video._id });
  await Video.findByIdAndDelete(id);
  user.videos.splice(user.videos.indexOf(id), 1);
  user.save();
  return res.redirect("/");
};

export const search = async (req, res) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
    videos = await Video.find({
      title: {
        $regex: new RegExp(keyword, "i"),
      },
    }).populate("owner");
  }
  return res.render("search", { pageTitle: "Search", videos });
};

export const registerView = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  video.meta.views = video.meta.views + 1;
  await video.save();
  return res.sendStatus(200);
};

export const createComment = async (req, res) => {
  const {
    session: { user },
    body: { text },
    params: { id },
  } = req;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  const comment = await Comment.create({
    text,
    owner: user._id,
    video: id,
  });
  const newComment = await Comment.findById(comment._id).populate("owner");
  video.comments.push(comment._id);
  await video.save();
  return res.status(201).json({ newComment });
};

export const deleteComment = async (req, res) => {
  const {
    session: {
      user: { _id },
    },
    params: { commentId },
  } = req;

  const comment = await Comment.findById(commentId).populate("owner");
  const videoId = comment.video;
  if (_id !== comment.owner._id.toString()) {
    return res.sendStatus(403);
    //에러메세지 추가
  }
  const video = await Video.findById(videoId);
  if (!video) {
    return res.sendStatus(404);
    //에러메세지 추가
  }

  video.comments.splice(video.comments.indexOf(commentId), 1);
  await video.save();

  const deletedComment = await Comment.findByIdAndDelete(commentId);
  if (!deletedComment) {
    return res.sendStatus(404);
    //에러메세지 추가
  } else {
    return res.sendStatus(200);
  }
};

export const commentLike = async (req, res) => {
  const {
    params: { commentId },
    session: {
      user: { _id },
    },
  } = req;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return res.sendStatus(404);
  }

  const user = await User.findById(_id);

  if (!user) {
    return res.sendStatus(404);
  }

  let likeCount;
  if (comment.like.includes(_id)) {
    comment.like.remove(_id);
    await comment.save();
    likeCount = comment.like.length;
    return res.status(201).json({ likeCount });
  }
  comment.like.push(_id);
  await comment.save();
  likeCount = comment.like.length;
  return res.status(201).json({ likeCount });
};

export const videoLike = async (req, res) => {
  const {
    params: { id },
    session: {
      user: { _id },
    },
  } = req;
  const video = await Video.findById(id);

  if (!video) {
    return res.sendStatus(404);
  }

  const user = await User.findById(_id);

  if (!user) {
    return res.sendStatus(404);
  }

  let likeCount;
  if (video.like.includes(_id)) {
    video.like.remove(_id);
    await video.save();
    user.likeVideos.remove(id);
    await user.save();
    likeCount = video.like.length;
    return res.status(201).json({ likeCount });
  }
  video.like.push(_id);
  await video.save();
  user.likeVideos.push(id);
  await user.save();
  likeCount = video.like.length;
  return res.status(201).json({ likeCount });
};

export const followUser = async (req, res) => {
  const {
    params: { id },
    session: {
      user: { _id },
    },
  } = req;
  const owner = await User.findById(id);

  if (!owner) {
    return res.sendStatus(404);
  }

  const user = await User.findById(_id);

  if (!user) {
    return res.sendStatus(404);
  }
  let text;
  if (owner.follower.includes(_id)) {
    owner.follower.remove(_id);
    await owner.save();
    user.following.remove(id);
    await user.save();
    text = "구독";
    return res.status(201).json({ text });
  }
  owner.follower.push(_id);
  await owner.save();
  user.following.push(id);
  await user.save();
  text = "구독중";
  return res.status(201).json({ text });
};
