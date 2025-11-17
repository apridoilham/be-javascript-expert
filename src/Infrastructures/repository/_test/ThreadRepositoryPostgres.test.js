const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const NewThread = require('../../../Domains/threads/entities/NewThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const pool = require('../../database/postgres/pool');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('ThreadRepositoryPostgres', () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
  });

  describe('addThread function', () => {
    it('should persist new thread and return added thread correctly', async () => {
      const newThread = new NewThread({
        title: 'sebuah thread',
        body: 'ini adalah body thread',
      });
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);
      const owner = 'user-123';

      const addedThread = await threadRepositoryPostgres.addThread(newThread, owner);

      const threads = await ThreadsTableTestHelper.findThreadById('thread-123');
      expect(threads).toHaveLength(1);
      expect(addedThread).toStrictEqual(
        new AddedThread({
          id: 'thread-123',
          title: 'sebuah thread',
          owner: 'user-123',
        }),
      );
    });
  });

  describe('verifyThreadAvailability function', () => {
    it('should throw NotFoundError when thread not available', async () => {
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      await expect(
        threadRepositoryPostgres.verifyThreadAvailability('thread-123'),
      ).rejects.toThrowError(NotFoundError);
      await expect(
        threadRepositoryPostgres.verifyThreadAvailability('thread-123'),
      ).rejects.toThrowError('thread tidak ditemukan');
    });

    it('should not throw NotFoundError when thread available', async () => {
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      await expect(
        threadRepositoryPostgres.verifyThreadAvailability('thread-123'),
      ).resolves.not.toThrow(NotFoundError);
    });
  });

  describe('getThreadById function', () => {
    it('should throw NotFoundError when thread not found', async () => {
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      await expect(threadRepositoryPostgres.getThreadById('thread-123')).rejects.toThrowError(
        NotFoundError,
      );
      await expect(threadRepositoryPostgres.getThreadById('thread-123')).rejects.toThrowError(
        'thread tidak ditemukan',
      );
    });

    it('should return thread detail correctly', async () => {
      const threadDate = new Date().toISOString();
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body',
        owner: 'user-123',
        date: threadDate,
      });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      const threadDetail = await threadRepositoryPostgres.getThreadById('thread-123');

      expect(threadDetail.id).toEqual('thread-123');
      expect(threadDetail.title).toEqual('sebuah thread');
      expect(threadDetail.body).toEqual('sebuah body');
      expect(threadDetail.username).toEqual('dicoding');

      expect(threadDetail.date.toISOString()).toEqual(threadDate);
    });
  });
});
