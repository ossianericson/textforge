import {
  cleanInlineText,
  extractAfterColon,
  normalizeText,
  stripQuotes,
} from '#parser-utils/text-normalizer';
import {
  parseDocsInline,
  parseInlineList,
  renderInlineMarkdown,
  stripLinks,
  stripMarkdown,
} from '#parser-utils/markdown-renderer';
import type {
  ParseResults,
  ResultCard,
  ResultMap,
  ResultParserDependencies,
  SupportSection,
  WarningBlock,
} from './types.js';

type SectionName =
  | 'bestFor'
  | 'keyBenefits'
  | 'platformTechnologies'
  | 'recommendedWith'
  | 'migrationPath'
  | 'considerations'
  | 'whenNotToUse'
  | 'docs'
  | 'responsibility'
  | 'supportSection'
  | 'contact'
  | 'additionalConsiderations'
  | 'dataServiceConfig'
  | 'computePlatformConfig'
  | 'platformFitWarnings'
  | 'costProfile'
  | 'tierComparison'
  | 'networkingEssentials'
  | 'sharedServicesEssentials'
  | 'iacRequirement'
  | 'drTestingCadence'
  | 'nextSteps'
  | 'copyBlock'
  | null;

type WarningCapture = { title: string; lines: string[]; collecting: boolean };

type WarningBlockCapture = { lines: string[] };

type CopyBlockCapture = { title: string; lines: string[] };

type ServiceConfigType = 'data' | 'compute';

const SECTION_HEADERS = new Set([
  'best for',
  'key benefits',
  'platform technologies',
  'recommended with',
  'migration path',
  'considerations',
  'when not to use',
  'tech tags',
  'search tags',
  'docs',
  'additional considerations',
  'data service dr configuration',
  'compute platform dr configuration',
  'platform fit warnings',
  'cost profile',
  'tier comparison',
  'networking essentials',
  'networking essentials (applies to all strategies)',
  'shared services essentials',
  'shared services essentials (applies to all strategies)',
  'iac requirement',
  'dr testing cadence',
  'next steps',
  'responsibility model & contact',
  'contact',
  'support section',
  'support section - platform contact information',
  'warning box',
  'warning',
  'note',
  'overview',
  'footnote',
]);

