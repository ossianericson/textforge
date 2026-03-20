export interface Option {
  text: string;
  next: string;
  recommended: boolean;
  advanced: boolean;
}

export type QuestionOption = Option;

export interface DropdownRange {
  min: number;
  max: number;
  next: string;
  label: string;
}

export interface TooltipDefinition {
  term: string;
  definition: string;
}

export interface MultiSelectRoute {
  values: string[];
  next: string;
}

export interface MatrixScale {
  min: number;
  max: number;
}

export interface DropdownBucketRange {
  min: number;
  max: number;
  bucket: string;
  label: string;
}

export interface MatrixTableRow {
  label: string;
  cells: string[];
}

export interface MatrixTable {
  columns: string[];
  rows: MatrixTableRow[];
}

export interface ContextCapture {
  key: string;
  from: 'optionText';
}

export interface Question {
  title: string;
  subtitle: string;
  infoBox: string | null;
  type?:
    | 'buttons'
    | 'dropdown'
    | 'dropdown-pair'
    | 'slider'
    | 'multi-select'
    | 'toggle'
    | 'scoring-matrix';
  options: Option[];
  contextCapture?: ContextCapture;
  tooltips?: TooltipDefinition[];
  dropdownLabel?: string;
  dropdownRanges?: DropdownRange[];
  dropdownLeftLabel?: string;
  dropdownLeftRanges?: DropdownBucketRange[];
  dropdownRightLabel?: string;
  dropdownRightRanges?: DropdownBucketRange[];
  dropdownMatrix?: Record<string, Record<string, string>>;
  dropdownTierMatrix?: Record<string, Record<string, string>>;
  dropdownPairImage?: string;
  dropdownPairImageAlt?: string;
  dropdownMatrixTable?: MatrixTable;
  sliderLabel?: string;
  sliderRanges?: DropdownRange[];
  multiSelectOptions?: string[];
  multiSelectRoutes?: MultiSelectRoute[];
  multiSelectFallback?: string;
  toggleLabel?: string;
  toggleOnNext?: string;
  toggleOffNext?: string;
  scoringMatrixCategories?: string[];
  scoringMatrixScale?: MatrixScale;
  scoringMatrixRoutes?: DropdownRange[];
}

export interface TitleData {
  main: string;
  subtitle: string;
}

export interface Badge {
  text: string;
  className: string;
}

export interface DocLink {
  label: string;
  url: string;
}

export type LinkInfo = DocLink;

export interface LinkParseResult {
  text: string;
  links: LinkInfo[];
}

export interface SupportSection {
  title: string;
  lines: string[];
  links: LinkInfo[];
}

export interface ServiceConfigBlock {
  name: string;
  items: string[];
}

export interface Warning {
  title: string;
  text: string;
}

export type WarningBlock = Warning;

export interface CopyBlock {
  title: string;
  content: string;
}

export interface Result {
  title: string;
  breadcrumb?: string;
  icon: string;
  badge: Badge;
  bestFor: string[];
  keyBenefits: string[];
  considerations: string[];
  whenNotToUse: string[];
  techTags: string[];
  searchTags?: string[];
  docs: DocLink[];
  contact?: string[];
  additionalConsiderations: string;
  dataServiceConfigs?: ServiceConfigBlock[];
  computePlatformConfigs?: ServiceConfigBlock[];
  platformFitWarnings?: string[];
  costProfile?: string[];
  tierComparison?: string[];
  networkingEssentials?: string[];
  sharedServicesEssentials?: string[];
  iacRequirement?: string[];
  drTestingCadence?: string[];
  nextSteps?: string[];
  overview?: string;
  footnote?: string;
  warning?: Warning;
  infoNote?: string;
  platformTechnologies?: string[];
  recommendedWith?: string[];
  migrationPath?: string[];
  responsibility?: string[];
  responsibilityLinks?: DocLink[];
  supportSection?: SupportSection;
  copyBlocks?: CopyBlock[];
  expertDetail?: string;
}

export type ResultCard = Result;

export type QuestionMap = Record<string, Question>;
export type ResultMap = Record<string, Result>;
export type ProgressSteps = Record<string, number>;

export interface SectionIndices {
  flowStart: number;
  resultStart: number;
  progressStart: number;
}

export interface ParsedSpec {
  title: TitleData;
  metadata?: ParsedMetadata;
  questions: QuestionMap;
  results: ResultMap;
  progressSteps: ProgressSteps;
}

export interface ParsedMetadata {
  version?: string;
  compiledAt?: string;
}

export interface StudyCard {
  id: string;
  title: string;
  front: string;
  back: string;
  hint?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'mcq';
  options: { key: string; text: string }[];
  answer: string;
  explanation: string;
  topicTag?: string;
}

export interface QuizSpec {
  title: string;
  grade: string;
  subject: string;
  topic: string;
  studyCards: StudyCard[];
  quizQuestions: QuizQuestion[];
  summary: string[];
}

export type ParseQuestions = (lines: string[], startIndex: number, endIndex: number) => QuestionMap;
export type ParseResults = (lines: string[], startIndex: number, endIndex: number) => ResultMap;
export type ParseProgressSteps = (lines: string[], startIndex?: number) => ProgressSteps;
export type ParseTitle = (lines: string[], limitIndex?: number) => TitleData;
export type ParseSpecMetadata = (lines: string[], limitIndex?: number) => ParsedMetadata;
export type FindSectionIndices = (lines: string[]) => SectionIndices;
