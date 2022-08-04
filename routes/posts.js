// app.js -> index.js의 Router를 통해 들어온 이파일은, 기본값 '/posts'로 연결된 요청을 처리

// 이 파일에서 사용할 라우터 객체 생성
const express = require("express");
const router = express.Router();

// 이 파일에서 사용할 post DB가 어떻게 생겼는지 불러옴
const { Post } = require("../models");
const { User } = require("../models")

// 사용자 인증 미들웨어
const authMiddleware = require("../middlewares/auth-middleware");


// 게시글 조회 with GET ('/posts')
router.get("/", async (req, res) => {
  try {
    // 몽고디비 데이터베이스 상의 'Post'에서 모든 데이터를 createdAt의 내림차순으로 불러온 후,
    const dataAll = await Post.findAll({ order: [["createdAt", "DESC"]], });
    // data 배열에 하나씩 넣어 줍니다. (push)
    const data = [];

    for (let i = 0; i < dataAll.length; i++) {
      data.push({
        postId: dataAll[i].id.toString(), // 이 때 ObjectId 객체로 불러와진 값은 문자열로 바꿉니다.
        userId: dataAll[i].userId,
        nickname: dataAll[i].nickname,
        title: dataAll[i].title,
        createdAt: dataAll[i].createdAt,
        updatedAt: dataAll[i].updatedAt,
      });
    }
    res.status(200).json({ data: data }); // 값이 다 넣어진 배열을 Response 해줍니다.
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});


// 게시글 작성 with POST ('/posts')
router.post("/", authMiddleware, async (req, res) => {
  try {
    // user 정보를 미들웨어를 통해 받음
    const { user } = await res.locals;
    const { title, content } = req.body;

    // 그 변수들을 Post DB에 create - 생성해줍니다.
    await Post.create({
      userId: user.userId,
      nickname: user.nickname,
      title,
      content,
    });

    // 명세서대로 Response를 반환 해줍니다.
    res.status(201).json({ message: "게시글을 생성하였습니다." });
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});


// 게시글 상세조회 with GET ('/posts/:_postId')
router.get("/:_postId", async (req, res) => {
  try {
    // URL 뒤쪽에 params{ 로 전달받은 _postId를 사용하겠다고 변수 선언합니다.
    const { _postId } = req.params;
    // 이 _postId를 id로 가진 DB 요소를 모두 찾아서 thisPost라는 변수에 넣습니다.
    const thisPost = await Post.findOne({ where: { id: _postId } });

    // DB에서 찾아낸 thisPost의 개수가 0개이면, 없다고 response 합니다.
    if (!thisPost) {
      return res.status(400).json({ message: "해당 게시글이 없습니다." });
    }

    // 그렇지 않으면,
    const data = [
      {
        postId: thisPost.id.toString(),
        userId: thisPost.userId,
        nickname: thisPost.nickname,
        title: thisPost.title,
        content: thisPost.content,
        createdAt: thisPost.createdAt,
        updatedAt: thisPost.updatedAt,
      },
    ];

    // 그 데이터를 Response 합니다.
    res.status(200).json({ data: data });

  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});


// 게시글 수정 with PUT ('/posts/:_postId')
router.put("/:_postId", authMiddleware, async (req, res) => {
  try {
    // URL 뒤쪽에 params로 전달받은 _postId를 사용하겠다고 변수 선언합니다.
    const { _postId } = req.params;
    // 동시에 수정할 내용을 Request body에 담아 받게 되는데
    const { title, content } = req.body;

    // 이 _postId를 id로 가진 DB 요소를 모두 찾아서 thisPost라는 변수에 넣습니다.
    const thisPost = await Post.findOne({ where: { id: _postId } });

    // 마찬가지로 찾아낸 게 없으면 게시글 수정을 진행할 수 없습니다.
    if (!thisPost) {
      return res.status(400).json({ message: "해당 게시글이 없습니다." });
    }

    // 작성자가 아니면 수정 불가
    const { user } = await res.locals;
    if (user.nickname != thisPost.nickname) {
      return res.status(400).json({ message: "작성자만 수정할 수 있습니다." });
    }

    // 다 만족하면 if문을 거치지 않고 여기까지 오는데, 그 Post를 update합니다.
    await Post.update(
      { title, content }, // 어떤 댓글을 수정할지 넣고,
      {
        where: {
          id: _postId,
        },
      }
    );

    // 수정이 원활하게 진행되면 게시글을 수정하였다는 Response를 보냅니다.
    res.status(200).json({ message: "게시글을 수정하였습니다." });
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});


// 게시글 삭제 with DELETE ('/posts/:_postId')
router.delete("/:_postId", async (req, res) => {
  try {
    // URL 뒤쪽에 params로 전달받은 _postId를 사용하겠다고 변수 선언합니다.
    const { _postId } = req.params;

    // 입력 받은 _postId와 동일한 요소를 DB에서 찾아냅니다.
    const thisPost = await Post.findOne({ where: { id: _postId } });
    // 찾은 게 없으면 실패를 Response 하고,
    if (!thisPost) {
      return res.status(400).json({ message: "해당 게시글이 없습니다." });
    }

    
    const { user } = await res.locals;
    if (user.nickname != thisPost.nickname) {
      return res.json({ message: "삭제 권한이 없습니다." });
    } else {
      await Post.destroy({
        where: {
          id: _postId,
        },
      });
      // 여기까지 왔으면 게시글이 삭제되었으므로 삭제하게 됩니다.
      res.status(200).json({ message: "게시글을 삭제하였습니다." });
    }
  } catch (error) {
    const message = `${req.method} ${req.originalUrl} : ${error.message}`;
    console.log(message);
    res.status(400).json({ message });
  }
});



// 이 파일의 router 객체를 외부에 공개합니다.
module.exports = router;