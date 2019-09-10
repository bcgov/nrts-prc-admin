import { ICodeSet, ICodeGroup } from './interfaces';

/**
 * Application Status codes.
 *
 * Note: the code only exists in ACRFD, while the mapped codes are the actual Tantalis status codes and should be used
 *       when making calls to the Tantalis API.
 *
 *
 * @export
 * @class StatusCodes
 * @implements {ICodeSet}
 */
export class StatusCodes implements ICodeSet {
  public static readonly ABANDONED: ICodeGroup = {
    code: 'ABANDONED',
    param: 'AB',
    text: { long: 'Abandoned', short: 'Abandoned' },
    mappedCodes: [
      'ABANDONED', // may not be an actual status
      'CANCELLED',
      'OFFER NOT ACCEPTED',
      'OFFER RESCINDED',
      'RETURNED',
      'REVERTED',
      'SOLD',
      'SUSPENDED',
      'WITHDRAWN'
    ]
  };

  public static readonly APPLICATION_UNDER_REVIEW: ICodeGroup = {
    code: 'APPLICATION UNDER REVIEW',
    param: 'AUR',
    text: { long: 'Application Under Review', short: 'Under Review' },
    mappedCodes: ['ACCEPTED', 'ALLOWED', 'PENDING', 'RECEIVED']
  };

  public static readonly APPLICATION_REVIEW_COMPLETE: ICodeGroup = {
    code: 'APPLICATION REVIEW COMPLETE',
    param: 'ARC',
    text: { long: 'Application Review Complete - Decision Pending', short: 'Decision Pending' },
    mappedCodes: ['OFFER ACCEPTED', 'OFFERED']
  };

  public static readonly DECISION_APPROVED: ICodeGroup = {
    code: 'DECISION APPROVED',
    param: 'DA',
    text: { long: 'Decision: Approved - Tenure Issued', short: 'Approved' },
    mappedCodes: ['ACTIVE', 'COMPLETED', 'DISPOSITION IN GOOD STANDING', 'EXPIRED', 'HISTORIC']
  };

  public static readonly DECISION_NOT_APPROVED: ICodeGroup = {
    code: 'DECISION NOT APPROVED',
    param: 'DNA',
    text: { long: 'Decision: Not Approved', short: 'Not Approved' },
    mappedCodes: ['DISALLOWED']
  };

  public static readonly UNKNOWN: ICodeGroup = {
    code: 'UNKNOWN',
    param: 'UN',
    text: { long: 'Unknown Status', short: 'Unknown' },
    mappedCodes: ['NOT USED', 'PRE-TANTALIS']
  };

  /**
   * @inheritdoc
   * @memberof StatusCodes
   */
  public getCodeGroups = () => [
    StatusCodes.ABANDONED,
    StatusCodes.APPLICATION_UNDER_REVIEW,
    StatusCodes.APPLICATION_REVIEW_COMPLETE,
    StatusCodes.DECISION_APPROVED,
    StatusCodes.DECISION_NOT_APPROVED,
    StatusCodes.UNKNOWN
  ];
}

/**
 * Application Reason codes.
 *
 * Note:
 *  - the code is the actual Tantalis reason code.
 *  - the reason code indicates additional information about the status code.
 *  - the reason codes don't have unique text, instead they use the same text as their Status
 *    counterpart: (Decision_Approved and Decision_Not_Approved).
 *
 * @export
 * @class ReasonCodes
 * @implements {ICodeSet}
 */
export class ReasonCodes implements ICodeSet {
  public static readonly AMENDMENT_APPROVED: ICodeGroup = {
    code: 'AMENDMENT APPROVED - APPLICATION',
    param: 'AA',
    text: { long: 'Decision: Approved - Tenure Issued', short: 'Approved' },
    mappedCodes: []
  };

  public static readonly AMENDMENT_NOT_APPROVED: ICodeGroup = {
    code: 'AMENDMENT NOT APPROVED - APPLICATION',
    param: 'ANA',
    text: { long: 'Decision: Not Approved', short: 'Not Approved' },
    mappedCodes: []
  };

