const express = require('express');
const router = express.Router();
const User = require('../models/User'); // User 모델
const auth = require('../middleware/auth'); // 인증 미들웨어
const axios = require('axios');
const qs = require('qs');
const jwt = require('jsonwebtoken');

// 사용자 등록
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const user = new User({ username, password, email });

    await user.save(); // await를 사용하여 user.save()가 완료될 때까지 기다립니다.
    const token = await user.generateAuthToken();
    const refreshToken = await user.generateRefreshToken();

    res.status(201).send({ message: 'User registered successfully', user, token, refreshToken });
  } catch (error) {
    if (error.code === 11000) { // MongoDB의 중복 키 오류 코드
      return res.status(400).json({
        error: 'duplicate key',
        message: '사용할 수 없는 아이디 또는 이메일입니다.'
      });
    }
    console.log("POST: 유저 생성 실패", error);
    res.status(500).json({
      message: `create failed: ${error}`
    });
  }
});

// 사용자 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();
    const refreshToken = await user.generateRefreshToken();
    res.status(200).send({ user, token, refreshToken });
  } catch (error) {
    console.log("POST: 로그인 실패", error);
    res.status(400).send(error);
  }
});

// refresh token으로 token 재발급 로직
router.post('/token', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH);
    const user = await User.findOne({ _id: decoded._id, refreshToken });

    if (!user) {
      throw new Error();
    }

    const newToken = await user.generateAuthToken();
    const newRefreshToken = await user.generateRefreshToken();
    res.send({ token: newToken , refreshToken: newRefreshToken});
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).send({ error: "Refresh Token Expiration", message: '토큰이 만료되었습니다.' });
    }
    res.status(401).send({ error: "Invalid Refresh Token", message: '리프레시 토큰이 유효하지 않습니다.' });
  }
});

// 보호된 경로 예제
router.get('/protected', auth, (req, res) => {
  res.send('This is a protected route');
});

// 카카오 로그인 처리
router.post('/auth/kakao', async (req, res) => {
  const { id, nickname, email } = req.body;

  try {
    console.log('[Auth Start] Extracted user data:', { id, email, nickname });

    // 데이터베이스에 유저 정보 저장
    let user = await User.findOne({ email });

    if (!user) {
      console.log('User not found, creating new user.');
      user = new User({ username: nickname, email, password: 'kakao_auth_password' });
      await user.save();
      console.log('[Auth] New user created:', user);
    } else {
      console.log('[Auth] User found:', user);
    }

    const token = await user.generateAuthToken();
    const refreshToken = await user.generateRefreshToken();

    console.log('[Auth Complete] Generated tokens:', { token, refreshToken });

    res.status(200).send({ user, token, refreshToken });
  } catch (error) {
    console.error('Error database operation:', error.message);

    res.status(500).send('Server Authentication failed');
  }
});

// 네이버 로그인 처리
router.post('/auth/naver', async (req, res) => {
  const { id, nickname, email } = req.body;

  try {
    console.log('[Auth Start] Extracted user data:', { id, email, nickname });

    // 데이터베이스에 유저 정보 저장
    let user = await User.findOne({ email });

    if (!user) {
      console.log('User not found, creating new user.');
      user = new User({ username: nickname, email, password: 'naver_auth_password' });
      await user.save();
      console.log('[Auth] New user created:', user);
    } else {
      console.log('[Auth] User found:', user);
    }

    const token = await user.generateAuthToken();
    const refreshToken = await user.generateRefreshToken();

    console.log('[Auth Complete] Generated tokens:', { token, refreshToken });

    res.status(200).send({ user, token, refreshToken });
  } catch (error) {
    console.error('Error database operation:', error.message);

    res.status(500).send('Server Authentication failed');
  }
});

module.exports = router;
