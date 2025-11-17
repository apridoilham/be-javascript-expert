const AddedReply = require('../../Domains/replies/entities/AddedReply');
const ReplyRepository = require('../../Domains/replies/ReplyRepository');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');

class ReplyRepositoryPostgres extends ReplyRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addReply(newReply, owner, commentId) {
    const { content } = newReply;
    const id = `reply-${this._idGenerator()}`;
    const date = new Date().toISOString();

    const query = {
      text: 'INSERT INTO replies (id, content, owner, comment_id, date) VALUES($1, $2, $3, $4, $5) RETURNING id, content, owner',
      values: [id, content, owner, commentId, date],
    };

    const result = await this._pool.query(query);
    return new AddedReply(result.rows[0]);
  }

  async verifyReplyOwner(replyId, owner) {
    const query = {
      text: 'SELECT 1 FROM replies WHERE id = $1 AND owner = $2',
      values: [replyId, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new AuthorizationError('anda tidak berhak mengakses resource ini');
    }
  }

  async deleteReply(replyId) {
    const query = {
      text: 'UPDATE replies SET is_delete = TRUE WHERE id = $1',
      values: [replyId],
    };

    await this._pool.query(query);
  }

  async getRepliesByCommentId(commentId) {
    const query = {
      text: `
        SELECT
          replies.id,
          users.username,
          replies.date,
          replies.content,
          replies.is_delete
        FROM replies
        JOIN users ON replies.owner = users.id
        WHERE replies.comment_id = $1
        ORDER BY replies.date ASC
      `,
      values: [commentId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async verifyReplyAvailability(replyId) {
    const query = {
      text: 'SELECT 1 FROM replies WHERE id = $1',
      values: [replyId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('balasan komentar tidak ditemukan');
    }
  }
}

module.exports = ReplyRepositoryPostgres;
