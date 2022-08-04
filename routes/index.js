// '/'로 들어온 경우에 '/posts' '/comments'로 연결해주는 역할을 함

// express와 이 파일의 router 객체 초기화
const express = require("express");
const router = express.Router();

// /posts, comments, signup으로 들어오는 건 아래 .js 파일에서 처리하겠다는 내용
const postsRouter = require("./posts");
const commentsRouter = require("./comments");
const usersRouter = require("./users")
router.use("/posts", [postsRouter]);
router.use("/comments", [commentsRouter]);
router.use("/", [usersRouter]);

// 이 파일에서 만든 router 객체를 외부에 공개 -> app.js에서 사용할 수 있도록
module.exports = router;