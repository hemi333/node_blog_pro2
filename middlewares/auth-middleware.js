const jwt = require("jsonwebtoken");
const { User } = require("../models");


module.exports = (req, res, next) => {
    try {
        const authorization = req.cookies.token;
        console.log(authorization);
        const [tokenType, tokenValue] = (authorization || "").split(" ");

        if (tokenType !== "Bearer") {
            res.status(401).send({
                errorMessage: "로그인 후 사용해주세요",
            });
            return;
        }

        const decoded = jwt.verify(tokenValue, "mysecretkey");
        console.log(decoded);
        let user = User.findOne({ where: { userId : decoded.userId } }).then((e) => {
            console.log(e)});
            res.locals.user = user;
            next();
        } catch (error) {
        res.status(401).send({
            errorMessage: '로그인이 필요합니다.',
        });
        return;
    }
};







// module.exports = (req, res, next) => {
//     const authorization = req.cookies.token;
//     const [tokenType, tokenValue] = (authorization || "").split(" ");

//     if (tokenType !== 'Bearer') {
//         res.status(401).send({
//             errorMessage: '로그인이 필요합니다.',
//         });
//         return;
//     };

//     try {

//         const { userId } = jwt.verify(tokenValue, "mysecretkey");
//         console.log({userId});
//         User.findOne(userId).exec().then((user) => {
//             res.locals.user = user;
//             next();
//         });
//     } catch (error) {
//         res.status(401).send({
//             errorMessage: '로그인이 필요합니다.',
//         });
//         return;
//     }
// };

