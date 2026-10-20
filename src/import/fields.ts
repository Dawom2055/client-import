import countries from '../data/countries.json';
import states from '../data/states.json';

export const MAX_EMAIL = 254;

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

export const EMAIL_RULE =
  "Email Address must contain an '@' symbol, and any '.' must be followed by additional characters.";

/** The cells of one row, keyed by field, for rules that depend on another column. */
export type Cells = Readonly<Record<string, string>>;

/** A Format check rule: the message to report for a filled-in cell, or null when it is valid. */
type Problem = (value: string, row: Cells) => string | null;

export interface Field {
  key: string;
  /** The column name in the Import Template, without the required marker. */
  header: string;
  required: boolean;
  /** Blank cells are never checked here; a blank required cell is reported by the File check. */
  problem: Problem;
}

const rule =
  (isValid: (value: string) => boolean, message: string): Problem =>
  (v) =>
    isValid(v) ? null : message;

const none: Problem = () => null;

/** A pick list: the value must be one of `options`, ignoring letter case. */
const oneOf =
  (...options: string[]) =>
  (v: string) =>
    options.some((o) => o.toLowerCase() === v.toLowerCase());

/** Letters A to Z, spaces and - ' . , only, as ADX's own name fields allow. */
const NAME_CHARACTERS = /^[A-Za-z \-'.,]+$/;

/** A name of at most `max` characters, with the error message written for `label`. */
const nameField = <K extends string>(key: K, header: string, required: boolean, max: number, label = header) =>
  ({
    key,
    header,
    required,
    problem: rule(
      (v) => v.length <= max && NAME_CHARACTERS.test(v),
      `${label} must be ${max} characters or fewer and can only contain letters, spaces, and - ' . , characters.`,
    ),
  }) as const;

/** A pick-list field that is never required. */
const pickList = <K extends string>(key: K, header: string, options: string[], message: string) =>
  ({ key, header, required: false, problem: rule(oneOf(...options), message) }) as const;

/** The admin's calendar date today, as a number that orders like the date: YYYYMMDD. */
const today = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

/** A real calendar date written MM/DD/YYYY (a single-digit month or day is fine), as YYYYMMDD; otherwise null. */
function parseDate(v: string): number | null {
  const m = /^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})$/.exec(v);
  if (!m) return null;
  const [month, day, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return year * 10000 + month * 100 + day;
}

/** A date field: a real MM/DD/YYYY date that `inRange` accepts when compared with today. */
const dateField = <K extends string>(
  key: K,
  header: string,
  inRange: (date: number, today: number) => boolean,
  rangeMessage: string,
) =>
  ({
    key,
    header,
    required: false,
    problem: (v: string) => {
      const date = parseDate(v);
      if (date === null) return `${header} must be a real date in MM/DD/YYYY format.`;
      return inRange(date, today()) ? null : rangeMessage;
    },
  }) as const;

/** A free-text field limited only by length: any character is allowed. */
const maxLength = <K extends string>(key: K, header: string, max: number, message: string) =>
  ({ key, header, required: false, problem: rule((v) => v.length <= max, message) }) as const;

/** Compares names ignoring letter case, accents and the style of apostrophe, so "Cote d'Ivoire" matches "Côte d’Ivoire". */
const fold = (v: string) => v.normalize('NFD').replace(/\p{M}/gu, '').replace(/[‘’]/g, "'").toLowerCase();

/** Whether `v` is this entry's code, name, or one of its other accepted names (such as the official ISO name). */
const matches = (v: string, entry: { code: string; name: string; aliases?: string[] }) =>
  [entry.code, entry.name, ...(entry.aliases ?? [])].some((n) => fold(n) === fold(v));

/** The two-letter code of the country written as `v`, by name or code; null when it is not a country. */
const countryCode = (v: string) => countries.find((c) => matches(v, c))?.code ?? null;

/** A country field: an ISO country, by its English name, official ISO name or two-letter code. */
const countryField = <K extends string>(key: K, header: string) =>
  ({
    key,
    header,
    required: false,
    problem: rule((v) => countryCode(v) !== null, `${header} must match one of the valid dropdown options exactly.`),
  }) as const;

const POSTAL_CODES: Record<string, RegExp> = {
  US: /^[0-9]{5}(-[0-9]{4})?$/,
  CA: /^[A-Za-z][0-9][A-Za-z] [0-9][A-Za-z][0-9]$/,
};