  /**
   * @inheritdoc
   * @memberof ReasonCodes
   */
  public getCodeGroups = () => [ReasonCodes.AMENDMENT_APPROVED, ReasonCodes.AMENDMENT_NOT_APPROVED];
}

/**
 * Application Region codes.
 *
 * Note: the code is the actual Tantalis businessUnit code.
 *
 * @export
 * @class RegionCodes
 * @implements {ICodeSet}
 */
export class RegionCodes implements ICodeSet {
  public static readonly CARIBOO: ICodeGroup = {
    code: 'CA - LAND MGMNT - CARIBOO FIELD OFFICE',
    param: 'CA',
    text: { long: 'Cariboo, Williams Lake', short: 'Cariboo, Williams Lake' },
    mappedCodes: []
  };

  public static readonly KOOTENAY: ICodeGroup = {
    code: 'KO - LAND MGMNT - KOOTENAY FIELD OFFICE',
    param: 'KO',
    text: { long: 'Kootenay, Cranbrook', short: 'Kootenay, Cranbrook' },
    mappedCodes: []
  };

  public static readonly LOWER_MAINLAND: ICodeGroup = {
    code: 'LM - LAND MGMNT - LOWER MAINLAND SERVICE REGION',
    param: 'LM',
    text: { long: 'Lower Mainland, Surrey', short: 'Lower Mainland, Surrey' },
    mappedCodes: []
  };

  public static readonly OMENICA: ICodeGroup = {
    code: 'OM - LAND MGMNT - NORTHERN SERVICE REGION',
    param: 'OM',
    text: { long: 'Omenica/Peace, Prince George', short: 'Omenica/Peace, Prince George' },
    mappedCodes: []
  };

  public static readonly PEACE: ICodeGroup = {
    code: 'PE - LAND MGMNT - PEACE FIELD OFFICE',
    param: 'PE',
    text: { long: 'Peace, Ft. St. John', short: 'Peace, Ft. St. John' },
    mappedCodes: []
  };

  public static readonly SKEENA: ICodeGroup = {
    code: 'SK - LAND MGMNT - SKEENA FIELD OFFICE',
    param: 'SK',
    text: { long: 'Skeena, Smithers', short: 'Skeena, Smithers' },
    mappedCodes: []
  };

  public static readonly SOUTHERN_INTERIOR: ICodeGroup = {
    code: 'SI - LAND MGMNT - SOUTHERN SERVICE REGION',
    param: 'SI',
    text: { long: 'Thompson Okanagan, Kamloops', short: 'Thompson Okanagan, Kamloops' },
    mappedCodes: []
  };

  public static readonly VANCOUVER_ISLAND: ICodeGroup = {
    code: 'VI - LAND MGMNT - VANCOUVER ISLAND SERVICE REGION',
    param: 'VI',
    text: { long: 'West Coast, Nanaimo', short: 'West Coast, Nanaimo' },
    mappedCodes: []
  };

  /**
   * @inheritdoc
   * @memberof RegionCodes
   */
  public getCodeGroups = () => [
    RegionCodes.CARIBOO,
    RegionCodes.KOOTENAY,
    RegionCodes.LOWER_MAINLAND,
    RegionCodes.OMENICA,
    RegionCodes.PEACE,
    RegionCodes.SKEENA,
    RegionCodes.SOUTHERN_INTERIOR,
    RegionCodes.VANCOUVER_ISLAND
  ];
}

/**
 * Application Purpose codes.
 *
 * Note: the code is the actual Tantalis purpose code, while the mappedCodes are the subPurpose codes that belong to
 *       this parent code.
 *
 * @export
 * @class PurposeCodes
 * @implements {ICodeSet}
 */
export class PurposeCodes implements ICodeSet {
  public static readonly AGRICULTURE: ICodeGroup = {
    code: 'AGRICULTURE',
    param: 'AGR',
    text: { long: 'Agriculture', short: 'Agriculture' },
    mappedCodes: ['EXTENSIVE', 'INTENSIVE', 'GRAZING']
  };

