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

const TITLES = oneOf('Mr', 'Mrs', 'Ms', 'Dr', 'Mstr', 'Miss');

export const RELATIONSHIPS = ['Spouse', 'Partner', 'Child', 'Parent', 'Sibling', 'Friend', 'Other'];

/** A column with no Format check rule yet. */
const free = <K extends string>(key: K, header: string) => ({ key, header, required: false, problem: none }) as const;

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
  free('nationality', 'Nationality'),
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
  free('address1', 'Address Line 1'),
  free('address2', 'Address Line 2'),
  free('city', 'City'),
  free('state', 'State/Province'),
  free('zip', 'Zip/Postal Code'),
  free('country', 'Country'),
  free('passportNumber', 'Passport Number'),
  free('passportCountry', 'Passport Issuing Country'),
  dateField(
    'passportExpiry',
    'Passport Expiry Date',
    (date, now) => date >= now,
    "Passport Expiry Date cannot be before today's date.",
  ),
] as const satisfies readonly Field[];

export type FieldKey = (typeof FIELDS)[number]['key'];
