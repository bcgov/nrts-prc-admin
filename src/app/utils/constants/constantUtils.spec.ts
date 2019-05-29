import { ConstantUtils, CodeType } from './constantUtils';
import { StatusCodes, LandUseTypeCodes, PurposeCodes, RegionCodes, ReasonCodes } from './application';
import { CommentCodes } from './comment';

describe('constantUtils', () => {
  describe('getCodeSet()', () => {
    it('returns null if undefined codeType provided', () => {
      const codeSet = ConstantUtils.getCodeSet(undefined);
      expect(codeSet).toEqual(null);
    });

    it('returns null if null codeType provided', () => {
      const codeSet = ConstantUtils.getCodeSet(null);
      expect(codeSet).toEqual(null);
    });

    it('returns StatusCodes if STATUS codeType provided', () => {
      const codeSet = ConstantUtils.getCodeSet(CodeType.STATUS);
      expect(codeSet).toEqual(new StatusCodes());
    });

    it('returns ReasonCodes if Reason codeType provided', () => {
      const codeSet = ConstantUtils.getCodeSet(CodeType.REASON);
      expect(codeSet).toEqual(new ReasonCodes());
    });

    it('returns RegionCodes if REGION codeType provided', () => {
      const codeSet = ConstantUtils.getCodeSet(CodeType.REGION);
      expect(codeSet).toEqual(new RegionCodes());
    });

    it('returns PurposeCodes if PURPOSE codeType provided', () => {
      const codeSet = ConstantUtils.getCodeSet(CodeType.PURPOSE);
      expect(codeSet).toEqual(new PurposeCodes());
    });

    it('returns LandUseTypeCodes if LANDUSETYPE codeType provided', () => {
      const codeSet = ConstantUtils.getCodeSet(CodeType.LANDUSETYPE);
      expect(codeSet).toEqual(new LandUseTypeCodes());
    });

    it('returns CommentCodes if COMMENT codeType provided', () => {
      const codeSet = ConstantUtils.getCodeSet(CodeType.COMMENT);
      expect(codeSet).toEqual(new CommentCodes());
    });
  });

  describe('getCodeGroup()', () => {
    it('returns null if undefined codeType provided', () => {
      const codeGroup = ConstantUtils.getCodeGroup(undefined, 'ABANDONED');
      expect(codeGroup).toEqual(null);
    });

    it('returns null if null codeType provided', () => {
      const codeGroup = ConstantUtils.getCodeGroup(null, 'ABANDONED');
      expect(codeGroup).toEqual(null);
    });

    it('returns null if undefined searchString provided', () => {
      const codeGroup = ConstantUtils.getCodeGroup(CodeType.STATUS, undefined);
      expect(codeGroup).toEqual(null);
    });

    it('returns null if null searchString provided', () => {
      const codeGroup = ConstantUtils.getCodeGroup(CodeType.STATUS, null);
      expect(codeGroup).toEqual(null);
    });

    it('returns null if empty searchString provided', () => {
      const codeGroup = ConstantUtils.getCodeGroup(CodeType.STATUS, '');
      expect(codeGroup).toEqual(null);
    });

    it('returns null if empty searchString provided', () => {
      const codeGroup = ConstantUtils.getCodeGroup(CodeType.STATUS, 'this wont match anything');
      expect(codeGroup).toEqual(null);
    });

    it('returns status code group if status codeType and mataching searchString provided', () => {
      const codeGroup = ConstantUtils.getCodeGroup(CodeType.STATUS, 'ABANDONED');
      expect(codeGroup).toEqual(StatusCodes.ABANDONED);
    });

    it('returns reason code group if reason codeType provided and mataching searchString provided', () => {
      const codeGroup = ConstantUtils.getCodeGroup(CodeType.REASON, 'AMENDMENT');
      expect(codeGroup).toEqual(ReasonCodes.AMENDMENT);
    });

    it('returns region code group if reason codeType provided and mataching searchString provided', () => {
      const codeGroup = ConstantUtils.getCodeGroup(CodeType.REASON, 'LOWER_MAINLAND');
      expect(codeGroup).toEqual(RegionCodes.LOWER_MAINLAND);
    });

    it('returns purpose code group if reason codeType provided and mataching searchString provided', () => {
      const codeGroup = ConstantUtils.getCodeGroup(CodeType.REASON, 'AGRICULTURE');
      expect(codeGroup).toEqual(PurposeCodes.AGRICULTURE);
    });

    it('returns land use type code group if reason codeType provided and mataching searchString provided', () => {
      const codeGroup = ConstantUtils.getCodeGroup(CodeType.REASON, 'CERTIFICATE OF PURCHASE');
      expect(codeGroup).toEqual(LandUseTypeCodes['CERTIFICATE OF PURCHASE']);
    });

    it('returns comment code group if comment codeType provided and mataching searchString provided', () => {
      const codeGroup = ConstantUtils.getCodeGroup(CodeType.REASON, 'CLOSED');
      expect(codeGroup).toEqual(CommentCodes.CLOSED);
    });
  });

  describe('getCode()', () => {
    it('returns null if undefined codeType provided', () => {
      const code = ConstantUtils.getCode(undefined, 'ABANDONED');
      expect(code).toEqual(null);
    });

    it('returns null if null codeType provided', () => {
      const code = ConstantUtils.getCode(null, 'ABANDONED');
      expect(code).toEqual(null);
    });

    it('returns null if undefined searchString provided', () => {
      const code = ConstantUtils.getCode(CodeType.STATUS, undefined);
      expect(code).toEqual(null);
    });

    it('returns null if null searchString provided', () => {
      const code = ConstantUtils.getCode(CodeType.STATUS, null);
      expect(code).toEqual(null);
    });

    it('returns null if empty searchString provided', () => {
      const code = ConstantUtils.getCode(CodeType.STATUS, '');
      expect(code).toEqual(null);
    });

    it('returns null if non-matching searchString provided', () => {
      const code = ConstantUtils.getCode(CodeType.STATUS, 'this wont match anything');
      expect(code).toEqual(null);
    });

    it('returns status code if status codeType and mataching searchString provided', () => {
      const code = ConstantUtils.getCode(CodeType.STATUS, 'ABANDONED');
      expect(code).toEqual(StatusCodes.ABANDONED.code);
    });

    it('returns reason code if reason codeType provided and mataching searchString provided', () => {
      const code = ConstantUtils.getCode(CodeType.REASON, 'AMENDMENT');
      expect(code).toEqual(ReasonCodes.AMENDMENT.code);
    });

    it('returns region code if reason codeType provided and mataching searchString provided', () => {
      const code = ConstantUtils.getCode(CodeType.REASON, 'LOWER_MAINLAND');
      expect(code).toEqual(RegionCodes.LOWER_MAINLAND.code);
    });

    it('returns purpose code if reason codeType provided and mataching searchString provided', () => {
      const code = ConstantUtils.getCode(CodeType.REASON, 'AGRICULTURE');
      expect(code).toEqual(PurposeCodes.AGRICULTURE.code);
    });

    it('returns land use type code if reason codeType provided and mataching searchString provided', () => {
      const code = ConstantUtils.getCode(CodeType.REASON, 'PERMIT');
      expect(code).toEqual(LandUseTypeCodes.PERMIT.code);
    });

    it('returns comment code if comment codeType provided and mataching searchString provided', () => {
      const code = ConstantUtils.getCode(CodeType.REASON, 'CLOSED');
      expect(code).toEqual(CommentCodes.CLOSED.code);
    });
  });

  describe('getParam()', () => {
    it('returns null if undefined codeType provided', () => {
      const param = ConstantUtils.getParam(undefined, 'ABANDONED');
      expect(param).toEqual(null);
    });

    it('returns null if null codeType provided', () => {
      const param = ConstantUtils.getParam(null, 'ABANDONED');
      expect(param).toEqual(null);
    });

    it('returns null if undefined searchString provided', () => {
      const param = ConstantUtils.getParam(CodeType.STATUS, undefined);
      expect(param).toEqual(null);
    });

    it('returns null if null searchString provided', () => {
      const param = ConstantUtils.getParam(CodeType.STATUS, null);
      expect(param).toEqual(null);
    });

    it('returns null if empty searchString provided', () => {
      const param = ConstantUtils.getParam(CodeType.STATUS, '');
      expect(param).toEqual(null);
    });

    it('returns null if non-matching searchString provided', () => {
      const param = ConstantUtils.getParam(CodeType.STATUS, 'this wont match anything');
      expect(param).toEqual(null);
    });

    it('returns status param if status codeType and mataching searchString provided', () => {
      const param = ConstantUtils.getParam(CodeType.STATUS, 'APPLICATION_REVIEW_COMPLETE');
      expect(param).toEqual(StatusCodes.APPLICATION_REVIEW_COMPLETE.param);
    });

    it('returns reason param if reason codeType provided and mataching searchString provided', () => {
      const param = ConstantUtils.getParam(CodeType.REASON, 'AMENDMENT');
      expect(param).toEqual(ReasonCodes.AMENDMENT.param);
    });

    it('returns region param if reason codeType provided and mataching searchString provided', () => {
      const param = ConstantUtils.getParam(CodeType.REASON, 'CARIBOO');
      expect(param).toEqual(RegionCodes.CARIBOO.param);
    });

    it('returns purpose param if reason codeType provided and mataching searchString provided', () => {
      const param = ConstantUtils.getParam(CodeType.REASON, 'SOLAR POWER');
      expect(param).toEqual(PurposeCodes['SOLAR POWER'].param);
    });

    it('returns land use type param if reason codeType provided and mataching searchString provided', () => {
      const param = ConstantUtils.getParam(CodeType.REASON, 'CERTIFICATE OF PURCHASE');
      expect(param).toEqual(LandUseTypeCodes['CERTIFICATE OF PURCHASE'].param);
    });

    it('returns comment param if comment codeType provided and mataching searchString provided', () => {
      const param = ConstantUtils.getParam(CodeType.REASON, 'CLOSED');
      expect(param).toEqual(CommentCodes.CLOSED.param);
    });
  });

  describe('getTextShort()', () => {
    it('returns null if undefined codeType provided', () => {
      const stringShort = ConstantUtils.getTextShort(undefined, 'ABANDONED');
      expect(stringShort).toEqual(null);
    });

    it('returns null if null codeType provided', () => {
      const stringShort = ConstantUtils.getTextShort(null, 'ABANDONED');
      expect(stringShort).toEqual(null);
    });

    it('returns null if undefined searchString provided', () => {
      const stringShort = ConstantUtils.getTextShort(CodeType.STATUS, undefined);
      expect(stringShort).toEqual(null);
    });

    it('returns null if null searchString provided', () => {
      const stringShort = ConstantUtils.getTextShort(CodeType.STATUS, null);
      expect(stringShort).toEqual(null);
    });

    it('returns null if empty searchString provided', () => {
      const stringShort = ConstantUtils.getTextShort(CodeType.STATUS, '');
      expect(stringShort).toEqual(null);
    });

    it('returns null if non-matching searchString provided', () => {
      const stringShort = ConstantUtils.getTextShort(CodeType.STATUS, 'this wont match anything');
      expect(stringShort).toEqual(null);
    });

    it('returns status stringShort if status codeType and mataching searchString provided', () => {
      const stringShort = ConstantUtils.getTextShort(CodeType.STATUS, 'UNKNOWN');
      expect(stringShort).toEqual(StatusCodes.UNKNOWN.text.short);
    });

    it('returns reason stringShort if reason codeType provided and mataching searchString provided', () => {
      const stringShort = ConstantUtils.getTextShort(CodeType.REASON, 'AMENDMENT');
      expect(stringShort).toEqual(ReasonCodes.AMENDMENT.text.short);
    });

    it('returns region stringShort if reason codeType provided and mataching searchString provided', () => {
      const stringShort = ConstantUtils.getTextShort(CodeType.REASON, 'PEACE');
      expect(stringShort).toEqual(RegionCodes.PEACE.text.short);
    });

    it('returns purpose stringShort if reason codeType provided and mataching searchString provided', () => {
      const stringShort = ConstantUtils.getTextShort(CodeType.REASON, 'INSTITUTIONAL');
      expect(stringShort).toEqual(PurposeCodes.INSTITUTIONAL.text.short);
    });

    it('returns land use type stringShort if reason codeType provided and mataching searchString provided', () => {
      const stringShort = ConstantUtils.getTextShort(CodeType.REASON, 'CROWN GRANT');
      expect(stringShort).toEqual(LandUseTypeCodes['CROWN GRANT'].text.short);
    });

    it('returns comment stringShort if comment codeType provided and mataching searchString provided', () => {
      const stringShort = ConstantUtils.getTextShort(CodeType.REASON, 'NOT_STARTED');
      expect(stringShort).toEqual(CommentCodes.CLOSED.text.short);
    });
  });

  describe('getTextLong()', () => {
    it('returns null if undefined codeType provided', () => {
      const stringLong = ConstantUtils.getTextLong(undefined, 'ABANDONED');
      expect(stringLong).toEqual(null);
    });

    it('returns null if null codeType provided', () => {
      const stringLong = ConstantUtils.getTextLong(null, 'ABANDONED');
      expect(stringLong).toEqual(null);
    });

    it('returns null if undefined searchString provided', () => {
      const stringLong = ConstantUtils.getTextLong(CodeType.STATUS, undefined);
      expect(stringLong).toEqual(null);
    });

    it('returns null if null searchString provided', () => {
      const stringLong = ConstantUtils.getTextLong(CodeType.STATUS, null);
      expect(stringLong).toEqual(null);
    });

    it('returns null if empty searchString provided', () => {
      const stringLong = ConstantUtils.getTextLong(CodeType.STATUS, '');
      expect(stringLong).toEqual(null);
    });

    it('returns null if non-matching searchString provided', () => {
      const stringLong = ConstantUtils.getTextLong(CodeType.STATUS, 'this wont match anything');
      expect(stringLong).toEqual(null);
    });

    it('returns status stringLong if status codeType and mataching searchString provided', () => {
      const stringLong = ConstantUtils.getTextLong(CodeType.STATUS, 'DECISION_NOT_APPROVED');
      expect(stringLong).toEqual(StatusCodes.DECISION_NOT_APPROVED.text.long);
    });

    it('returns reason stringLong if reason codeType provided and mataching searchString provided', () => {
      const stringLong = ConstantUtils.getTextLong(CodeType.REASON, 'AMENDMENT');
      expect(stringLong).toEqual(ReasonCodes.AMENDMENT.text.long);
    });

    it('returns region stringLong if reason codeType provided and mataching searchString provided', () => {
      const stringLong = ConstantUtils.getTextLong(CodeType.REASON, 'SOUTHERN_INTERIOR');
      expect(stringLong).toEqual(RegionCodes.SOUTHERN_INTERIOR.text.long);
    });

    it('returns purpose stringLong if reason codeType provided and mataching searchString provided', () => {
      const stringLong = ConstantUtils.getTextLong(CodeType.REASON, 'ENERGY PRODUCTION');
      expect(stringLong).toEqual(PurposeCodes['ENERGY PRODUCTION'].text.long);
    });

    it('returns land use type stringLong if reason codeType provided and mataching searchString provided', () => {
      const stringLong = ConstantUtils.getTextLong(CodeType.REASON, 'OIC ECOLOGICAL RESERVE ACT');
      expect(stringLong).toEqual(LandUseTypeCodes['OIC ECOLOGICAL RESERVE ACT'].text.long);
    });

    it('returns comment stringLong if comment codeType provided and mataching searchString provided', () => {
      const stringLong = ConstantUtils.getTextLong(CodeType.REASON, 'NOT_STARTED');
      expect(stringLong).toEqual(CommentCodes.CLOSED.text.long);
    });
  });

  describe('getMappedCodes()', () => {
    it('returns null if undefined codeType provided', () => {
      const mappedCodes = ConstantUtils.getMappedCodes(undefined, 'ABANDONED');
      expect(mappedCodes).toEqual(null);
    });

    it('returns null if null codeType provided', () => {
      const mappedCodes = ConstantUtils.getMappedCodes(null, 'ABANDONED');
      expect(mappedCodes).toEqual(null);
    });

    it('returns null if undefined searchString provided', () => {
      const mappedCodes = ConstantUtils.getMappedCodes(CodeType.STATUS, undefined);
      expect(mappedCodes).toEqual(null);
    });

    it('returns null if null searchString provided', () => {
      const mappedCodes = ConstantUtils.getMappedCodes(CodeType.STATUS, null);
      expect(mappedCodes).toEqual(null);
    });

    it('returns null if empty searchString provided', () => {
      const mappedCodes = ConstantUtils.getMappedCodes(CodeType.STATUS, '');
      expect(mappedCodes).toEqual(null);
    });

    it('returns null if non-matching searchString provided', () => {
      const mappedCodes = ConstantUtils.getMappedCodes(CodeType.STATUS, 'this wont match anything');
      expect(mappedCodes).toEqual(null);
    });

    it('returns status mappedCodes if status codeType and mataching searchString provided', () => {
      const mappedCodes = ConstantUtils.getMappedCodes(CodeType.STATUS, 'APPLICATION_REVIEW_COMPLETE');
      expect(mappedCodes).toEqual(StatusCodes.APPLICATION_REVIEW_COMPLETE.mappedCodes);
    });

    it('returns reason mappedCodes if reason codeType provided and mataching searchString provided', () => {
      const mappedCodes = ConstantUtils.getMappedCodes(CodeType.REASON, 'AMENDMENT');
      expect(mappedCodes).toEqual(ReasonCodes.AMENDMENT.mappedCodes);
    });

    it('returns region mappedCodes if reason codeType provided and mataching searchString provided', () => {
      const mappedCodes = ConstantUtils.getMappedCodes(CodeType.REASON, 'SKEENA');
      expect(mappedCodes).toEqual(RegionCodes.SKEENA.mappedCodes);
    });

    it('returns purpose mappedCodes if reason codeType provided and mataching searchString provided', () => {
      const mappedCodes = ConstantUtils.getMappedCodes(CodeType.REASON, 'COMMERCIAL');
      expect(mappedCodes).toEqual(PurposeCodes.COMMERCIAL.mappedCodes);
    });

    it('returns land use type mappedCodes if reason codeType provided and mataching searchString provided', () => {
      const mappedCodes = ConstantUtils.getMappedCodes(CodeType.REASON, 'INVENTORY');
      expect(mappedCodes).toEqual(LandUseTypeCodes.INVENTORY.mappedCodes);
    });

    it('returns comment mappedCodes if comment codeType provided and mataching searchString provided', () => {
      const mappedCodes = ConstantUtils.getMappedCodes(CodeType.REASON, 'OPEN');
      expect(mappedCodes).toEqual(CommentCodes.CLOSED.mappedCodes);
    });
  });
});
