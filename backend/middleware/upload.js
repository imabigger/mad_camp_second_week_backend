const multer = require('multer');
const path = require('path');

// 파일 번호를 추적하기 위한 변수
let fileCount = {};

// 디스크 저장 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // 이미지 저장 경로
  },
  filename: function (req, file, cb) {
    const postId = req.body.postId;
    if (!fileCount[postId]) {
      fileCount[postId] = 0;
    }
    const fileNumber = ++fileCount[postId];
    cb(null, `${postId}-${fileNumber}${path.extname(file.originalname)}`); // 파일명 설정
  }
});

// 파일 필터링
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('Incorrect file type');
    error.status = 400;
    return cb(error, false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 파일 크기 제한 (5MB)
  },
  fileFilter: fileFilter
});

module.exports = upload;
