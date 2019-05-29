import { ICodeGroup } from './interfaces';

/**
 * Comment Status codes.
 *
 * @export
 * @class CommentCodes
 * @implements {ICodeSet}
 */
export class CommentCodes {
  public static readonly NOT_STARTED: ICodeGroup = {
    code: 'NOT_STARTED',
    param: 'NS',
    text: { long: 'Commenting Not Started', short: 'Not Started' },
    mappedCodes: []
  };

  public static readonly NOT_OPEN: ICodeGroup = {
    code: 'NOT_OPEN',
    param: 'NS',
    text: { long: 'Not Open For Commenting', short: 'Not Open' },
    mappedCodes: []
  };

  public static readonly CLOSED: ICodeGroup = {
    code: 'CLOSED',
    param: 'CL',
    text: { long: 'Commenting Closed', short: 'Closed' },
    mappedCodes: []
  };

  public static readonly OPEN: ICodeGroup = {
    code: 'OPEN',
    param: 'OP',
    text: { long: 'Commenting Open', short: 'Open' },
    mappedCodes: []
  };

  /**
   * @inheritdoc
   * @memberof CommentCodes
   */
  public getCodeGroups = () => [
    CommentCodes.NOT_STARTED,
    CommentCodes.NOT_OPEN,
    CommentCodes.CLOSED,
    CommentCodes.OPEN
  ];
}
