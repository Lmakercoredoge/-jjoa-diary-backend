const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// 프로필 조회
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 설정 업데이트
router.put('/settings', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { settings: req.body },
      { new: true }
    );
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;