  public static readonly 'ALL SEASONS RESORT': ICodeGroup = {
    code: 'ALL SEASONS RESORT',
    param: 'ALL',
    text: { long: 'All Seasons Resort', short: 'All Seasons Resort' },
    mappedCodes: ['MISCELLANEOUS']
  };

  public static readonly 'ALPINE SKIING': ICodeGroup = {
    code: 'ALPINE SKIING',
    param: 'ALP',
    text: { long: 'Alpine Skiing', short: 'Alpine Skiing' },
    mappedCodes: [
      'GENERAL',
      'LIFTS',
      'RUNS/TRAILS',
      'DAY SKIER FACILITY',
      'INDEPENDENT RECREATION FACILITY',
      'MAINTENANCE FACILITY',
      'PARKING FACILITY',
      'RESIDENTIAL',
      'COMMERCIAL RESIDENTIAL',
      'CONTROLLED RECREATION AREA',
      'MISCELLANEOUS',
      'SUPPORT UTILITY'
    ]
  };

  public static readonly AQUACULTURE: ICodeGroup = {
    code: 'AQUACULTURE',
    param: 'AQU',
    text: { long: 'Aquaculture', short: 'Aquaculture' },
    mappedCodes: ['FIN FISH', 'SHELL FISH', 'PLANTS', 'CRUSTACEANS']
  };

  public static readonly COMMERCIAL: ICodeGroup = {
    code: 'COMMERCIAL',
    param: 'COM',
    text: { long: 'Commercial', short: 'Commercial' },
    mappedCodes: [
      'GENERAL',
      'COMMERCIAL A',
      'COMMERCIAL B',
      'GOLF COURSE',
      'COMMERCIAL WHARF',
      'TRAPLINE CABIN',
      'FILM PRODUCTION',
      'MARINA',
      'PRIVATE YACHT CLUB',
      'MISCELLANEOUS',
      'MECHANIZED SKI GUIDING',
      'HUNTING/FISHING CAMP',
      'BACK-COUNTRY RECREATION',
      'RESORT HUNT/FISH CAMPS & WHARVES',
      'COMMERCIAL RECREATION DOCK'
    ]
  };

  public static readonly 'COMMERCIAL RECREATION': ICodeGroup = {
    code: 'COMMERCIAL RECREATION',
    param: 'CR',
    text: { long: 'Commercial Recreation', short: 'Commercial Recreation' },
    mappedCodes: [
      'HELI SKI',
      'CAT SKI',
      'NORDIC SKI (X COUNTRY SKIING)',
      'SNOWMOBILING',
      'HUNT CAMPS',
      'FISH CAMPS',
      'TIDAL SPORTS FISHING CAMPS',
      'PRIVATE CAMPS',
      'COMMUNITY OUTDOOR RECREATION',
      'GUIDED NATURE VIEWING',
      'GUIDED FRESHWATER RECREATION',
      'GUIDED SALTWATER RECREATION',
      'GUIDED MOUNTAINEERING/ROCK CLIMBING',
      'GUIDED CAVING',
      'MULTIPLE USE',
      'MISCELLANEOUS',
      'TRAIL RIDING',
      'HELI HIKING',
      'ECO TOURIST LODGE/RESORT',
      'SPECIAL ACTIVITIES'
    ]
  };

  public static readonly COMMUNICATION: ICodeGroup = {
    code: 'COMMUNICATION',
    param: 'CMU',
    text: { long: 'Communication', short: 'Communication' },
    mappedCodes: ['COMMUNICATION SITES', 'COMBINED USES']
  };

  public static readonly COMMUNITY: ICodeGroup = {
    code: 'COMMUNITY',
    param: 'CMY',
    text: { long: 'Community', short: 'Community' },
    mappedCodes: ['COMMUNITY FACILITY', 'MISCELLANEOUS', 'TRAIL MAINTENANCE']
  };

