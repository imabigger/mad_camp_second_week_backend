const boards = require('../data/boards');

// params 에 보드가 있는 요청
const validateBoardParam = (req, res, next) => {
  const { board } = req.params;

  // 게시판이 유효한지 확인
  const validBoard = boards.find(b => b.id === parseInt(board, 10));
  if (!validBoard) {
    return res.status(400).send({ error: 'Invalid board' });
  }

  next();
};

module.exports = validateBoardParam;
