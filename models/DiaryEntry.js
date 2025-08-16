const mongoose = require('mongoose');

const diaryEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  type: {
    type: String,
    enum: ['memo', 'diary'],
    default: 'memo'
  },
  emotion: {
    type: String,
    enum: ['매우 좋음', '좋음', '보통', '나쁨', '매우 나쁨'],
    default: '보통'
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  images: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  weather: {
    condition: String,
    temperature: Number,
    location: String
  },
  location: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  reminder: {
    enabled: {
      type: Boolean,
      default: false
    },
    time: Date,
    beforeMinutes: {
      type: Number,
      default: 10
    },
    repeat: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none'
    }
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 인덱스 설정
diaryEntrySchema.index({ userId: 1, date: -1 });
diaryEntrySchema.index({ userId: 1, type: 1 });
diaryEntrySchema.index({ userId: 1, isDeleted: 1 });

// 가상 필드 - 날짜별 그룹핑용
diaryEntrySchema.virtual('dateOnly').get(function() {
  return this.date.toISOString().split('T')[0];
});

// 쿼리 미들웨어 - 삭제된 항목 제외
diaryEntrySchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// 정적 메서드 - 날짜 범위로 조회
diaryEntrySchema.statics.findByDateRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ date: -1 });
};

// 정적 메서드 - 특정 달의 일기 조회
diaryEntrySchema.statics.findByMonth = function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  return this.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

module.exports = mongoose.model('DiaryEntry', diaryEntrySchema);