const AddedThread = require('../AddedThread');

describe('AddedThread entities', () => {
  it('should throw error when payload not contain needed property', () => {
    const payload = {
      id: 'thread-123',
      title: 'sebuah thread',
    };

    expect(() => new AddedThread(payload)).toThrowError('ADDED_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    const payload = {
      id: 'thread-123',
      title: 'sebuah thread',
      owner: 12345,
    };

    expect(() => new AddedThread(payload)).toThrowError(
      'ADDED_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION',
    );
  });

  it('should create AddedThread entities correctly', () => {
    const payload = {
      id: 'thread-123',
      title: 'sebuah thread',
      owner: 'user-123',
    };

    const addedThread = new AddedThread(payload);

    expect(addedThread).toBeInstanceOf(AddedThread);
    expect(addedThread.id).toEqual(payload.id);
    expect(addedThread.title).toEqual(payload.title);
    expect(addedThread.owner).toEqual(payload.owner);
  });
});
