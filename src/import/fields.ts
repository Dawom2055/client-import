export const MAX_EMAIL = 254;

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

export const EMAIL_RULE =
  "Email Address must contain an '@' symbol, and any '.' must be followed by additional characters.";

const validEmail = (v: string) => v.length <= MAX_EMAIL && EMAIL_PATTERN.test(v);

export interface Field {
  key: string;
  /** The column name in the Import Template, without the required marker. */
  header: string;
  required: boolean;
  /** The Format check rule for a filled-in cell; blank cells are never checked here. */
  isValid: (value: string) => boolean;
  message: string;
}

const anything = () => true;

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
    isValid: (v: string) => v.length <= max && NAME_CHARACTERS.test(v),
    message: `${label} must be ${max} characters or fewer and can only contain letters, spaces, and - ' . , characters.`,
  }) as const;

/** A pick-list field that is never required. */
const pickList = <K extends string>(key: K, header: string, options: string[], message: string) =>
  ({ key, header, required: false, isValid: oneOf(...options), message }) as const;

const TITLES = oneOf('Mr', 'Mrs', 'Ms', 'Dr', 'Mstr', 'Miss');

export const RELATIONSHIPS = ['Spouse', 'Partner', 'Child', 'Parent', 'Sibling', 'Friend', 'Other'];

/** A column with no Format check rule yet. */
const free = <K extends string>(key: K, header: string) =>
  ({ key, header, required: false, isValid: anything, message: '' }) as const;

/** Every column of the Import Template, in order. The template, the File check and the Format check all read from this. */
export const FIELDS = [
  { key: 'group', header: 'Group #', required: true, isValid: anything, message: '' },
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
    isValid: oneOf('L', 'C'),
    message: "Profile Type must be either 'L' (Leisure) or 'C' (Corporate).",
  },
  {
    key: 'title',
    header: 'Title',
    required: false,
    // The period after a title is optional: "Mr" and "Mr." both match.
    isValid: (v: string) => TITLES(v.replace(/\.$/, '')),
    message: 'Title must be one of: Mr., Mrs., Ms., Dr., Mstr, or Miss',
  },
  nameField('corporateName', 'Corporate Name', false, 20, 'Corporate name'),
  nameField('firstName', 'First Name', true, 20),
  nameField('middleName', 'Middle Name', false, 30),
  nameField('lastName', 'Last Name', true, 29),
  pickList('gender', 'Gender', ['M', 'F'], "Gender must be either 'M' (Male) or 'F' (Female)."),
  free('dateOfBirth', 'Date of Birth'),
  free('nationality', 'Nationality'),
  pickList(
    'emailDescription',
    'Email Description',
    ['Personal', 'Work'],
    "Email Description must be either 'Personal' or 'Work'.",
  ),
  { key: 'email', header: 'Email Address', required: true, isValid: validEmail, message: EMAIL_RULE },
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
    isValid: (v: string) => /^[0-9]{10,15}$/.test(v),
    message: 'Phone Number must contain 10 to 15 digits, numbers only.',
  },
  free('address1', 'Address Line 1'),
  free('address2', 'Address Line 2'),
  free('city', 'City'),
  free('state', 'State/Province'),
  free('zip', 'Zip/Postal Code'),
  free('country', 'Country'),
  free('passportNumber', 'Passport Number'),
  free('passportCountry', 'Passport Issuing Country'),
  free('passportExpiry', 'Passport Expiry Date'),
] as const satisfies readonly Field[];

export type FieldKey = (typeof FIELDS)[number]['key'];
