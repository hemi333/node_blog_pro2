// express 모듈을 불러오고, 보안(CORS), cookie-parser 등 환경 초기화
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");
dotenv.config();

const port = process.env.PORT;

// express 객체 선언, 각종 middleware 설치
const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());  // body로 들어오는 json 데이터를 파싱해 주는 미들웨어
app.use(express.urlencoded({ extended: false })); // 주소 형식으로 데이터를 보내는 방식


// "/" path로 연결하는 라우터 연결 (우선 routes/index.js로)
const indexRouter = require("./routes");
app.use("/", [indexRouter]);


async function middle (req, res, next) {
  const cookies = req.cookie;
  console.log(cookies);

  next();
};

app.get("/set-key", (req, res) => {
  const key = "hello";
  const secretKey = "sparta";

  const token = jwt.sign({ key }, secretKey);
  res.cookie('token', `Bearer ${token}`);

  return res.status(200).end();  // .end() 이전 선택요소를 반환
});

app.get("/get-key", middle, (req, res) => {
  const { token } = req.cookies;
  // 넘어온 cookies.token :
  // "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXkiOiJoZWxsbyIsImlhdCI6MTY1OTQwNzE4Mn0.lxjHLID5uZofERQIW4wEc4dSmsB2c8vzEEvsqOa-kEs" 요렇게 생겼어요.

  const decodedToken = jwt.decode(token.split(" ")[1], "sparta");
  // 이거 Bearer 뒤쪽거 "eyJhbGciOi~" 부분만 decode 해야 해서 공백을 기준으로 split해서 2번째 것 가져옴

  console.log(decodedToken);
  // 이렇게 해서 찍어보면 { key: 'hello', iat: 1659407182 } 이런 식으로 잘 받아왔더라구요.

  return res.status(200).json(decodedToken);
});

// 포트 열어서 Request Listening
app.listen(port, () => {
  console.log(`${port} 번 포트로 연결이 완료되었습니다.`);
});
