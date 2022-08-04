// 이 파일에서 사용할 라우터 객체 생성
const express = require("express");
const router = express.Router();
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const MYSECRETKEY = process.env.MYSECRETKEY;

const { Op } = require("sequelize");
// mysql로 변경 후 코드 수정, index 생략가능
const { User } = require("../models");

const postUsersSchema = Joi.object({
    // 최소 3자 이상, 알파벳 대소문자(a~z, A~Z), 숫자(0~9)로 구성
    nickname: Joi.string().alphanum().min(3).max(30).required(),
    // 최소 4자 이상이며, 닉네임과 같은 값이 포함된 경우 회원가입에 실패
    password: Joi.string().alphanum().min(4).max(30).required(),
    // 비밀번호 확인은 비밀번호와 정확하게 일치
    confirm: Joi.string().alphanum().min(3).max(30).required(),
})

// 회원가입 API with POST ('/signup')
router.post("/signup", async (req, res) => {
    try {
        const { nickname, password, confirm } = await postUsersSchema.validateAsync(req.body);

        if (req.headers.authorization) {
            res.status(401).send({
                errorMessage: "이미 로그인이 되어있습니다.",
            });
            return;
        }

        if (password !== confirm) {
            res.status(400).send({
                errorMessage: "패스워드가 일치하지 않습니다.",
            });
            return; // return을 하지 않으면 아래 코드가 실행됨 (예외를 줄여나가기)
        } else if (nickname === password) {
            res.status(400).send({
                errorMessage: "아이디와 패스워드를 다르게 입력해 주세요."
            });
            return;
        }

        const existUsers = await User.findAll({
            where: {
                [Op.or]: { nickname },
            },
        });
        if (existUsers.length) {
            res.status(400).send({
                errorMessage: "중복된 닉네임입니다.",
            });
            return;
        }

        await User.create({ nickname, password });

        res.status(201).json({ message: "회원 가입에 성공하였습니다." }); // 응답값 꼭 주어야 함
    } catch (error) {
        const message = `${req.method} ${req.originalUrl} : ${error.message}`;
        console.log(message);
        res.status(400).json({ message });
    }
});

const postLoginSchema = Joi.object({
    nickname: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().alphanum().min(4).max(30).required(),
});

// 로그인 API with POST ('/login')
router.post("/login", async (req, res) => {
    try {
        // 헤더가 인증정보를 가지고 있으면 (로그인 되어 있으면,) 반려
        // console.log(req.cookies);
        // if (req.cookies.token) {
        //     res.status(400).send({
        //         errorMessage: "이미 로그인이 되어있습니다.",
        //     });
        //     return;
        // }


        const { nickname, password } = await postLoginSchema.validateAsync(req.body);
        const user = await User.findOne({ where: { nickname, password } });
        if (!user) {
            res.status(401).send({
                errorMessage: "닉네임 또는 패스워드를 확인해주세요.",
            });
            return;
        }

        const token = jwt.sign({ userId: user.userId }, MYSECRETKEY);  // sign을해야 token을 만들 수 있음

        res.cookie("token", `Bearer ${token}`, {
            maxAge: 3600000, // 1시간
            httpOnly: true,
        });

        return res.status(200).end();

    } catch (error) {
        const message = `${req.method} ${req.originalUrl} : ${error.message}`;
        console.log(message);
        res.status(400).json({ message });
    }
});


// 이 파일의 router 객체를 외부에 공개
module.exports = router;