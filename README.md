# JJOA Diary Backend API

Flutter 다이어리 앱을 위한 Node.js + Express + MongoDB 백엔드 API 서버

## 🚀 빠른 시작

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일을 편집하여 실제 값으로 수정

# 개발 서버 시작
npm run dev

# 프로덕션 서버 시작
npm start
```

## 📝 API 엔드포인트

### 인증 (Authentication)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인

### 일기 (Diary)
- `GET /api/diary` - 일기 목록 조회
- `POST /api/diary` - 일기 작성
- `GET /api/diary/:id` - 특정 일기 조회
- `PUT /api/diary/:id` - 일기 수정
- `DELETE /api/diary/:id` - 일기 삭제
- `GET /api/diary/month/:year/:month` - 월별 일기 조회
- `GET /api/diary/search/:keyword` - 일기 검색

### 사용자 (User)
- `GET /api/user/profile` - 프로필 조회
- `PUT /api/user/settings` - 설정 업데이트

### 파일 업로드 (Upload)
- `POST /api/upload/image` - 이미지 업로드

## 🛠️ 기술 스택
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **File Upload**: Multer
- **Validation**: Express Validator

## 🔧 환경 설정

`.env` 파일 생성 후 다음 값들을 설정하세요:

```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/jjoa_diary
JWT_SECRET=your-super-secret-jwt-key
```

## 📦 프로젝트 구조

```
├── server.js          # 메인 서버 파일
├── models/            # 데이터베이스 모델
├── routes/            # API 라우트
├── middleware/        # 미들웨어
├── uploads/           # 업로드된 파일
└── package.json       # 프로젝트 설정
```

## 🔐 보안 기능
- JWT 토큰 인증
- 패스워드 해싱 (bcrypt)
- Rate Limiting
- CORS 설정
- Helmet 보안 헤더