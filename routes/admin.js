const express = require('express');
const User = require('../models/User');
const DiaryEntry = require('../models/DiaryEntry');
const auth = require('../middleware/auth');

const router = express.Router();

// 관리자 인증 미들웨어
const adminAuth = async (req, res, next) => {
  try {
    // 간단한 관리자 인증 (실제로는 더 복잡하게 구현)
    const adminKey = req.header('Admin-Key');
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다' });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};

// 관리자 대시보드 통계
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDiaries = await DiaryEntry.countDocuments();
    const todayDiaries = await DiaryEntry.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDiaries,
        todayDiaries,
        serverStatus: 'healthy'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 모든 사용자 조회
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 모든 일기 조회
router.get('/diaries', adminAuth, async (req, res) => {
  try {
    const diaries = await DiaryEntry.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: diaries });
  } catch (error) {
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 관리자 웹 페이지
router.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>JJOA 다이어리 관리자</title>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { background: #007bff; color: white; padding: 20px; border-radius: 8px; }
            .stats { display: flex; gap: 20px; margin: 20px 0; }
            .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; flex: 1; }
            .section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
            button:hover { background: #0056b3; }
            .users-list, .diaries-list { max-height: 400px; overflow-y: auto; }
            .item { padding: 10px; border-bottom: 1px solid #eee; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛠️ JJOA 다이어리 관리자 패널</h1>
                <p>시스템 상태 및 사용자 데이터 관리</p>
            </div>

            <div class="section">
                <h3>🔑 관리자 인증</h3>
                <input type="password" id="adminKey" placeholder="관리자 키 입력" style="width: 300px; padding: 8px;">
                <button onclick="authenticate()">인증</button>
            </div>

            <div id="adminPanel" style="display: none;">
                <div class="stats">
                    <div class="stat-card">
                        <h3>총 사용자</h3>
                        <h2 id="totalUsers">-</h2>
                    </div>
                    <div class="stat-card">
                        <h3>총 일기</h3>
                        <h2 id="totalDiaries">-</h2>
                    </div>
                    <div class="stat-card">
                        <h3>오늘 일기</h3>
                        <h2 id="todayDiaries">-</h2>
                    </div>
                </div>

                <div class="section">
                    <h3>👥 사용자 목록</h3>
                    <button onclick="loadUsers()">사용자 불러오기</button>
                    <div id="usersList" class="users-list"></div>
                </div>

                <div class="section">
                    <h3>📝 최근 일기</h3>
                    <button onclick="loadDiaries()">일기 불러오기</button>
                    <div id="diariesList" class="diaries-list"></div>
                </div>
            </div>
        </div>

        <script>
            let adminKey = '';

            function authenticate() {
                adminKey = document.getElementById('adminKey').value;
                if (adminKey) {
                    document.getElementById('adminPanel').style.display = 'block';
                    loadDashboard();
                }
            }

            async function loadDashboard() {
                try {
                    const response = await fetch('/api/admin/dashboard', {
                        headers: { 'Admin-Key': adminKey }
                    });
                    const data = await response.json();
                    
                    if (data.success) {
                        document.getElementById('totalUsers').textContent = data.data.totalUsers;
                        document.getElementById('totalDiaries').textContent = data.data.totalDiaries;
                        document.getElementById('todayDiaries').textContent = data.data.todayDiaries;
                    }
                } catch (error) {
                    alert('인증 실패: ' + error.message);
                }
            }

            async function loadUsers() {
                try {
                    const response = await fetch('/api/admin/users', {
                        headers: { 'Admin-Key': adminKey }
                    });
                    const data = await response.json();
                    
                    if (data.success) {
                        const usersList = document.getElementById('usersList');
                        usersList.innerHTML = data.data.map(user => \`
                            <div class="item">
                                <strong>\${user.username}</strong> (\${user.email})<br>
                                <small>가입일: \${new Date(user.createdAt).toLocaleString()}</small>
                            </div>
                        \`).join('');
                    }
                } catch (error) {
                    alert('사용자 로드 실패: ' + error.message);
                }
            }

            async function loadDiaries() {
                try {
                    const response = await fetch('/api/admin/diaries', {
                        headers: { 'Admin-Key': adminKey }
                    });
                    const data = await response.json();
                    
                    if (data.success) {
                        const diariesList = document.getElementById('diariesList');
                        diariesList.innerHTML = data.data.map(diary => \`
                            <div class="item">
                                <strong>\${diary.title}</strong><br>
                                <small>작성자: \${diary.userId?.username || 'Unknown'} | 
                                작성일: \${new Date(diary.createdAt).toLocaleString()}</small><br>
                                <em>\${diary.content.substring(0, 100)}...</em>
                            </div>
                        \`).join('');
                    }
                } catch (error) {
                    alert('일기 로드 실패: ' + error.message);
                }
            }
        </script>
    </body>
    </html>
  `);
});

module.exports = router;