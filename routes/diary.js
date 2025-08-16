const express = require('express');
const { body, validationResult, query } = require('express-validator');
const DiaryEntry = require('../models/DiaryEntry');
const auth = require('../middleware/auth');

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(auth);

// 일기 생성
router.post('/', [
  body('title')
    .isLength({ min: 1, max: 100 })
    .withMessage('제목은 1-100자 사이여야 합니다'),
  body('content')
    .isLength({ min: 1, max: 10000 })
    .withMessage('내용은 1-10000자 사이여야 합니다'),
  body('type')
    .isIn(['memo', 'diary'])
    .withMessage('타입은 memo 또는 diary여야 합니다'),
  body('date')
    .isISO8601()
    .withMessage('유효한 날짜 형식이어야 합니다')
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

    const diaryData = {
      ...req.body,
      userId: req.user.userId
    };

    const diary = new DiaryEntry(diaryData);
    await diary.save();

    res.status(201).json({
      success: true,
      message: '일기가 저장되었습니다',
      data: diary
    });

  } catch (error) {
    console.error('Create diary error:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
});

// 일기 목록 조회
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('페이지는 1 이상이어야 합니다'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('리미트는 1-100 사이여야 합니다'),
  query('type').optional().isIn(['memo', 'diary']).withMessage('타입은 memo 또는 diary여야 합니다'),
  query('startDate').optional().isISO8601().withMessage('시작 날짜 형식이 올바르지 않습니다'),
  query('endDate').optional().isISO8601().withMessage('종료 날짜 형식이 올바르지 않습니다')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '쿼리 파라미터가 올바르지 않습니다',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // 필터 조건 구성
    const filter = { userId: req.user.userId };
    
    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        filter.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.date.$lte = new Date(req.query.endDate);
      }
    }

    const [diaries, total] = await Promise.all([
      DiaryEntry.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      DiaryEntry.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        diaries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get diaries error:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
});

// 특정 달의 일기 조회
router.get('/month/:year/:month', [
  query('year').isInt({ min: 2020, max: 2030 }).withMessage('연도는 2020-2030 사이여야 합니다'),
  query('month').isInt({ min: 1, max: 12 }).withMessage('월은 1-12 사이여야 합니다')
], async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const diaries = await DiaryEntry.findByMonth(
      req.user.userId, 
      parseInt(year), 
      parseInt(month)
    );

    res.json({
      success: true,
      data: diaries
    });

  } catch (error) {
    console.error('Get month diaries error:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
});

module.exports = router;