class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(threadId) {
    const thread = await this._threadRepository.getThreadById(threadId);

    const comments = await this._commentRepository.getCommentsByThreadId(threadId);

    const processedComments = await Promise.all(
      comments.map(async (comment) => {
        const replies = await this._replyRepository.getRepliesByCommentId(comment.id);
        const processedReplies = replies.map((reply) => ({
          id: reply.id,
          content: reply.is_delete ? '**balasan telah dihapus**' : reply.content,
          date: reply.date,
          username: reply.username,
        }));

        return {
          id: comment.id,
          username: comment.username,
          date: comment.date,
          content: comment.is_delete ? '**komentar telah dihapus**' : comment.content,
          replies: processedReplies, // Ditambahkan
        };
      }),
    );

    return {
      ...thread,
      comments: processedComments,
    };
  }
}

module.exports = GetThreadDetailUseCase;
