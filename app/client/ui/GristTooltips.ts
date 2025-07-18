import * as commands from 'app/client/components/commands';
import {makeT} from 'app/client/lib/localization';
import {cssMarkdownSpan} from 'app/client/lib/markdown';
import {buildHighlightedCode} from 'app/client/ui/CodeHighlight';
import {ShortcutKey, ShortcutKeyContent} from 'app/client/ui/ShortcutKey';
import {basicButtonLink} from 'app/client/ui2018/buttons';
import {icon} from 'app/client/ui2018/icons';
import {cssLink} from 'app/client/ui2018/links';
import {commonUrls, GristDeploymentType} from 'app/common/gristUrls';
import {BehavioralPrompt} from 'app/common/Prefs';
import {getGristConfig} from 'app/common/urlUtils';
import {dom, DomContents, DomElementArg, styled} from 'grainjs';

const t = makeT('GristTooltips');

const cssTooltipContent = styled('div', `
  display: flex;
  flex-direction: column;
  row-gap: 8px;
`);

const cssBoldText = styled('span', `
  font-weight: 600;
`);

const cssItalicizedText = styled('span', `
  font-style: italic;
`);

const cssIcon = styled(icon, `
  height: 18px;
  width: 18px;
`);

const cssNewsPopupLink = styled(basicButtonLink, `
  color: white;
  border: 1px solid white;
  padding: 3px;

  &:hover, &:focus, &:visited {
    color: white;
    border-color: white;
  }
`);

const cssNewAssistantTitle = styled('div', `
  display: flex;
  align-items: center;
  column-gap: 8px;
`);

export type Tooltip =
  | 'dataSize'
  | 'setTriggerFormula'
  | 'selectBy'
  | 'workOnACopy'
  | 'openAccessRules'
  | 'addRowConditionalStyle'
  | 'addColumnConditionalStyle'
  | 'uuid'
  | 'lookups'
  | 'formulaColumn'
  | 'accessRulesTableWide'
  | 'setChoiceDropdownCondition'
  | 'setRefDropdownCondition'
  | 'communityWidgets'
  | 'twoWayReferences'
  | 'twoWayReferencesDisabled'
  | 'viewAsBanner'
  | 'reassignTwoWayReference'
  | 'attachmentStorage'
  | 'uploadAttachments'
  | 'adminControls'
  | 'formFraming'
  ;

export type TooltipContentFunc = (...domArgs: DomElementArg[]) => DomContents;

