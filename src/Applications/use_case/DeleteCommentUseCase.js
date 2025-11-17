class DeleteCommentUseCase {
  constructor({ commentRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(threadId, commentId, owner) {
    await this._threadRepository.verifyThreadAvailability(threadId);
    await this._commentRepository.verifyCommentAvailability(commentId, threadId);

    await this._commentRepository.verifyCommentOwner(commentId, owner);

    return this._commentRepository.deleteComment(commentId);
  }
}

module.exports = DeleteCommentUseCase;
