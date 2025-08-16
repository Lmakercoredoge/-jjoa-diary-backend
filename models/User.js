const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.socialProvider; // 소셜 로그인이 아닌 경우만 필수
    },
    minlength: 6
  },
  avatar: {
    type: String,
    default: null
  },
  socialProvider: {
    type: String,
    enum: ['google', 'kakao', null],
    default: null
  },
  socialId: {
    type: String,
    default: null
  },
  settings: {
    theme: {
      type: String,
      enum: ['blue', 'green', 'purple', 'orange', 'teal'],
      default: 'blue'
    },
    notifications: {
      enabled: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
      email: { type: Boolean, default: false }
    },
    privacy: {
      diaryPassword: { type: String, default: null },
      requirePassword: { type: Boolean, default: false }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// 패스워드 해싱
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 패스워드 검증
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 일기 비밀번호 설정
userSchema.methods.setDiaryPassword = async function(password) {
  const salt = await bcrypt.genSalt(12);
  this.settings.privacy.diaryPassword = await bcrypt.hash(password, salt);
  this.settings.privacy.requirePassword = true;
};

// 일기 비밀번호 검증
userSchema.methods.compareDiaryPassword = async function(candidatePassword) {
  if (!this.settings.privacy.diaryPassword) return false;
  return bcrypt.compare(candidatePassword, this.settings.privacy.diaryPassword);
};

// JSON 변환 시 민감한 정보 제거
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.settings.privacy.diaryPassword;
  return user;
};

module.exports = mongoose.model('User', userSchema);