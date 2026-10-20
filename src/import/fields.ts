export const MAX_EMAIL = 254;

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

export const EMAIL_RULE = `Email Address must be a valid email address of ${MAX_EMAIL} characters or fewer.`;

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

export const RELATIONSHIPS = ['Spouse', 'Partner', 'Child', 'Parent', 'Sibling', 'Friend', 'Other'];

/** A column with no Format check rule yet. */
const free = <K extends string>(key: K, header: string) =>
  ({ key, header, required: false, isValid: anything, message: '' }) as const;

/** Every column of the Import Template, in order. The template, the File check and the Format check all read from this. */
export const FIELDS = [
  { key: 'group', header: 'Group #', required: true, isValid: anything, message: '' },
  {
    key: 'relationship',
    header: 'Relationship to Client',
    required: false,
    isValid: oneOf(...RELATIONSHIPS),
    message: `Relationship to Client must be one of: ${RELATIONSHIPS.join(', ')}.`,
  },
  {
    key: 'profileType',
    header: 'Profile Type',
    required: true,
    isValid: oneOf('L', 'C'),
    message: "Profile Type must be either 'L' (Leisure) or 'C' (Corporate).",
  },
  free('title', 'Title'),
  nameField('corporateName', 'Corporate Name', false, 20, 'Corporate name'),
  nameField('firstName', 'First Name', true, 20),
  nameField('middleName', 'Middle Name', false, 30),
  nameField('lastName', 'Last Name', true, 29),
  free('gender', 'Gender'),
  free('dateOfBirth', 'Date of Birth'),
  free('nationality', 'Nationality'),
  free('emailDescription', 'Email Description'),
  { key: 'email', header: 'Email Address', required: true, isValid: validEmail, message: EMAIL_RULE },
  free('phoneDescription', 'Phone Description'),
  free('phone', 'Primary Phone Number'),
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