  public static readonly 'ENERGY PRODUCTION': ICodeGroup = {
    code: 'ENERGY PRODUCTION',
    param: 'EP',
    text: { long: 'Energy Production', short: 'Energy Production' },
    mappedCodes: [
      'GENERAL',
      'BATTERY SITE',
      'COMPRESSOR SITE',
      'DEHYDRATOR SITE',
      'FLARESITE',
      'INLET SITE',
      'METER SITE',
      'WATER ANALYZER',
      'DRILLSITE/WELLSITE',
      'REFINERY',
      'GAS PROCESSING PLANT',
      'MAJOR COMPRESSION FACILITY',
      'NON-FIELD TANK FARMS',
      'LAND FARMS',
      'CAMPSITE'
    ]
  };

  public static readonly 'ENVIRONMENT, CONSERVATION, & RECR': ICodeGroup = {
    code: 'ENVIRONMENT, CONSERVATION, & RECR',
    param: 'ECR',
    text: { long: 'Environment, Conservation, & Recreation', short: 'Environment, Conservation, & Recreation' },
    mappedCodes: [
      'ECOLOGICAL RESERVE',
      'GREENBELT',
      'WATERSHED RESERVE',
      'FISH AND WILDLIFE MANAGEMENT',
      'PUBLIC ACCESS/PUBLIC TRAILS',
      'FOREST MANAGEMENT RESEARCH',
      'FISHERY FACILITY',
      'UREP/RECREATION RESERVE',
      'FLOODING RESERVE',
      'SCIENCE MEASUREMENT/RESEARCH',
      'BUFFER ZONE',
      'ENVIRONMENT PROTECTION/CONSERVATION',
      'BOAT HAVEN',
      'HERITAGE/ARCHEOLOGICAL SITE',
      'PROTECTED AREA STRATEGY',
      'SNOW SURVEY'
    ]
  };

  public static readonly 'FIRST NATIONS': ICodeGroup = {
    code: 'FIRST NATIONS',
    param: 'FN',
    text: { long: 'First Nations', short: 'First Nations' },
    mappedCodes: [
      'INDIAN CUT-OFF',
      'RESERVE EXPANSION',
      'TREATY AREA',
      'SPECIFIC CLAIMS',
      'ROADS',
      'LAND CLAIM SETTLEMENT',
      'CULTURAL SIGNIFICANCE',
      'TRADITIONAL USE',
      'INTERIM MEASURES',
      'COMMUNITY FACILITY'
    ]
  };

  public static readonly INDUSTRIAL: ICodeGroup = {
    code: 'INDUSTRIAL',
    param: 'IND',
    text: { long: 'Industrial', short: 'Industrial' },
    mappedCodes: [
      'GENERAL',
      'LIGHT INDUSTRIAL',
      'HEAVY INDUSTRIAL',
      'LOG HANDLING/STORAGE',
      'MINERAL PRODUCTION',
      'INDUSTRIAL CAMPS',
      'MISCELLANEOUS'
    ]
  };

  public static readonly INSTITUTIONAL: ICodeGroup = {
    code: 'INSTITUTIONAL',
    param: 'INS',
    text: { long: 'Institutional', short: 'Institutional' },
    mappedCodes: [
      'FIRE HALL',
      'LOCAL/REGIONAL PARK',
      'HOSPITAL/HEALTH FACILITY',
      'INDOOR RECREATION FACILITY',
      'SCHOOL/OUTDOOR EDUCATION FACILITY',
      'WASTE DISPOSAL SITE',
      'CEMETERY',
      'PUBLIC WORKS',
      'POLICE FACILITY',
      'CORRECTIONS FACILITY',
      'MILITARY SITE',
      'MISCELLANEOUS'
    ]
  };

  public static readonly 'MISCELLANEOUS LAND USES': ICodeGroup = {
    code: 'MISCELLANEOUS LAND USES',
    param: 'MLU',
    text: { long: 'Miscellaneous Land Uses', short: 'Miscellaneous Land Uses' },
    mappedCodes: ['PLANNING/MARKETING/DEVELOP PROJECTS', 'LAND EXCHANGE', 'OTHER', 'LAND USE PLAN INTERIM AGREEMENT']
  };

  public static readonly 'OCEAN ENERGY': ICodeGroup = {
    code: 'OCEAN ENERGY',
    param: 'OE',
    text: { long: 'Ocean Energy', short: 'Ocean Energy' },
    mappedCodes: ['INVESTIGATIVE AND MONITORING PHASE', 'GENERAL AREA']
  };

