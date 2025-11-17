const NewComment = require('../../Domains/comments/entities/NewComment');

class AddCommentUseCase {
  constructor({ commentRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload, threadId, owner) {
    await this._threadRepository.verifyThreadAvailability(threadId);

    const newComment = new NewComment(useCasePayload);
    return this._commentRepository.addComment(newComment, owner, threadId);
  }
}

module.exports = AddCommentUseCase;
