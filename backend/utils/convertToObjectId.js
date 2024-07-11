const mongoose = require('mongoose');

function convertToObjectId(id) {
  if (typeof id === 'string') {
    return mongoose.Types.ObjectId(id);
  }
  return id;
}

module.exports = convertToObjectId;
