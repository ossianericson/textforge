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

export type QuestionType =
  | 'buttons'
  | 'dropdown'
  | 'dropdown-pair'
  | 'slider'
  | 'multi-select'
  | 'toggle'
  | 'scoring-matrix';

export type EditorNodeType = 'question' | 'result';

export interface ValidationWarning {
  line: number;
  code: string;
  message: string;
  nodeId?: string;
}

export interface ToastItem {
  id: string;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export interface BadgeDefinition {
  label: string;
  color: string;
  className: string;
}

export interface AIReviewIssue {
  type: 'error' | 'warning' | 'suggestion';
  nodeId: string | null;
  message: string;
}

export interface DiscoveredEndpoint {
  name: string;
  endpoint: string;
  location: string;
  resource_id: string;
}

export interface AIConfig {
  endpoint: string;
  deployment: string;
  resource_id: string;
}

export type AIProvider = 'azure' | 'openai' | 'custom' | 'none';

export interface AIStatus {
  ok: boolean;
  provider: string;
  account?: string | null;
}

export interface EnterpriseConfig {
  allowed_providers?: string[] | null;
  azure_tenant_id?: string | null;
  azure_client_id?: string | null;
  azure_endpoint?: string | null;
  azure_deployment?: string | null;
  disable_external_providers?: boolean | null;
}

export interface RecentFile {
  path: string;
  title: string;
  lastOpened: number;
  lastCompiled: number;
  questionCount: number;
  resultCount: number;
  warningCount: number;
  usageCount: number;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  domain: string;
  icon: string;
  tags: string[];
  spec: ParsedSpec;
  completeness: number;
}

export interface RepoConnection {
  url: string;
  branch: string;
  local_path: string;
  current_branch: string;
  last_synced: number;
}

export interface SavedRepoConnection {
  url: string;
  branch: string;
  local_path: string;
  last_synced: number;
}

export interface RepoSpecEntry {
  path: string;
  title: string;
  kind: 'tree' | 'quiz' | string;
  modified_at: number;
  has_warnings: boolean;
}

export interface CommitResult {
  branch: string;
  commit_oid: string;
  pushed: boolean;
  created_pull_request: boolean;
  pull_request_url: string | null;
  message: string;
}