  public static readonly QUARRYING: ICodeGroup = {
    code: 'QUARRYING',
    param: 'QRY',
    text: { long: 'Quarrying', short: 'Quarrying' },
    mappedCodes: [
      'SAND AND GRAVEL',
      'PEAT AND SOIL',
      'LIMESTONE AND DOLOMITE',
      'POZZOLAN, CLAY, DIATOMACEOUS EARTH',
      'MISCELLANEOUS',
      'ROCK FOR CRUSHING',
      'CONSTRUCTION STONE',
      'RIP RAP',
      'PUBLIC SAFETY - FLOOD MITIGATION'
    ]
  };

  public static readonly RESIDENTIAL: ICodeGroup = {
    code: 'RESIDENTIAL',
    param: 'RES',
    text: { long: 'Residential', short: 'Residential' },
    mappedCodes: [
      'URBAN RESIDENTIAL',
      'RURAL RESIDENTIAL',
      'REMOTE RESIDENTIAL',
      'FLOATING COMMUNITY',
      'FLOATING CABIN',
      'PRIVATE MOORAGE',
      'MISCELLANEOUS',
      'RECREATIONAL RESIDENTIAL',
      'STRATA MOORAGE',
      'THERMAL LOOPS',
      'APPLICATION ONLY - PRIVATE MOORAGE'
    ]
  };

  public static readonly 'SOLAR POWER': ICodeGroup = {
    code: 'SOLAR POWER',
    param: 'SP',
    text: { long: 'Solar Power', short: 'Solar Power' },
    mappedCodes: ['INVESTIGATIVE PHASE']
  };

  public static readonly 'TRANSPORTATION': ICodeGroup = {
    code: 'TRANSPORTATION',
    param: 'TRN',
    text: { long: 'Transportation', short: 'Transportation' },
    mappedCodes: [
      'AIRPORT/AIRSTRIP',
      'ROADWAY',
      'RAILWAY',
      'FERRY TERMINAL',
      'PUBLIC WHARF',
      'NAVIGATION AID',
      'BRIDGES'
    ]
  };

  public static readonly UTILITY: ICodeGroup = {
    code: 'UTILITY',
    param: 'UTL',
    text: { long: 'Utility', short: 'Utility' },
    mappedCodes: [
      'ELECTRIC POWER LINE',
      'GAS AND OIL PIPELINE',
      'TELECOMMUNICATION LINE',
      'WATER LINE',
      'SEWER/EFFLUENT LINE',
      'MISCELLANEOUS',
      'CATHODIC SITE/ANODE BEDS'
    ]
  };

  public static readonly WATERPOWER: ICodeGroup = {
    code: 'WATERPOWER',
    param: 'WAT',
    text: { long: 'Waterpower', short: 'Waterpower' },
    mappedCodes: [
      'GENERAL AREA',
      'POWERHOUSE SITE',
      'PENSTOCK',
      'TRANSMISSION LINE',
      'ROAD',
      'COMMUNICATION SITE',
      'QUARRY',
      'INVESTIGATIVE PHASE',
      'CAMP',
      'INTAKE',
      'NON-COMMERCIAL'
    ]
  };

  public static readonly WINDPOWER: ICodeGroup = {
    code: 'WINDPOWER',
    param: 'WND',
    text: { long: 'Windpower', short: 'Windpower' },
    mappedCodes: [
      'INVESTIGATIVE AND MONITORING PHASE',
      'DEVELOPMENT PHASE',
      'OPERATING PHASE',
      'INVESTIGATIVE PHASE',
      'GENERAL AREA',
      'INTENSIVE',
      'EXTENSIVE',
      'TRANSMISSION LINE',
      'ROAD',
      'QUARRY',
      'COMMUNICATION SITE',
      'NON-COMMERCIAL'
    ]
  };

