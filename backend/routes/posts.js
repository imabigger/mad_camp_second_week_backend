const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const path = require('path');
const fs = require('fs');
const validateBoard = require('../middleware/validateBoard');
const validateBoardParam = require('../middleware/validateBoardParam');
const convertToObjectId = require('../utils/convertToObjectId');



// 게시글 작성
router.post('/', auth, validateBoard, async (req, res) => {
  const { title, content, board, region, topic, images } = req.body;

  const post = new Post({
      title,
      content,
      board: parseInt(board, 10),
      region,
      topic,
      owner: req.user._id,
      imageUrls: [],
  });

  try {
      await post.save();
      const postId = post._id.toString();
      const imageUrls = [];

      if (images && images.length > 0) {
          for (let index = 0; index < images.length; index++) {
              const base64Image = images[index].data;
              if (typeof base64Image !== 'string') {
                  console.log('Invalid image format')
                  return res.status(400).send({ error: 'Invalid image format' });
              }

              const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
              if (!matches || matches.length !== 3) {
                  console.log('Invalid base64 string')
                  return res.status(400).send({ error: 'Invalid base64 string' });
              }

              const ext = matches[1].split('/')[1];
              const base64Data = matches[2];
              const filename = `${postId}-${index + 1}.${ext}`;
              const filepath = path.join(__dirname, '..', 'uploads', filename);

              fs.writeFileSync(filepath, base64Data, 'base64');
              imageUrls.push(`/uploads/${filename}`);
          }
      }

      post.imageUrls = imageUrls;
      await post.save();

      res.status(201).send(post);
  } catch (error) {
      console.error('Error processing post:', error);
      if (!res.headersSent) {
          res.status(400).send({ error: 'Error processing post', details: error.message });
      }
  }
});

// 모든 게시글 조회 with Pagination
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1; // 요청된 페이지 번호 (기본값 1)
  const limit = parseInt(req.query.limit) || 10; // 페이지당 항목 수 (기본값 10)
  const searchQuery = req.query.query || ''; // 검색어 (기본값 빈 문자열)

  try {
    // 검색 조건 생성
    const query = {
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } }, // 제목 검색
        { content: { $regex: searchQuery, $options: 'i' } } // 본문 검색
      ]
    };

    const posts = await Post.find(query)
      .sort({ createdAt: -1 }) // 최신순으로 정렬
      .skip((page - 1) * limit) // 건너뛸 문서 수
      .limit(limit) // 가져올 문서 수
      .populate('owner', 'username email')
      .populate({
        path: 'comments.owner',
        select: 'username email',
      });

    res.status(200).send(posts);
  } catch (error) {
    res.status(500).send(error);
  }
});

  
// 특정 게시판의 게시글 랜덤 조회
router.get('/board/:board', validateBoardParam, async (req, res) => {
  const { board } = req.params;
  const { count } = req.body;

  try {
    const posts = await Post.find({ board: parseInt(board, 10) })
      .populate('owner', 'username email')
      .populate({
        path: 'comments.owner',
        select: 'username email',
      });

    // 게시글을 랜덤으로 섞어서 6개 선택
    const randomPosts = posts.sort(() => 0.5 - Math.random()).slice(0, count);

    res.status(200).send(randomPosts);
  } catch (error) {
    res.status(500).send(error);
  }
});

// 특정 게시글 조회
router.get('/:id', async (req, res) => {
    const _id = req.params.id;
  
    try {
      const post = await Post.findOne({ _id }).populate('owner', 'username email').populate({
        path: 'comments.owner',
        select: 'username email',
      });
      if (!post) {
        return res.status(404).send();
      }

      post.views += 1;
      res.status(200).send(post);
    } catch (error) {
      res.status(500).send(error);
    }
});

// 조회수 증가 엔드포인트
router.put('/:id/increment-views', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } }, // 조회수 증가
      { new: true } // 업데이트된 문서를 반환
    );

    if (!post) {
      return res.status(404).send({ message: 'Post not found' });
    }

    res.status(200).send(post);
  } catch (error) {
    res.status(500).send(error);
  }
});


// 게시글 좋아요 추가
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).send({ error: 'Post not found' });
    }

    if (post.likes.includes(req.user._id)) {
      return res.status(400).send({ error: 'You already liked this post' });
    }

    post.likes.push(req.user._id);
    await post.save();
    res.status(200).send(post);
  } catch (error) {
    res.status(500).send(error);
  }
});

// 게시글 좋아요 제거
router.delete('/:id/unlike', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).send({ error: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user._id);
    if (likeIndex === -1) {
      return res.status(400).send({ error: 'You have not liked this post' });
    }

    post.likes.splice(likeIndex, 1);
    await post.save();
    res.status(200).send(post);
  } catch (error) {
    res.status(500).send(error);
  }
});


router.post('/:postId/commentpush', auth, async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  try {
      // 해당 게시물 찾기
      const post = await Post.findById(postId).populate('owner', 'username email')
      .populate({
        path: 'comments.owner',
        select: 'username email',
      });
      if (!post) {
        console.log('Post not found')
        return res.status(404).json({ message: 'Post not found' });
      }
  
      // 새로운 댓글 생성
      const comment = {
        content,
        owner: req.user._id // 현재 인증된 사용자의 ID를 사용
      };
  
      // 댓글을 게시물에 추가
      post.comments.push(comment);
      
      // 변경사항 저장
      await post.save();
  
      res.status(201).json(post);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
});


// 내 작성글 요청
router.get('/my-posts/:userid', async (req, res) => {
  const userId = req.params.userid;

  try {
    const posts = await Post.find({ owner : userId })
    .populate('owner', 'username email')
    .populate('comments.owner', 'username email')
    .exec();

    res.status(200).send(posts);
  } catch (error) {
    console.error('Failed to get posts:', error); // 오류 로그 출력
    res.status(500).send({ error: 'Failed to get posts' });
  }
});


// 내 작성 댓글이 있는 게시글 요청
router.get('/posts-with-my-comments/:userid' , async (req, res) => {

  const userId = req.params.userid;

  try {
    const posts = await Post.find({ 'comments.owner': userId })
      .populate('owner', 'username email')
      .populate('comments.owner', 'username email')
      .exec();

    res.status(200).send(posts);
  } catch (error) {
    res.status(500).send({ error: 'Failed to get posts with comments' });
  }
});


  
module.exports = router;