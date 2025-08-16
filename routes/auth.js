const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// JWT 토큰 생성
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '30d' }
  );
};

// 회원가입
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('사용자명은 3-20자 사이여야 합니다'),
  body('email')
    .isEmail()
    .withMessage('유효한 이메일을 입력해주세요'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('비밀번호는 최소 6자 이상이어야 합니다')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력값이 올바르지 않습니다',
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // 이미 존재하는 사용자 확인
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '이미 존재하는 이메일 또는 사용자명입니다'
      });
    }

    // 새 사용자 생성
    const user = new User({ username, email, password });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
});

// 로그인
router.post('/login', [
  body('email').isEmail().withMessage('유효한 이메일을 입력해주세요'),
  body('password').notEmpty().withMessage('비밀번호를 입력해주세요')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력값이 올바르지 않습니다',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // 사용자 찾기
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다'
      });
    }

    // 비밀번호 확인
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다'
      });
    }

    // 마지막 로그인 시간 업데이트
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
});

// 소셜 로그인
router.post('/social-login', [
  body('provider').isIn(['google', 'kakao']).withMessage('지원되지 않는 소셜 로그인입니다'),
  body('socialId').notEmpty().withMessage('소셜 ID가 필요합니다'),
  body('email').isEmail().withMessage('유효한 이메일을 입력해주세요'),
  body('username').notEmpty().withMessage('사용자명이 필요합니다')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력값이 올바르지 않습니다',
        errors: errors.array()
      });
    }

    const { provider, socialId, email, username, avatar } = req.body;

    // 기존 소셜 계정 확인
    let user = await User.findOne({
      $or: [
        { socialProvider: provider, socialId: socialId },
        { email: email }
      ]
    });

    if (user) {
      // 기존 사용자 - 소셜 정보 업데이트
      user.lastLogin = new Date();
      if (!user.socialProvider) {
        user.socialProvider = provider;
        user.socialId = socialId;
      }
      if (avatar) user.avatar = avatar;
      await user.save();
    } else {
      // 새 사용자 생성
      user = new User({
        username,
        email,
        socialProvider: provider,
        socialId: socialId,
        avatar: avatar,
        lastLogin: new Date()
      });
      await user.save();
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: '소셜 로그인 성공',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
});

module.exports = router;