  /**
   * @inheritdoc
   * @memberof PurposeCodes
   */
  public getCodeGroups = () => [
    PurposeCodes.AGRICULTURE,
    PurposeCodes['ALL SEASONS RESORT'],
    PurposeCodes['ALPINE SKIING'],
    PurposeCodes.AQUACULTURE,
    PurposeCodes.COMMERCIAL,
    PurposeCodes['COMMERCIAL RECREATION'],
    PurposeCodes.COMMUNICATION,
    PurposeCodes.COMMUNITY,
    PurposeCodes['ENERGY PRODUCTION'],
    PurposeCodes['ENVIRONMENT, CONSERVATION, & RECR'],
    PurposeCodes['FIRST NATIONS'],
    PurposeCodes.INDUSTRIAL,
    PurposeCodes.INSTITUTIONAL,
    PurposeCodes['MISCELLANEOUS LAND USES'],
    PurposeCodes['OCEAN ENERGY'],
    PurposeCodes.QUARRYING,
    PurposeCodes.RESIDENTIAL,
    PurposeCodes['SOLAR POWER'],
    PurposeCodes.TRANSPORTATION,
    PurposeCodes.UTILITY,
    PurposeCodes.WATERPOWER,
    PurposeCodes.WINDPOWER
  ];
}

/**
 * Application Land Use Type codes.
 *
 * Note: these codes are currently not used in ACRFD.
 *
 * @export
 * @class LandUseTypeCodes
 * @implements {ICodeSet}
 */
export class LandUseTypeCodes implements ICodeSet {
  public static readonly 'CERTIFICATE OF PURCHASE': ICodeGroup = {
    code: 'CERTIFICATE OF PURCHASE',
    param: '',
    text: { long: '', short: '' },
    mappedCodes: ['DIRECT SALE', 'FROM LEASE-PURCHASE OPTION', 'PRE-TANTALIS CERTIFICATE OF PURCHASE', 'TEMPORARY CODE']
  };

  public static readonly 'CROWN GRANT': ICodeGroup = {
    code: 'CROWN GRANT',
    param: '',
    text: { long: '', short: '' },
    mappedCodes: [
      'DIRECT SALE',
      'FREE CROWN GRANT',
      'FROM LEASE-PURCHASE OPTION',
      'HISTORIC',
      'HISTORIC CROWN GRANT',
      'LAND EXCHANGE',
      'PRE-EMPTION',
      'PRE-TANTALIS CROWN GRANT',
      'TEMPORARY CODE'
    ]
  };

  public static readonly 'DEVELOPMENT AGREEMENT': ICodeGroup = {
    code: 'DEVELOPMENT AGREEMENT',
    param: '',
    text: { long: '', short: '' },
    mappedCodes: ['ALPINE SKI DEVELOPMENT', 'PRE-TANTALIS DEVELOPMENTAL AGREEMENT']
  };

  public static readonly 'DOMINION PATENTS': ICodeGroup = {
    code: 'DOMINION PATENTS',
    param: '',
    text: { long: '', short: '' },
    mappedCodes: ['PRE-TANTALIS DOMINION PATENTS']
  };

  public static readonly INCLUSION: ICodeGroup = {
    code: 'INCLUSION',
    param: '',
    text: { long: '', short: '' },
    mappedCodes: [
      'ACCESS',
      'AGREEMENT',
      'INCLUSION',
      'LAND TITLE ACT ACCRETION',
      'LAND TITLE ACT BOUNDARY ADJUSTMENT',
      'PRE-TANTALIS INCLUSION'
    ]
  };

  public static readonly INVENTORY: ICodeGroup = {
    code: 'INVENTORY',
    param: '',
    text: { long: '', short: '' },
    mappedCodes: ['BCAL INVENTORY']
  };

  public static readonly LEASE: ICodeGroup = {
    code: 'LEASE',
    param: '',
    text: { long: '', short: '' },
    mappedCodes: ['HEAD LEASE', 'LEASE - PURCHASE OPTION', 'PRE-TANTALIS LEASE', 'STANDARD LEASE']
  };

  public static readonly LICENCE: ICodeGroup = {
    code: 'LICENCE',
    param: '',
    text: { long: '', short: '' },
    mappedCodes: ['LICENCE OF OCCUPATION', 'PRE-TANTALIS LICENCE']
  };

