const ReplyTableTestHelper = require('../../../../tests/RepliesTableTestHelper'); // Perlu dibuat
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const NewReply = require('../../../Domains/replies/entities/NewReply');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');
const pool = require('../../database/postgres/pool');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('ReplyRepositoryPostgres', () => {
  afterEach(async () => {
    await ReplyTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({
      id: 'comment-123',
      threadId: 'thread-123',
      owner: 'user-123',
    });
  });

  describe('addReply function', () => {
    it('should persist new reply and return added reply correctly', async () => {
      const newReply = new NewReply({ content: 'sebuah balasan' });
      const fakeIdGenerator = () => '123';
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);
      const owner = 'user-123';
      const commentId = 'comment-123';

      const addedReply = await replyRepositoryPostgres.addReply(newReply, owner, commentId);

      const replies = await ReplyTableTestHelper.findReplyById('reply-123');
      expect(replies).toHaveLength(1);
      expect(addedReply).toStrictEqual(
        new AddedReply({
          id: 'reply-123',
          content: 'sebuah balasan',
          owner: 'user-123',
        }),
      );
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should throw AuthorizationError when reply owner is invalid', async () => {
      await ReplyTableTestHelper.addReply({
        id: 'reply-123',
        owner: 'user-123',
        commentId: 'comment-123',
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});
      const invalidOwner = 'user-456';

      await expect(
        replyRepositoryPostgres.verifyReplyOwner('reply-123', invalidOwner),
      ).rejects.toThrow(AuthorizationError);
      await expect(
        replyRepositoryPostgres.verifyReplyOwner('reply-123', invalidOwner),
      ).rejects.toThrow('anda tidak berhak mengakses resource ini');
    });

    it('should not throw AuthorizationError when reply owner is valid', async () => {
      await ReplyTableTestHelper.addReply({
        id: 'reply-123',
        owner: 'user-123',
        commentId: 'comment-123',
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});
      const validOwner = 'user-123';

      await expect(
        replyRepositoryPostgres.verifyReplyOwner('reply-123', validOwner),
      ).resolves.not.toThrow(AuthorizationError);
    });
  });

  describe('deleteReply function', () => {
    it('should soft delete reply (update is_delete to true)', async () => {
      await ReplyTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await replyRepositoryPostgres.deleteReply('reply-123');

      const isDeleted = await ReplyTableTestHelper.checkIsDelete('reply-123');
      expect(isDeleted).toEqual(true);
    });
  });

  describe('getRepliesByCommentId function', () => {
    it('should return replies for a comment correctly', async () => {
      const replyDate1 = new Date(new Date().getTime() - 10000).toISOString();
      const replyDate2 = new Date().toISOString();
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });

      await ReplyTableTestHelper.addReply({
        id: 'reply-123',
        content: 'balasan pertama',
        commentId: 'comment-123',
        owner: 'user-123',
        date: replyDate1,
      });
      await ReplyTableTestHelper.addReply({
        id: 'reply-456',
        content: 'balasan kedua',
        commentId: 'comment-123',
        owner: 'user-456',
        date: replyDate2,
        isDelete: true,
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      const replies = await replyRepositoryPostgres.getRepliesByCommentId('comment-123');

      expect(replies).toHaveLength(2);
      expect(replies[0].id).toEqual('reply-123');
      expect(replies[0].username).toEqual('dicoding');
      expect(replies[0].content).toEqual('balasan pertama');
      expect(replies[0].is_delete).toEqual(false);
      expect(replies[0].date.toISOString()).toEqual(replyDate1);

      expect(replies[1].id).toEqual('reply-456');
      expect(replies[1].username).toEqual('johndoe');
      expect(replies[1].content).toEqual('balasan kedua');
      expect(replies[1].is_delete).toEqual(true);
      expect(replies[1].date.toISOString()).toEqual(replyDate2);
    });
  });

  describe('verifyReplyAvailability function', () => {
    it('should throw NotFoundError when reply not available', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.verifyReplyAvailability('reply-123')).rejects.toThrow(
        NotFoundError,
      );
      await expect(replyRepositoryPostgres.verifyReplyAvailability('reply-123')).rejects.toThrow(
        'balasan komentar tidak ditemukan',
      );
    });

    it('should not throw NotFoundError when reply available', async () => {
      await ReplyTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(
        replyRepositoryPostgres.verifyReplyAvailability('reply-123'),
      ).resolves.not.toThrow(NotFoundError);
    });
  });
});
