// app.js -> index.js의 Router를 통해 들어온 이파일은, 기본값 '/comments'로 연결된 요청을 처리함

// 이 파일에서 사용할 라우터 객체 생성
const express = require("express");
const router = express.Router();

// 이 파일에서 사용할 post와 comment DB가 어떻게 생겼는지 불러옴
const { Comment } = require("../models");
const { Post } = require("../models");

const authMiddleware = require("../middlewares/auth-middleware");


// 댓글 생성 with POST ('/comments/_postId')
router.post("/:_postId", authMiddleware, async (req, res) => {
  try {
    // URL 뒤쪽에 params로 전달받은 _postId를 사용하겠다고 변수 선언합니다.
    const { _postId } = req.params;

    // request body 에 적힌 변수들을 기록해둡니다.
    const { comment } = req.body;

    // body에 입력받은 수정할 댓글이 없으면 수정할 수 없습니다~~
    if (!comment) {
      return res.status(400).json({ message: "댓글 내용을 입력해주세요" });
    }

    // _postId 와 일치하는 데이터를 DB에서 찾습니다.
    const posts = await Post.findOne({where : { _id: _postId } });

    // 찾은 게 없으면, 종료합니다.
    if (!posts) {
      return res.status(400).json({ message: "해당 게시글이 없습니다." });
    }

    
    const { user } = await res.locals;

    await Comment.create({
      _postId,
      userId: user.userId,
      nickname: user.nickname,
      comment,
    });

    // Response 답변합니다.
    res.status(200).json({ message: "댓글을 생성하였습니다." });
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});


// 댓글 목록 조회 with GET ('/comments/_postId')
router.get("/:_postId", async (req, res) => {
  try {
    // URL 뒤쪽에 params로 전달받은 _postId를 사용하겠다고 변수 선언합니다.
    const { _postId } = req.params;

    // postId가 일치하는 게시글을 되도록 날짜 내림차순으로 불러와 찾아보고,
    const posts = await Post.findAll({ where : { _id: _postId }, order : [["createdAt", "DESC"]], });

    // 없으면 댓글을 못씁니다~~
    if (!posts.length) {
      return res.status(400).json({ message: "해당 게시글이 없습니다." });
    }

    // postId 게시글에 남겨져 있는 댓글을 Comments DB에서 날짜 내림차순으로 모두 찾아서
    const allCommentInfo = await Comment.findAll({ where : { _postId }, order: [[ "createdAt", "DESC" ]], });
    const data = [];

    // 이 게시물의 댓글을 하나씩 돌면서, 응답할 배열에 넣어서 반환합니다.
    for (let i = 0; i < allCommentInfo.length; i++) {
      data.push({
        commentId: allCommentInfo[i]._id.toString(),
        userId: allCommentInfo[i].userId,
        nickname: allCommentInfo[i].nickname,
        comment: allCommentInfo[i].comment,
        createdAt: allCommentInfo[i].createdAt,
      });
    }

    // 완성된 배열은 명세서와 동일한 모양으로 나오도록 가공하여, Response json으로 응답함
    res.status(200).json({ data: data });
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});

// ------------------
// 댓글 수정 with PUT ('/comments/_commentId')
router.put("/:_commentId", authMiddleware, async (req, res) => {
  try {
    // params로 전달 받은 댓글번호 _commentId와
    const { _commentId } = req.params;
    // body로 전달 받은 password와 comment 확보합니다.
    const { comment } = req.body;

    // params 로 입력받은 _commentId에 해당하는 댓글을 찾아서,
    const comments = await Comment.findOne({ where : { _id: _commentId } });
    // 해당하는 댓글이 없으면 수정할 수 없습니다~~
    if (!comments) {
      return res.status(400).json({ message: "해당 댓글이 없습니다." });
    }

    // body에 입력받은 수정할 댓글이 없으면 수정할 수 없습니다~~
    if (!comment) {
      return res.status(400).json({ message: "댓글 내용을 입력해주세요" });
    }

    const { user } = await res.locals;
    if (user.nickname != comments.nickname) {
      return res.status(401).json({ message: "권한이 없습니다." })
    }

    // 해당 댓글을 업데이트 합니다.
    await Comment.update(
      {
        comment // 어떤 댓글을 수정할지 넣고,
      },
      {
        // 뭐라고 수정할지 정의합니다.
        where: {
          _id: _commentId,
        },
      }
    );

    // 수정이 끝났으므로 메세지를 Response 합니다.
    res.status(201).json({ message: "댓글을 수정하였습니다." });
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});

// 게시글 삭제 with DELETE ('/comments/_commentId')
router.delete("/:_commentId", authMiddleware, async (req, res) => {
  try {
    // params로 전달 받은 댓글번호 _commentId와
    const { _commentId } = req.params;
    
    // _commentId 와 일치하는 comments를 불러옵니다.
    const comments = await Comment.findOne({ where : { _id: _commentId } });

    // 찾은 게 없으면 삭제할 수 없습니다.
    if (!comments) {
      return res.status(400).json({ message: "해당 댓글이 없습니다." });
    }

    const { user } = await res.locals;

    if (user.nickname != comments.nickname) {
      return res.status(401).json({ message: "권한이 없습니다." });
    } else {
      await Comment.destroy({ where: { _id: _commentId } });

      // 지웠으니까 여기서 메세지를 Response 합니다.
      return res.status(201).json({ message: "댓글을 삭제하였습니다." });
    }
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});


module.exports = router;