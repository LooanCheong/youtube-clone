import express from "express";
import {
  registerView,
  createComment,
  deleteComment,
  commentLike,
  videoLike,
  followUser,
} from "../controllers/videoController";

const apiRouter = express.Router();

apiRouter.post("/videos/:id([0-9a-f]{24})/view", registerView);
apiRouter.post("/videos/:id([0-9a-f]{24})/comment", createComment);
apiRouter.delete("/comments/:commentId([0-9a-f]{24})/delete", deleteComment);
apiRouter.post("/comments/:commentId([0-9a-f]{24})/like", commentLike);
apiRouter.post("/videos/:id([0-9a-f]{24})/like", videoLike);
apiRouter.post("/users/:id([0-9a-f]{24})/follow", followUser);

export default apiRouter;
