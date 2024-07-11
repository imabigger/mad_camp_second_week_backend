const boards = require('../data/boards');

// body 에 보드가 있는 요청
const validateBoard = (req, res, next) => {
  const { board } = req.body;

  // 게시판이 유효한지 확인
  const validBoard = boards.find(b => b.id === parseInt(board, 10));
  if (!validBoard) {
    return res.status(400).send({ error: 'Invalid board' });
  }

  next();
};

module.exports = validateBoard;