export const GristTooltips: Record<Tooltip, TooltipContentFunc> = {
  dataSize: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div', t('The total size of all data in this document, excluding attachments.')),
    dom('div', t('Updates every 5 minutes.')),
    ...args,
  ),
  setTriggerFormula: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div',
      t('Formulas that trigger in certain cases, and store the calculated value as data.')
    ),
    dom('div',
      t('Useful for storing the timestamp or author of a new record, data cleaning, and more.')
    ),
    dom('div',
      cssLink({href: commonUrls.helpTriggerFormulas, target: '_blank'}, t('Learn more.')),
    ),
    ...args,
  ),
  selectBy: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div', t('Link your new widget to an existing widget on this page.')),
    dom('div',
      cssLink({href: commonUrls.helpLinkingWidgets, target: '_blank'}, t('Learn more.')),
    ),
    ...args,
  ),
  workOnACopy: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div',
      t('Try out changes in a copy, then decide whether to replace the original with your edits.')
    ),
    dom('div',
      cssLink({href: commonUrls.helpTryingOutChanges, target: '_blank'}, t('Learn more.')),
    ),
    ...args,
  ),
  openAccessRules: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div',
      t('Access rules give you the power to create nuanced rules to determine who can \
see or edit which parts of your document.')
    ),
    dom('div',
      cssLink({href: commonUrls.helpAccessRules, target: '_blank'}, t('Learn more.')),
    ),
    ...args,
  ),
  addRowConditionalStyle: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div', t('Apply conditional formatting to rows based on formulas.')),
    dom('div',
      cssLink({href: commonUrls.helpConditionalFormatting, target: '_blank'}, t('Learn more.')),
    ),
    ...args,
  ),
  addColumnConditionalStyle: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div', t('Apply conditional formatting to cells in this column when formula conditions are met.')),
    dom('div', t('Click on “Open row styles” to apply conditional formatting to rows.')),
    dom('div',
      cssLink({href: commonUrls.helpConditionalFormatting, target: '_blank'}, t('Learn more.')),
    ),
    ...args,
  ),
  uuid: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div', t('A UUID is a randomly-generated string that is useful for unique identifiers and link keys.')),
    dom('div',
      cssLink({href: commonUrls.helpLinkKeys, target: '_blank'}, t('Learn more.')),
    ),
    ...args,
  ),
  lookups: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div', t('Lookups return data from related tables.')),
    dom('div', t('Use reference columns to relate data in different tables.')),
    dom('div',
      cssLink({href: commonUrls.helpColRefs, target: '_blank'}, t('Learn more.')),
    ),
    ...args,
  ),
  formulaColumn: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div', t('Formulas support many Excel functions and full Python syntax.')),
    dom('div',
      cssLink({href: commonUrls.formulas, target: '_blank'}, t('Learn more.')),
    ),
    ...args,
  ),
  accessRulesTableWide: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div', t('These rules are applied after all column rules have been processed, if applicable.')),
    ...args,
  ),
  setChoiceDropdownCondition: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div',
      t('Filter displayed dropdown values with a condition.')
    ),
    dom('div', {style: 'margin-top: 8px;'}, t('Example: {{example}}', {
      example: dom.create(buildHighlightedCode, 'choice not in $Categories', {}, {style: 'margin-top: 8px;'}),
    })),
    ...args,
  ),
  setRefDropdownCondition: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div',
      t('Filter displayed dropdown values with a condition.')
    ),
    dom('div', {style: 'margin-top: 8px;'}, t('Example: {{example}}', {
      example: dom.create(buildHighlightedCode, 'choice.Role == "Manager"', {}, {style: 'margin-top: 8px;'}),
    })),
    dom('div',
      cssLink({href: commonUrls.helpFilteringReferenceChoices, target: '_blank'}, t('Learn more.')),
    ),
    ...args,
  ),
  communityWidgets: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div',
      t('Community widgets are created and maintained by Grist community members.')
    ),
    dom('div',
      cssLink({href: commonUrls.helpCustomWidgets, target: '_blank'}, t('Learn more.')),
    ),
    ...args,
  ),
  twoWayReferences: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div',
      t('Creates a new Reference List column in the target table, with both this \
and the target columns editable and synchronized.')
    ),
    ...args,
  ),
  twoWayReferencesDisabled: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div',
      t('Two-way references are not currently supported for Formula or Trigger Formula columns')
    ),
    ...args,
  ),
  reassignTwoWayReference: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div',
      t('This limitation occurs when one column in a two-way reference has the Reference type.')
    ),
    dom('div',
      t(`To allow multiple assignments, change the referenced column's type to Reference List.`)
    ),
    ...args,
  ),
  viewAsBanner: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div', t('The preview below this header shows how the selected user will see this document')),
    ...args,
  ),
  attachmentStorage: (...args: DomElementArg[]) => cssTooltipContent(
    cssMarkdownSpan(
      t(
        "Internal storage means all attachments are stored in the document SQLite file, \
while external storage indicates all attachments are stored in the same \
external storage."
      ) +
      "\n\n" +
      t(
      "[Learn more.]({{link}})", {
        link: commonUrls.attachmentStorage
      }
    )),
    ...args,
  ),
  adminControls: (...args: DomElementArg[]) => cssTooltipContent(
    dom('div', t('Manage users and resources in a Grist installation.')),
    dom('div', cssLink({href: commonUrls.helpAdminControls, target: "_blank"}, t('Learn more.'))),
    ...args,
  ),
  uploadAttachments: (...args: DomElementArg[]) => cssTooltipContent(
    cssMarkdownSpan(
      t(
        "This allows you to add attachments that are missing from external storage, e.g. in an imported document. \
Only .tar attachment archives downloaded from Grist can be uploaded here."
      ),
    ),
    ...args,
  ),
  formFraming: (...args: DomElementArg[]) => cssTooltipContent(
    cssMarkdownSpan(
      t(
"This form is created by a Grist user, and is not endorsed by Grist Labs. \
Do not submit passwords through this form, and be careful with links in \
it. Report malicious forms to [{{mail}}](mailto:{{mail}}).", {
        mail: getGristConfig().supportEmail
      }
    )),
    ...args,
  ),
};

