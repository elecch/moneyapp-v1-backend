const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const imageUrls = [
  "https://i.ibb.co/NmL9Bmy/avatar2.png",
  "https://i.ibb.co/TMfXBhc/avatar3.png",
  "https://i.ibb.co/LRJ59rq/avatar4.png",
  "https://i.ibb.co/mFBRqJ8/avatar5.png",
  "https://i.ibb.co/9cc84R6/avatar6.png",
];

exports.signup = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).send({ message: "이미 사용자가 존재합니다." });
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 랜덤 인덱스 생성 및 이미지 URL 선택
    const randomIndex = Math.floor(Math.random() * imageUrls.length);
    const picture = imageUrls[randomIndex];

    const user = await User.create({
      email: email,
      password: hashedPassword,
      username: username,
      picture: picture,
    });
    return res.status(201).send({ user });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "가입 실패! 다시 내용을 확인해주세요", error: error });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email: email });

    if (!existingUser) {
      return res
        .status(400)
        .send({ message: "가입된 유저를 찾을 수 없습니다." });
    }

    const passwordMatched = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!passwordMatched) {
      return res.status(400).send({ message: "비밀번호가 잘못되었습니다." });
    }

    const jwtToken = jwt.sign(
      {
        _id: existingUser._id,
        email: existingUser.email,
      },
      process.env.JWT_KEY
    );

    res.cookie("token", jwtToken, {
      path: "/",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      httpOnly: true,
      sameSite: "lax",
    });

    return res.status(200).send({ existingUser, jwtToken });
  } catch (error) {
    return res.status(500).send({ message: "로그인 에러!", error: error });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).send({ message: "로그아웃 완료!" });
  } catch (error) {
    return res.status(500).send({ message: "로그아웃 실패!", error });
  }
};

exports.myDetails = async (req, res) => {
  const userId = req._id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .send({ message: "가입된 유저를 찾을 수 없습니다." });
    }
    return res.status(200).send({ user });
  } catch (error) {
    return res.status(500).send({
      message: "정보를 불러오는데 실패했습니다. 다시 확인해주세요",
      error,
    });
  }
};
