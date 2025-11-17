const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const GetThreadDetailUseCase = require('../GetThreadDetailUseCase');

describe('GetThreadDetailUseCase', () => {
  it('should orchestrating the get thread detail action correctly', async () => {
    const threadId = 'thread-123';
    const threadDate = new Date('2021-08-08T07:19:09.775Z').toISOString();
    const commentDate1 = new Date('2021-08-08T07:22:33.555Z').toISOString();
    const commentDate2 = new Date('2021-08-08T07:26:21.338Z').toISOString();
    const replyDate1 = new Date('2021-08-08T07:59:48.766Z').toISOString();
    const replyDate2 = new Date('2021-08-08T08:07:01.522Z').toISOString();

    const mockThread = {
      id: threadId,
      title: 'sebuah thread',
      body: 'sebuah body',
      date: threadDate,
      username: 'dicoding',
    };

    const mockComments = [
      {
        id: 'comment-123',
        username: 'johndoe',
        date: commentDate1,
        content: 'sebuah comment',
        is_delete: false,
      },
      {
        id: 'comment-456',
        username: 'dicoding',
        date: commentDate2,
        content: 'komentar yang dihapus',
        is_delete: true,
      },
    ];

    const mockReplies = [
      {
        id: 'reply-123',
        username: 'johndoe',
        date: replyDate1,
        content: 'balasan yang dihapus',
        is_delete: true,
      },
      {
        id: 'reply-456',
        username: 'dicoding',
        date: replyDate2,
        content: 'sebuah balasan',
        is_delete: false,
      },
    ];

    const expectedThreadDetail = {
      id: threadId,
      title: 'sebuah thread',
      body: 'sebuah body',
      date: threadDate,
      username: 'dicoding',
      comments: [
        {
          id: 'comment-123',
          username: 'johndoe',
          date: commentDate1,
          content: 'sebuah comment',
          replies: [
            {
              id: 'reply-123',
              username: 'johndoe',
              date: replyDate1,
              content: '**balasan telah dihapus**',
            },
            {
              id: 'reply-456',
              username: 'dicoding',
              date: replyDate2,
              content: 'sebuah balasan',
            },
          ],
        },
        {
          id: 'comment-456',
          username: 'dicoding',
          date: commentDate2,
          content: '**komentar telah dihapus**',
          replies: [],
        },
      ],
    };

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.getThreadById = jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockThread));
    mockCommentRepository.getCommentsByThreadId = jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockComments));

    mockReplyRepository.getRepliesByCommentId = jest.fn((commentId) => {
      if (commentId === 'comment-123') {
        return Promise.resolve(mockReplies);
      }
      return Promise.resolve([]);
    });

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    const threadDetail = await getThreadDetailUseCase.execute(threadId);

    expect(threadDetail).toStrictEqual(expectedThreadDetail);
    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(threadId);
    expect(mockReplyRepository.getRepliesByCommentId).toBeCalledWith('comment-123');
    expect(mockReplyRepository.getRepliesByCommentId).toBeCalledWith('comment-456');
  });
});