type ErrorTooltip = 'summaryFormulas';

export const ErrorTooltips: Record<ErrorTooltip, TooltipContentFunc> = {
  summaryFormulas: () =>
    cssTooltipContent(
      dom("div", t("Summary tables can only contain formula columns.")),
      dom(
        "div",
        cssLink(
          {href: commonUrls.helpSummaryFormulas, target: "_blank"},
          t("Learn more.")
        )
      ),
    ),
};

export interface BehavioralPromptContent {
  popupType: 'tip' | 'news';
  title: () => DomContents;
  content: (...domArgs: DomElementArg[]) => DomContents;
  deploymentTypes: GristDeploymentType[] | 'all';
  /** Defaults to `everyone`. */
  audience?: 'signed-in-users' | 'anonymous-users' | 'everyone';
  /** Defaults to `desktop`. */
  deviceType?: 'mobile' | 'desktop' | 'all';
  /** Defaults to `false`. */
  hideDontShowTips?: boolean;
  /** Defaults to `false`. */
  forceShow?: boolean;
  /** Defaults to `true`. */
  markAsSeen?: boolean;
}

export const GristBehavioralPrompts: Record<BehavioralPrompt, BehavioralPromptContent> = {
  referenceColumns: {
    popupType: 'tip',
    title: () => t('Reference Columns'),
    content: (...args: DomElementArg[]) => cssTooltipContent(
      dom('div', t('Reference columns are the key to {{relational}} data in Grist.', {
        relational: cssBoldText(t('relational'))
      })),
      dom('div', t('They allow for one record to point (or refer) to another.')),
      dom('div',
        cssLink({href: commonUrls.helpColRefs, target: '_blank'}, t('Learn more.')),
      ),
      ...args,
    ),
    deploymentTypes: ['saas', 'core', 'enterprise', 'electron'],
  },
  referenceColumnsConfig: {
    popupType: 'tip',
    title: () => t('Reference Columns'),
    content: (...args: DomElementArg[]) => cssTooltipContent(
      dom('div', t('Select the table to link to.')),
      dom('div', t('Cells in a reference column always identify an {{entire}} \
record in that table, but you may select which column from that record to show.', {
          entire: cssItalicizedText(t('entire'))
        })),
      dom('div',
        cssLink({href: commonUrls.helpUnderstandingReferenceColumns, target: '_blank'}, t('Learn more.')),
      ),
      ...args,
    ),
    deploymentTypes: ['saas', 'core', 'enterprise', 'electron'],
  },
  rawDataPage: {
    popupType: 'tip',
    title: () => t('Raw Data page'),
    content: (...args: DomElementArg[]) => cssTooltipContent(
      dom('div', t('The Raw Data page lists all data tables in your document, \
including summary tables and tables not included in page layouts.')),
      dom('div', cssLink({href: commonUrls.helpRawData, target: '_blank'}, t('Learn more.'))),
      ...args,
    ),
    deploymentTypes: ['saas', 'core', 'enterprise', 'electron'],
  },
  accessRules: {
    popupType: 'tip',
    title: () => t('Access Rules'),
    content: (...args: DomElementArg[]) => cssTooltipContent(
      dom('div', t('Access rules give you the power to create nuanced rules \
to determine who can see or edit which parts of your document.')),
      dom('div', cssLink({href: commonUrls.helpAccessRules, target: '_blank'}, t('Learn more.'))),
      ...args,
    ),
    deploymentTypes: ['saas', 'core', 'enterprise', 'electron'],
  },
  filterButtons: {
    popupType: 'tip',
    title: () => t('Pinning Filters'),
    content: (...args: DomElementArg[]) => cssTooltipContent(
      dom('div', t('Pinned filters are displayed as buttons above the widget.')),
      dom('div', t('Unpin to hide the the button while keeping the filter.')),
      dom('div', cssLink({href: commonUrls.helpFilterButtons, target: '_blank'}, t('Learn more.'))),
      ...args,
    ),
    deploymentTypes: ['saas', 'core', 'enterprise', 'electron'],
  },
  nestedFiltering: {
    popupType: 'tip',
    title: () => t('Nested Filtering'),
    content: (...args: DomElementArg[]) => cssTooltipContent(
      dom('div', t('You can filter by more than one column.')),
      dom('div', t('Only those rows will appear which match all of the filters.')),
      ...args,
    ),
    deploymentTypes: ['saas', 'core', 'enterprise', 'electron'],
  },
  pageWidgetPicker: {
    popupType: 'tip',
    title: () => t('Selecting Data'),
    content: (...args: DomElementArg[]) => cssTooltipContent(
      dom('div', t('Select the table containing the data to show.')),
      dom('div', t('Use the 𝚺 icon to create summary (or pivot) tables, for totals or subtotals.')),
      ...args,
    ),
    deploymentTypes: ['saas', 'core', 'enterprise', 'electron'],
  },
  pageWidgetPickerSelectBy: {
    popupType: 'tip',
    title: () => t('Linking Widgets'),
    content: (...args: DomElementArg[]) => cssTooltipContent(
      dom('div', t('Link your new widget to an existing widget on this page.')),
      dom('div', t('This is the secret to Grist\'s dynamic and productive layouts.')),
      dom('div', cssLink({href: commonUrls.helpLinkingWidgets, target: '_blank'}, t('Learn more.'))),
      ...args,
    ),
    deploymentTypes: ['saas', 'core', 'enterprise', 'electron'],
  },
  editCardLayout: {
    popupType: 'tip',
    title: () => t('Editing Card Layout'),
    content: (...args: DomElementArg[]) => cssTooltipContent(
      dom('div', t('Rearrange the fields in your card by dragging and resizing cells.')),
      dom('div', t('Clicking {{EyeHideIcon}} in each cell hides the field from this view without deleting it.', {
        EyeHideIcon: cssIcon('EyeHide')
      })),
      ...args,
    ),
    deploymentTypes: ['saas', 'core', 'enterprise', 'electron'],
  },
  addNew: {
    popupType: 'tip',
    title: () => t('Add New'),
    content: (...args: DomElementArg[]) => cssTooltipContent(
      dom('div', t('Click the Add New button to create new documents or workspaces, or import data.')),
      ...args,
    ),
    deploymentTypes: ['saas', 'core', 'enterprise', 'electron'],
  },
  rickRow: {
    popupType: 'tip',
    title: () => t('Anchor Links'),
    content: (...args: DomElementArg[]) => cssTooltipContent(
      dom('div',
        t('To make an anchor link that takes the user to a specific cell, click on a row and press {{shortcut}}.',
          {
            shortcut: ShortcutKey(ShortcutKeyContent(commands.allCommands.copyLink.humanKeys[0])),
          }
        ),
      ),
      ...args,
    ),
    deploymentTypes: 'all',
    deviceType: 'all',
    hideDontShowTips: true,
    forceShow: true,
    markAsSeen: false,
  },
  calendarConfig: {
    popupType: 'tip',
    title: () => t('Calendar'),
    content: (...args: DomElementArg[]) => cssTooltipContent(
      dom('div', t("To configure your calendar, select columns for start/end dates and event titles. \
Note each column's type.")),
      dom('div', t("Can't find the right columns? Click 'Change Widget' to select the table with events \
data.")),
      dom('div', cssLink({href: commonUrls.helpCalendarWidget, target: '_blank'}, t('Learn more.'))),
      ...args,
    ),
    deploymentTypes: ['saas', 'core', 'enterprise', 'electron'],
  },
  newAssistant: {
    popupType: 'news',
    audience: 'signed-in-users',
    title: () => cssNewAssistantTitle(
      icon('Robot'),
      t('The new Grist Assistant is here!'),
    ),
    content: (...args: DomElementArg[]) => cssTooltipContent(
      dom('div',
        t(
          "Understand, modify and work with your data and formulas \
with the help of Grist's new AI Assistant!",
        )
      ),
      dom('div',
        cssNewsPopupLink(t('Learn more'), {
          href: commonUrls.helpAssistant,
          target: '_blank',
        }),
      ),
      ...args
    ),
    deploymentTypes: ['saas', 'enterprise'],
  },
};