function createResultParser(dependencies: Partial<ResultParserDependencies> = {}): ParseResults {
  const {
    cleanInlineText: cleanInlineTextFn = cleanInlineText,
    extractAfterColon: extractAfterColonFn = extractAfterColon,
    normalizeText: normalizeTextFn = normalizeText,
    stripQuotes: stripQuotesFn = stripQuotes,
    parseDocsInline: parseDocsInlineFn = parseDocsInline,
    parseInlineList: parseInlineListFn = parseInlineList,
    renderInlineMarkdown: renderInlineMarkdownFn = renderInlineMarkdown,
    stripLinks: stripLinksFn = stripLinks,
    stripMarkdown: stripMarkdownFn = stripMarkdown,
  } = dependencies;

  function isResultHeader(line: string): boolean {
    if (!line) return false;
    if (line.startsWith('#### ') && /result-[a-z0-9-]+/i.test(line)) return true;
    if (line.startsWith('### ') && line.includes('result-')) return true;
    return false;
  }

  function isGroupHeader(line: string): boolean {
    return line.startsWith('#### ') && !/result-[a-z0-9-]+/i.test(line);
  }

  function isBoldResultHeader(line: string): boolean {
    return /^\*\*.+\(result-[^)]+\)\*\*/i.test(line);
  }

  function extractResultId(line: string): string | null {
    const match = line.match(/result-[a-z0-9-]+/i);
    return match ? match[0].toLowerCase() : null;
  }

  function extractBoldResultTitle(line: string): string {
    const cleaned = line.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    return cleaned.replace(/\s*\(result-[^)]+\)\s*$/i, '').trim();
  }

  function extractGroupTitle(line: string): string {
    return line.replace(/^####\s*/, '').trim();
  }

  function applyGroupTitlePrefix(title: string, groupTitle: string): string {
    if (!groupTitle) return title;
    if (/blob storage/i.test(groupTitle) && /^blob\s+/i.test(title)) {
      return title.replace(/^blob\s+/i, 'Blob Storage - ');
    }
    return title;
  }

  function extractResultTitle(line: string): string {
    let title = line.replace(/^#+\s*/, '').trim();
    title = title.replace(/^\d+\.\s*/, '').trim();
    title = title.replace(/\s*\(id="result-[^"]+"\)\s*$/i, '').trim();
    title = title.replace(/\s*\(result-[^)]+\)\s*$/i, '').trim();
    return title;
  }

  function extractSupportSectionTitle(line: string): string {
    const text = line.replace(/^\*\*Support Section/iu, '').trim();
    const title = text
      .replace(/[:*]/g, '')
      .replace(/^[-\s]+/, '')
      .trim();
    return title || 'Support Section';
  }

  function extractServiceBlockTitle(line: string): string | null {
    const match = line.match(/^\*\*\[([^\]]+)\]\s*:\*\*$/);
    if (!match || !match[1]) {
      return null;
    }
    return normalizeTextFn(match[1].trim());
  }

  function isSectionHeader(line: string): boolean {
    const clean = line.replace(/\*+/g, '').replace(/:$/, '').trim().toLowerCase();
    return clean.startsWith('copy block') || SECTION_HEADERS.has(clean);
  }

  function isCopyBlockHeader(line: string): boolean {
    const clean = line.replace(/^\*\*/, '').replace(/\*\*$/, '').trim().toLowerCase();
    return clean.startsWith('copy block');
  }

  function extractCopyBlockTitle(line: string): string {
    const clean = line.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    const colonIndex = clean.indexOf(':');
    if (colonIndex === -1) {
      return 'Copy Block';
    }
    return normalizeTextFn(clean.slice(colonIndex + 1).trim()) || 'Copy Block';
  }

  function finalizeWarningBlock(lines: string[]): WarningBlock | null {
    const cleaned = lines.map((line) => line.trim()).filter(Boolean);
    if (!cleaned.length) return null;
    const title = normalizeTextFn(cleaned[0] || '');
    const text = normalizeTextFn(cleaned.slice(1).join(' '));
    return {
      title: stripMarkdownFn(title),
      text: renderInlineMarkdownFn(stripMarkdownFn(text)),
    };
  }

  function isHeaderLine(line: string, header: string): boolean {
    const cleaned = stripMarkdownFn(line).toLowerCase();
    return cleaned.startsWith(header.toLowerCase());
  }

  function isWhenNotToUseHeader(line: string): boolean {
    const stripped = stripMarkdownFn(line).toLowerCase();
    const compact = stripped.replace(/[^a-z]/g, '');
    return compact.startsWith('whennottouse');
  }

  const parseResults: ParseResults = (lines, startIndex, endIndex) => {
    const results: ResultMap = {};
    if (
      startIndex === -1 ||
      endIndex === -1 ||
      startIndex === undefined ||
      endIndex === undefined
    ) {
      return results;
    }

    const context: {
      current: { id: string; data: ResultCard } | null;
      currentSection: SectionName;
      warningCapture: WarningCapture | null;
      warningBlockCapture: WarningBlockCapture | null;
      copyBlockCapture: CopyBlockCapture | null;
      groupActive: boolean;
      groupIds: string[];
      groupTitle: string;
      defaultBadgeText: string;
      activeServiceType: ServiceConfigType | null;
      activeServiceName: string | null;
    } = {
      current: null,
      currentSection: null,
      warningCapture: null,
      warningBlockCapture: null,
      copyBlockCapture: null,
      groupActive: false,
      groupIds: [],
      groupTitle: '',
      defaultBadgeText: '',
      activeServiceType: null,
      activeServiceName: null,
    };

    const finalizeCopyBlockCapture = () => {
      if (!context.current || !context.copyBlockCapture) {
        return;
      }
      context.current.data.copyBlocks = context.current.data.copyBlocks || [];
      context.current.data.copyBlocks.push({
        title: context.copyBlockCapture.title,
        content: context.copyBlockCapture.lines.join('\n'),
      });
      context.copyBlockCapture = null;
      if (context.currentSection === 'copyBlock') {
        context.currentSection = null;
      }
    };

    const commitCurrent = () => {
      finalizeCopyBlockCapture();
      if (context.current) {
        results[context.current.id] = context.current.data;
      }
    };

    const applyToGroup = (handler: (target: ResultCard) => void) => {
      if (context.groupActive && context.groupIds.length) {
        context.groupIds.forEach((id) => {
          const target = results[id];
          if (target) {
            handler(target);
          }
        });
        return;
      }
      if (context.current) {
        handler(context.current.data);
      }
    };

    const createResultCard = (title: string, badgeText: string): ResultCard => ({
      title,
      breadcrumb: '',
      icon: '',
      badge: { text: badgeText, className: '' },
      bestFor: [],
      keyBenefits: [],
      considerations: [],
      whenNotToUse: [],
      techTags: [],
      searchTags: [],
      docs: [],
      contact: [],
      additionalConsiderations: '',
      dataServiceConfigs: [],
      computePlatformConfigs: [],
      platformFitWarnings: [],
      costProfile: [],
      tierComparison: [],
      networkingEssentials: [],
      sharedServicesEssentials: [],
      iacRequirement: [],
      drTestingCadence: [],
      nextSteps: [],
    });

    const resetWarningState = () => {
      context.warningCapture = null;
      context.warningBlockCapture = null;
    };

    const finalizeInlineWarning = (force = false) => {
      if (!context.warningCapture || !context.warningCapture.lines.length) {
        return false;
      }
      if (!force && context.warningCapture.collecting) {
        return false;
      }
      if (context.current) {
        const warningText = renderInlineMarkdownFn(
          stripMarkdownFn(context.warningCapture.lines.join(' ').trim())
        );
        context.current.data.warning = {
          title: context.warningCapture.title,
          text: warningText,
        };
      }
      context.warningCapture = null;
      return true;
    };

    const finalizeWarningBlockCapture = () => {
      if (!context.warningBlockCapture) {
        return;
      }
      const warning = finalizeWarningBlock(context.warningBlockCapture.lines);
      if (warning && context.current) {
        context.current.data.warning = warning;
      }
      context.warningBlockCapture = null;
      context.currentSection = null;
    };

    const startGroup = (line: string) => {
      commitCurrent();
      context.groupActive = true;
      context.groupIds = [];
      context.groupTitle = extractGroupTitle(line);
      context.current = null;
      context.currentSection = null;
      context.activeServiceType = null;
      context.activeServiceName = null;
      resetWarningState();
    };

    const startBoldResult = (line: string) => {
      commitCurrent();
      const id = extractResultId(line);
      if (!id) {
        context.current = null;
        return;
      }
      const title = applyGroupTitlePrefix(extractBoldResultTitle(line), context.groupTitle);
      context.current = {
        id,
        data: createResultCard(title, context.defaultBadgeText),
      };
      results[id] = context.current.data;
      context.groupIds.push(id);
      context.currentSection = null;
      context.activeServiceType = null;
      context.activeServiceName = null;
      resetWarningState();
    };

    const startResult = (line: string) => {
      commitCurrent();
      context.groupActive = false;
      context.groupIds = [];
      context.groupTitle = '';
      context.activeServiceType = null;
      context.activeServiceName = null;
      const id = extractResultId(line);
      if (!id) {
        context.current = null;
        return;
      }
      context.current = {
        id,
        data: createResultCard(extractResultTitle(line), ''),
      };
      results[id] = context.current.data;
      context.currentSection = null;
      resetWarningState();
    };

    const ensureServiceConfig = (
      target: ResultCard,
      name: string,
      type: ServiceConfigType
    ): { name: string; items: string[] } => {
      const field = type === 'data' ? 'dataServiceConfigs' : 'computePlatformConfigs';
      const configs = target[field] || [];
      const existing = configs.find((entry) => entry.name === name);
      if (existing) {
        return existing;
      }
      const created = { name, items: [] };
      configs.push(created);
      target[field] = configs;
      return created;
    };

    const sectionHandlers: Record<string, (item: string, rawItem: string) => void> = {
      bestFor: (item) => {
        const current = context.current;
        if (!current) return;
        current.data.bestFor.push(item);
      },
      keyBenefits: (item) => {
        const current = context.current;
        if (!current) return;
        current.data.keyBenefits.push(item);
      },
      platformTechnologies: (item) => {
        const current = context.current;
        if (!current) return;
        current.data.platformTechnologies = current.data.platformTechnologies || [];
        current.data.platformTechnologies.push(item);
      },
      recommendedWith: (item) => {
        const current = context.current;
        if (!current) return;
        current.data.recommendedWith = current.data.recommendedWith || [];
        current.data.recommendedWith.push(item);
      },
      migrationPath: (item) => {
        const current = context.current;
        if (!current) return;
        current.data.migrationPath = current.data.migrationPath || [];
        current.data.migrationPath.push(item);
      },
      considerations: (item) => {
        const current = context.current;
        if (!current) return;
        current.data.considerations.push(item);
      },
      whenNotToUse: (item) => {
        applyToGroup((target) => {
          target.whenNotToUse.push(item);
        });
      },
      platformFitWarnings: (item) => {
        applyToGroup((target) => {
          target.platformFitWarnings = target.platformFitWarnings || [];
          target.platformFitWarnings.push(item);
        });
      },
      costProfile: (item) => {
        applyToGroup((target) => {
          target.costProfile = target.costProfile || [];
          target.costProfile.push(item);
        });
      },
      tierComparison: (item) => {
        applyToGroup((target) => {
          target.tierComparison = target.tierComparison || [];
          target.tierComparison.push(item);
        });
      },
      networkingEssentials: (item) => {
        applyToGroup((target) => {
          target.networkingEssentials = target.networkingEssentials || [];
          target.networkingEssentials.push(item);
        });
      },
      sharedServicesEssentials: (item) => {
        applyToGroup((target) => {
          target.sharedServicesEssentials = target.sharedServicesEssentials || [];
          target.sharedServicesEssentials.push(item);
        });
      },
      iacRequirement: (item) => {
        applyToGroup((target) => {
          target.iacRequirement = target.iacRequirement || [];
          target.iacRequirement.push(item);
        });
      },
      drTestingCadence: (item) => {
        applyToGroup((target) => {
          target.drTestingCadence = target.drTestingCadence || [];
          target.drTestingCadence.push(item);
        });
      },
      nextSteps: (item) => {
        applyToGroup((target) => {
          target.nextSteps = target.nextSteps || [];
          target.nextSteps.push(item);
        });
      },
      docs: (item) => {
        applyToGroup((target) => {
          target.docs = target.docs.concat(parseDocsInlineFn(item, target.title));
        });
      },
      responsibility: (_item, rawItem) => {
        const parsed = stripLinksFn(rawItem);
        applyToGroup((target) => {
          target.responsibility = target.responsibility || [];
          target.responsibilityLinks = target.responsibilityLinks || [];
          target.responsibility.push(parsed.text);
          target.responsibilityLinks = target.responsibilityLinks.concat(parsed.links);
        });
      },
      supportSection: (_item, rawItem) => {
        const parsed = stripLinksFn(rawItem);
        applyToGroup((target) => {
          if (!target.supportSection) {
            target.supportSection = {
              title: 'Support Section',
              lines: [],
              links: [],
            } as SupportSection;
          }
          target.supportSection.lines.push(parsed.text);
          target.supportSection.links = target.supportSection.links.concat(parsed.links);
        });
      },
      contact: (item) => {
        applyToGroup((target) => {
          target.contact = target.contact || [];
          target.contact.push(item);
        });
      },
      additionalConsiderations: (item) => {
        applyToGroup((target) => {
          target.additionalConsiderations = `${target.additionalConsiderations} ${item}`.trim();
        });
      },
    };

    const handleMetadataLine = (line: string): boolean => {
      if (!context.current) {
        return false;
      }
      if (line.startsWith('- Icon:')) {
        context.current.data.icon = normalizeTextFn(stripQuotesFn(extractAfterColonFn(line)));
        return true;
      }

      if (line.startsWith('- Badge:')) {
        const badgeText = stripQuotesFn(extractAfterColonFn(line));
        const badgeValue = badgeText.split('(')[0] || '';
        context.current.data.badge.text = badgeValue.trim();
        return true;
      }

      return false;
    };

    const handleHeaderLine = (line: string): boolean => {
      if (!context.current) {
        return false;
      }
      if (isHeaderLine(line, 'overview')) {
        const overviewText = stripQuotesFn(
          cleanInlineTextFn(stripQuotesFn(extractAfterColonFn(line)))
        );
        context.current.data.overview = renderInlineMarkdownFn(overviewText);
        return true;
      }

      if (isHeaderLine(line, 'footnote')) {
        const footnoteText = stripQuotesFn(
          cleanInlineTextFn(stripQuotesFn(extractAfterColonFn(line)))
        );
        context.current.data.footnote = renderInlineMarkdownFn(footnoteText);
        return true;
      }

      if (line.startsWith('**Warning Box**')) {
        context.warningBlockCapture = { lines: [] };
        return true;
      }

      if (line.startsWith('**WARNING:**')) {
        const warningTitle = stripQuotesFn(cleanInlineTextFn(extractAfterColonFn(line)));
        context.currentSection = null;
        context.warningCapture = {
          title: warningTitle,
          lines: [],
          collecting: true,
        };
        return true;
      }

      if (line.startsWith('**Note:**')) {
        const noteText = stripQuotesFn(cleanInlineTextFn(stripQuotesFn(extractAfterColonFn(line))));
        context.current.data.infoNote = renderInlineMarkdownFn(noteText);
        return true;
      }

      if (line.startsWith('**Expert Detail:**')) {
        const expertText = stripQuotesFn(
          cleanInlineTextFn(stripQuotesFn(extractAfterColonFn(line)))
        );
        context.current.data.expertDetail = renderInlineMarkdownFn(expertText);
        return true;
      }

      if (/^\*\*Breadcrumb/i.test(line)) {
        const breadcrumbText = normalizeTextFn(
          stripMarkdownFn(stripQuotesFn(extractAfterColonFn(line)))
        );
        context.current.data.breadcrumb = breadcrumbText;
        return true;
      }

      return false;
    };

    const handleInlineListHeader = (line: string): boolean => {
      const current = context.current;
      if (!current) {
        return false;
      }
      if (line.startsWith('**Best For:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'bestFor';
        current.data.bestFor = current.data.bestFor.concat(
          parseInlineListFn(extractAfterColonFn(line))
        );
        return true;
      }

      if (line.startsWith('**Key Benefits:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'keyBenefits';
        current.data.keyBenefits = current.data.keyBenefits.concat(
          parseInlineListFn(extractAfterColonFn(line))
        );
        return true;
      }

      if (line.startsWith('**Platform Technologies:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'platformTechnologies';
        current.data.platformTechnologies = current.data.platformTechnologies || [];
        return true;
      }

      if (line.startsWith('**Recommended With:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'recommendedWith';
        current.data.recommendedWith = current.data.recommendedWith || [];
        current.data.recommendedWith = current.data.recommendedWith.concat(
          parseInlineListFn(extractAfterColonFn(line))
        );
        return true;
      }

      if (line.startsWith('**Migration Path:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'migrationPath';
        current.data.migrationPath = current.data.migrationPath || [];
        current.data.migrationPath = current.data.migrationPath.concat(
          parseInlineListFn(extractAfterColonFn(line))
        );
        return true;
      }

      if (line.startsWith('**Considerations:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'considerations';
        current.data.considerations = current.data.considerations.concat(
          parseInlineListFn(extractAfterColonFn(line))
        );
        return true;
      }

      if (isWhenNotToUseHeader(line)) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'whenNotToUse';
        current.data.whenNotToUse = current.data.whenNotToUse.concat(
          parseInlineListFn(extractAfterColonFn(line))
        );
        return true;
      }

      if (line.startsWith('**Tech Tags:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = null;
        const tags = parseInlineListFn(extractAfterColonFn(line));
        applyToGroup((target) => {
          target.techTags = tags;
        });
        return true;
      }

      if (line.startsWith('**Search Tags:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = null;
        const tags = parseInlineListFn(extractAfterColonFn(line));
        applyToGroup((target) => {
          target.searchTags = tags;
        });
        return true;
      }

      if (line.startsWith('**Docs:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'docs';
        const docsInline = extractAfterColonFn(line);
        if (docsInline) {
          applyToGroup((target) => {
            target.docs = target.docs.concat(parseDocsInlineFn(docsInline, target.title));
          });
        }
        return true;
      }

      if (line.startsWith('**Data Service DR Configuration:**')) {
        context.currentSection = 'dataServiceConfig';
        context.activeServiceType = 'data';
        context.activeServiceName = null;
        return true;
      }

      if (line.startsWith('**Compute Platform DR Configuration:**')) {
        context.currentSection = 'computePlatformConfig';
        context.activeServiceType = 'compute';
        context.activeServiceName = null;
        return true;
      }

      if (line.startsWith('**Platform Fit Warnings:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'platformFitWarnings';
        return true;
      }

      if (line.startsWith('**Cost Profile:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'costProfile';
        return true;
      }

      if (line.startsWith('**Tier Comparison:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'tierComparison';
        return true;
      }

      if (line.startsWith('**Networking Essentials')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'networkingEssentials';
        return true;
      }

      if (line.startsWith('**Shared Services Essentials')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'sharedServicesEssentials';
        return true;
      }

      if (line.startsWith('**IaC Requirement:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'iacRequirement';
        return true;
      }

      if (line.startsWith('**DR Testing Cadence:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'drTestingCadence';
        return true;
      }

      if (line.startsWith('**Next Steps:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'nextSteps';
        return true;
      }

      if (isCopyBlockHeader(line)) {
        finalizeCopyBlockCapture();
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'copyBlock';
        context.copyBlockCapture = {
          title: extractCopyBlockTitle(line),
          lines: [],
        };
        return true;
      }

      if (line.startsWith('**Additional Considerations:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'additionalConsiderations';
        const additional = extractAfterColonFn(line);
        const cleanedAdditional = normalizeTextFn(stripMarkdownFn(additional))
          .replace(/\*/g, '')
          .trim();
        if (cleanedAdditional) {
          applyToGroup((target) => {
            target.additionalConsiderations = cleanedAdditional;
          });
        }
        return true;
      }

      if (line.startsWith('**Responsibility Model & Contact:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'responsibility';
        applyToGroup((target) => {
          target.responsibility = [];
          target.responsibilityLinks = [];
        });
        return true;
      }

      if (line.startsWith('**If Services:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'supportSection';
        const inlineText = normalizeTextFn(stripMarkdownFn(extractAfterColonFn(line)))
          .replace(/\*/g, '')
          .trim();
        applyToGroup((target) => {
          target.supportSection = {
            title: 'If Services',
            lines: inlineText ? [inlineText] : [],
            links: [],
          } as SupportSection;
        });
        return true;
      }

      if (line.startsWith('**Support Section')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'supportSection';
        applyToGroup((target) => {
          target.supportSection = {
            title: extractSupportSectionTitle(line),
            lines: [],
            links: [],
          } as SupportSection;
        });
        return true;
      }

      if (line.startsWith('**Contact:**')) {
        context.activeServiceType = null;
        context.activeServiceName = null;
        context.currentSection = 'contact';
        applyToGroup((target) => {
          target.contact = [];
        });
        return true;
      }

      return false;
    };

    const handleSingleLineFields = (line: string): boolean => {
      if (!context.current) {
        return false;
      }
      if (/^\-\s*Best For:/i.test(line)) {
        const value = stripMarkdownFn(stripQuotesFn(extractAfterColonFn(line)));
        if (value) {
          context.current.data.bestFor.push(value);
        }
        return true;
      }

      if (/^\-\s*Pricing:/i.test(line)) {
        const value = stripMarkdownFn(stripQuotesFn(extractAfterColonFn(line)));
        if (value) {
          context.current.data.keyBenefits.push(`Pricing: ${value}`);
        }
        return true;
      }

      if (/^\-\s*Performance:/i.test(line)) {
        const value = stripMarkdownFn(stripQuotesFn(extractAfterColonFn(line)));
        if (value) {
          context.current.data.keyBenefits.push(`Performance: ${value}`);
        }
        return true;
      }

      if (/^\-\s*Note:/i.test(line)) {
        const value = stripMarkdownFn(stripQuotesFn(extractAfterColonFn(line)));
        if (value) {
          context.current.data.considerations.push(value);
        }
        return true;
      }

      return false;
    };

    const handleListItem = (line: string, lineRaw: string): boolean => {
      if (!/^(?:-|\*|▸)\s+/.test(line) && !/^(?:-|\*|▸)\s+/.test(lineRaw.trim())) {
        return false;
      }
      const rawItem = lineRaw
        .trim()
        .replace(/^[-*▸]\s+/, '')
        .trim();
      const listItem = renderInlineMarkdownFn(rawItem);

      if (
        context.current &&
        (context.currentSection === 'dataServiceConfig' ||
          context.currentSection === 'computePlatformConfig')
      ) {
        const activeName = context.activeServiceName;
        if (activeName) {
          const type = context.currentSection === 'dataServiceConfig' ? 'data' : 'compute';
          const entry = ensureServiceConfig(context.current.data, activeName, type);
          entry.items.push(listItem);
          return true;
        }
      }

      const handler = context.currentSection ? sectionHandlers[context.currentSection] : null;
      if (handler) {
        handler(listItem, rawItem);
      }
      return true;
    };

    const handleAdditionalConsiderationsContinuation = (lineRaw: string): boolean => {
      if (context.currentSection !== 'additionalConsiderations') {
        return false;
      }
      const additionalLine = normalizeTextFn(stripMarkdownFn(lineRaw.trim()));
      applyToGroup((target) => {
        target.additionalConsiderations =
          `${target.additionalConsiderations} ${additionalLine}`.trim();
      });
      return true;
    };

    const handleServiceHeaderLine = (lineRaw: string): boolean => {
      if (!context.current) {
        return false;
      }
      if (
        context.currentSection !== 'dataServiceConfig' &&
        context.currentSection !== 'computePlatformConfig'
      ) {
        return false;
      }
      const title = extractServiceBlockTitle(lineRaw.trim());
      if (!title) {
        return false;
      }
      context.activeServiceName = title;
      const type = context.currentSection === 'dataServiceConfig' ? 'data' : 'compute';
      ensureServiceConfig(context.current.data, title, type);
      return true;
    };

    for (let i = startIndex + 1; i < endIndex; i += 1) {
      const lineRaw = lines[i] || '';
      const line = lineRaw.trim();

      if (line.startsWith('### ')) {
        context.defaultBadgeText = line.toLowerCase().includes('storage') ? 'Storage' : '';
      }

      if (isGroupHeader(line)) {
        startGroup(line);
        continue;
      }

      if (isBoldResultHeader(line)) {
        startBoldResult(line);
        continue;
      }

      if (isResultHeader(line)) {
        startResult(line);
        continue;
      }

      if (!context.current) {
        continue;
      }

      if (context.copyBlockCapture) {
        if (line.startsWith('---')) {
          finalizeCopyBlockCapture();
          context.currentSection = null;
          continue;
        }
        if (line.startsWith('**')) {
          finalizeCopyBlockCapture();
        } else {
          context.copyBlockCapture.lines.push(lineRaw);
          continue;
        }
      }

      if (!line) {
        if (context.warningCapture && context.warningCapture.collecting) {
          context.warningCapture.lines.push('');
        }
        continue;
      }

      if (line.startsWith('---')) {
        context.currentSection = null;
        if (context.warningCapture && context.warningCapture.collecting) {
          context.warningCapture.collecting = false;
        }
        continue;
      }

      if (context.warningBlockCapture && line === '```') {
        finalizeWarningBlockCapture();
        continue;
      }

      if (context.warningBlockCapture) {
        context.warningBlockCapture.lines.push(lineRaw);
        continue;
      }

      if (context.warningCapture && context.warningCapture.collecting) {
        if (isSectionHeader(line)) {
          context.warningCapture.collecting = false;
        } else {
          context.warningCapture.lines.push(lineRaw);
          continue;
        }
      }

      if (handleMetadataLine(line)) {
        continue;
      }

      if (context.current.data.badge.text === '' && context.defaultBadgeText) {
        context.current.data.badge.text = context.defaultBadgeText;
      }

      if (handleHeaderLine(line)) {
        continue;
      }

      if (handleSingleLineFields(line)) {
        continue;
      }

      if (handleInlineListHeader(line)) {
        continue;
      }

      if (handleServiceHeaderLine(lineRaw)) {
        continue;
      }

      finalizeInlineWarning();

      if (handleListItem(line, lineRaw)) {
        continue;
      }

      handleAdditionalConsiderationsContinuation(lineRaw);
    }

    finalizeInlineWarning(true);
    commitCurrent();
    return results;
  };

  return parseResults;
}

const parseResults = createResultParser();

export { createResultParser, parseResults };
