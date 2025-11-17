const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const NewComment = require('../../../Domains/comments/entities/NewComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const pool = require('../../database/postgres/pool');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('CommentRepositoryPostgres', () => {
  afterEach(async () => {
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
  });

  describe('addComment function', () => {
    it('should persist new comment and return added comment correctly', async () => {
      const newComment = new NewComment({ content: 'sebuah komentar' });
      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);
      const owner = 'user-123';
      const threadId = 'thread-123';

      const addedComment = await commentRepositoryPostgres.addComment(newComment, owner, threadId);

      const comments = await CommentsTableTestHelper.findCommentById('comment-123');
      expect(comments).toHaveLength(1);
      expect(addedComment).toStrictEqual(
        new AddedComment({
          id: 'comment-123',
          content: 'sebuah komentar',
          owner: 'user-123',
        }),
      );
    });
  });

  describe('verifyCommentOwner function', () => {
    it('should throw AuthorizationError when comment owner is invalid', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        owner: 'user-123',
        threadId: 'thread-123',
      });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
      const invalidOwner = 'user-456';

      await expect(
        commentRepositoryPostgres.verifyCommentOwner('comment-123', invalidOwner),
      ).rejects.toThrow(AuthorizationError);
      await expect(
        commentRepositoryPostgres.verifyCommentOwner('comment-123', invalidOwner),
      ).rejects.toThrow('anda tidak berhak mengakses resource ini');
    });

    it('should not throw AuthorizationError when comment owner is valid', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        owner: 'user-123',
        threadId: 'thread-123',
      });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});
      const validOwner = 'user-123';

      await expect(
        commentRepositoryPostgres.verifyCommentOwner('comment-123', validOwner),
      ).resolves.not.toThrow(AuthorizationError);
    });
  });

  describe('deleteComment function', () => {
    it('should soft delete comment (update is_delete to true)', async () => {
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await commentRepositoryPostgres.deleteComment('comment-123');

      const isDeleted = await CommentsTableTestHelper.checkIsDelete('comment-123');
      expect(isDeleted).toEqual(true);
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return comments for a thread correctly', async () => {
      const commentDate1 = new Date(new Date().getTime() - 10000).toISOString();
      const commentDate2 = new Date().toISOString();

      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        content: 'komentar pertama',
        threadId: 'thread-123',
        owner: 'user-123',
        date: commentDate1,
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-456',
        content: 'komentar kedua',
        threadId: 'thread-123',
        owner: 'user-123',
        date: commentDate2,
        isDelete: true,
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      const comments = await commentRepositoryPostgres.getCommentsByThreadId('thread-123');

      expect(comments).toHaveLength(2);
      expect(comments[0].id).toEqual('comment-123');
      expect(comments[0].username).toEqual('dicoding');
      expect(comments[0].content).toEqual('komentar pertama');
      expect(comments[0].is_delete).toEqual(false);
      expect(comments[0].date.toISOString()).toEqual(commentDate1);

      expect(comments[1].id).toEqual('comment-456');
      expect(comments[1].username).toEqual('dicoding');
      expect(comments[1].content).toEqual('komentar kedua');
      expect(comments[1].is_delete).toEqual(true);
      expect(comments[1].date.toISOString()).toEqual(commentDate2);
    });
  });

  describe('verifyCommentAvailability function', () => {
    it('should throw NotFoundError when comment not available', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(
        commentRepositoryPostgres.verifyCommentAvailability('comment-123', 'thread-123'),
      ).rejects.toThrow(NotFoundError);
      await expect(
        commentRepositoryPostgres.verifyCommentAvailability('comment-123', 'thread-123'),
      ).rejects.toThrow('komentar tidak ditemukan');
    });

    it('should not throw NotFoundError when comment available', async () => {
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(
        commentRepositoryPostgres.verifyCommentAvailability('comment-123', 'thread-123'),
      ).resolves.not.toThrow(NotFoundError);
    });
  });
});