const TITLES = oneOf('Mr', 'Mrs', 'Ms', 'Dr', 'Mstr', 'Miss');

export const RELATIONSHIPS = ['Spouse', 'Partner', 'Child', 'Parent', 'Sibling', 'Friend', 'Other'];

/** Every column of the Import Template, in order. The template, the File check and the Format check all read from this. */
export const FIELDS = [
  // Group # is checked by the File check, which needs it to find each Group.
  { key: 'group', header: 'Group #', required: true, problem: none },
  pickList(
    'relationship',
    'Relationship to Client',
    RELATIONSHIPS,
    `Relationship to Client must be one of: ${RELATIONSHIPS.join(', ')}.`,
  ),
  {
    key: 'profileType',
    header: 'Profile Type',
    required: true,
    problem: rule(oneOf('L', 'C'), "Profile Type must be either 'L' (Leisure) or 'C' (Corporate)."),
  },
  {
    key: 'title',
    header: 'Title',
    required: false,
    // The period after a title is optional: "Mr" and "Mr." both match.
    problem: rule((v) => TITLES(v.replace(/\.$/, '')), 'Title must be one of: Mr., Mrs., Ms., Dr., Mstr, or Miss'),
  },
  nameField('corporateName', 'Corporate Name', false, 20, 'Corporate name'),
  nameField('firstName', 'First Name', true, 20),
  nameField('middleName', 'Middle Name', false, 30),
  nameField('lastName', 'Last Name', true, 29),
  pickList('gender', 'Gender', ['M', 'F'], "Gender must be either 'M' (Male) or 'F' (Female)."),
  dateField('dateOfBirth', 'Date of Birth', (date, now) => date <= now, 'Date of Birth cannot be a future date.'),
  countryField('nationality', 'Nationality'),
  pickList(
    'emailDescription',
    'Email Description',
    ['Personal', 'Work'],
    "Email Description must be either 'Personal' or 'Work'.",
  ),
  {
    key: 'email',
    header: 'Email Address',
    required: true,
    problem: rule((v) => v.length <= MAX_EMAIL && EMAIL_PATTERN.test(v), EMAIL_RULE),
  },
  pickList(
    'phoneDescription',
    'Phone Description',
    ['Home', 'Work', 'Cell'],
    "Phone Description must be 'Home', 'Work', or 'Cell'.",
  ),
  {
    key: 'phone',
    header: 'Primary Phone Number',
    required: false,
    problem: rule((v) => /^[0-9]{10,15}$/.test(v), 'Phone Number must contain 10 to 15 digits, numbers only.'),
  },
  maxLength('address1', 'Address Line 1', 80, 'Address 1 cannot exceed 80 characters.'),
  maxLength('address2', 'Address Line 2', 80, 'Address Line 2 cannot exceed 80 characters.'),
  maxLength('city', 'City', 80, 'City cannot exceed 80 characters.'),
  {
    key: 'state',
    header: 'State/Province',
    required: false,
    // Checked only for the US and Canada; elsewhere, or with no Country, any State/Province is accepted.
    problem: (v: string, row: Cells) => {
      const country = countryCode(row.country);
      if (country !== 'US' && country !== 'CA') return null;
      const valid = states.some((s) => s.country === country && matches(v, s));
      return valid ? null : 'State must match one of the valid dropdown options.';
    },
  },
  {
    key: 'zip',
    header: 'Zip/Postal Code',
    required: false,
    // Checked only for the US and Canada; elsewhere, or with no Country, any code is accepted.
    problem: (v: string, row: Cells) => {
      const pattern = POSTAL_CODES[countryCode(row.country) ?? ''];
      if (!pattern || pattern.test(v)) return null;
      return 'Zip Code must match the required format for the selected country (e.g., 12345 or 12345-6789 for US, A1A 1A1 for Canada).';
    },
  },
  countryField('country', 'Country'),
  maxLength('passportNumber', 'Passport Number', 15, 'Passport Number cannot exceed 15 characters.'),
  countryField('passportCountry', 'Passport Issuing Country'),
  dateField(
    'passportExpiry',
    'Passport Expiry Date',
    (date, now) => date >= now,
    "Passport Expiry Date cannot be before today's date.",
  ),
] as const satisfies readonly Field[];

export type FieldKey = (typeof FIELDS)[number]['key'];
