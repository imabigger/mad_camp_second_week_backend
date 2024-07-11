const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  token: {
    type: String,
  },
  refreshToken: {
    type: String
  }
});

// 비밀번호 해싱
userSchema.pre('save', async function(next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// 인증 토큰 생성
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
  user.token = token;
  await user.save();
  return token;
};

// 리프레시 토큰 생성
userSchema.methods.generateRefreshToken = async function() {
  const user = this;
  const refreshToken = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET_REFRESH, { expiresIn: '1d' });
  user.refreshToken = refreshToken;
  await user.save();
  return refreshToken;
};

// 사용자 자격 증명 확인
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Unable to login');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Unable to login');
  }

  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