  public static readonly 'OIC ECOLOGICAL RESERVE ACT': ICodeGroup = {
    code: 'OIC ECOLOGICAL RESERVE ACT',
    param: '',
    text: { long: '', short: '' },
    mappedCodes: ['OIC ECOLOGICAL RESERVES', 'PRE-TANTALIS OIC ECO RESERVE']
  };

  public static readonly PERMIT: ICodeGroup = {
    code: 'PERMIT',
    param: '',
    text: { long: '', short: '' },
    mappedCodes: [
      'INVESTIGATIVE PERMIT',
      'PRE-TANTALIS PERMIT',
      'ROADS & BRIDGES',
      'TEMPORARY CODE',
      'TEMPORARY PERMIT'
    ]
  };

  public static readonly 'PRE-TANTALIS': ICodeGroup = {
    code: 'PRE-TANTALIS',
    param: '',
    text: { long: '', short: '' },
    mappedCodes: ['PRE-TANTALIS']
  };

  public static readonly 'PROVINCIAL PARK': ICodeGroup = {
    code: 'PROVINCIAL PARK',
    param: '',
    text: { long: '', short: '' },
    mappedCodes: ['PARKS', 'PRE-TANTALIS PARKS', 'PRE-TANTALIS PARKS (00 ON TAS/CLR)']
  };

  public static readonly 'RESERVE/NOTATION': ICodeGroup = {
    code: 'RESERVE/NOTATION',
    param: '',
    text: { long: '', short: '' },
    mappedCodes: [
      'DESIGNATED USE AREA',
      'MAP RESERVE',
      'NOTATION OF INTEREST',
      'OIC RESERVE',
      'PRE-TANTALIS RESERVE/NOTATION',
      'PROHIBITED USE AREA',
      'TEMPORARY CODE'
    ]
  };

  public static readonly 'REVENUE SHARING AGREEMENT': ICodeGroup = {
    code: 'REVENUE SHARING AGREEMENT',
    param: '',
    text: { long: '', short: '' },
    mappedCodes: ['REVENUE SHARING AGREEMENT']
  };

  public static readonly 'RIGHT-OF-WAY': ICodeGroup = {
    code: 'RIGHT-OF-WAY',
    param: '',
    text: { long: '', short: '' },
    mappedCodes: ['INTERIM LICENCE', 'STATUTORY RIGHT OF WAY OR EASEMENT', 'PRE-TANTALIS RIGHT-OF-WAY']
  };

  public static readonly 'TRANSFER OF ADMINISTRATION/CONTROL': ICodeGroup = {
    code: 'TRANSFER OF ADMINISTRATION/CONTROL',
    param: '',
    text: { long: '', short: '' },
    mappedCodes: [
      'FED TRANSFER OF ADMIN, CONTROL & BEN',
      'PRE-TANTALIS TRANSFER OF ADMIN/CONT',
      'PROVINCIAL TRANSFER OF ADMIN'
    ]
  };

  /**
   * @inheritdoc
   * @memberof LandUseTypeCodes
   */
  public getCodeGroups = () => [
    LandUseTypeCodes['CERTIFICATE OF PURCHASE'],
    LandUseTypeCodes['CROWN GRANT'],
    LandUseTypeCodes['DEVELOPMENT AGREEMENT'],
    LandUseTypeCodes['DOMINION PATENTS'],
    LandUseTypeCodes.INCLUSION,
    LandUseTypeCodes.INVENTORY,
    LandUseTypeCodes.LEASE,
    LandUseTypeCodes.LICENCE,
    LandUseTypeCodes['OIC ECOLOGICAL RESERVE ACT'],
    LandUseTypeCodes.PERMIT,
    LandUseTypeCodes['PRE-TANTALIS'],
    LandUseTypeCodes['PROVINCIAL PARK'],
    LandUseTypeCodes['RESERVE/NOTATION'],
    LandUseTypeCodes['REVENUE SHARING AGREEMENT'],
    LandUseTypeCodes['RIGHT-OF-WAY'],
    LandUseTypeCodes['TRANSFER OF ADMINISTRATION/CONTROL']
  ];
}
