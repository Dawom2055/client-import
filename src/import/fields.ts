export const MAX_NAME = 50;
export const MAX_EMAIL = 254;

const NAME_PATTERN = /^[\p{L} \-'.,]+$/u;
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

export const nameRule = (field: string) =>
  `${field} must be ${MAX_NAME} characters or fewer and can only contain letters, spaces, and - ' . , characters.`;
export const EMAIL_RULE = `Email Address must be a valid email address of ${MAX_EMAIL} characters or fewer.`;

const validName = (v: string) => v.length <= MAX_NAME && NAME_PATTERN.test(v);
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

/** A column with no Format check rule yet. */
const free = <K extends string>(key: K, header: string) =>
  ({ key, header, required: false, isValid: anything, message: '' }) as const;

/** Every column of the Import Template, in order. The template, the File check and the Format check all read from this. */
export const FIELDS = [
  { key: 'group', header: 'Group #', required: true, isValid: anything, message: '' },
  free('relationship', 'Relationship to Client'),
  { key: 'profileType', header: 'Profile Type', required: true, isValid: anything, message: '' },
  free('title', 'Title'),
  free('corporateName', 'Corporate Name'),
  { key: 'firstName', header: 'First Name', required: true, isValid: validName, message: nameRule('First Name') },
  free('middleName', 'Middle Name'),
  { key: 'lastName', header: 'Last Name', required: true, isValid: validName, message: nameRule('Last Name') },
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
