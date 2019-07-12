import { CommentCodes } from './comment';

describe('comment constants', () => {
  describe('CommentCodes', () => {
    describe('getCodeGroups()', () => {
      it('returns all 4 code groups', () => {
        const codeGroups = new CommentCodes().getCodeGroups();
        expect(codeGroups.length).toEqual(4);
        expect(codeGroups).toContain(CommentCodes.NOT_STARTED);
        expect(codeGroups).toContain(CommentCodes.NOT_OPEN);
        expect(codeGroups).toContain(CommentCodes.CLOSED);
        expect(codeGroups).toContain(CommentCodes.OPEN);
      });
    });
  });
});
