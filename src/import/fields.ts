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

/** Every column of the Import Template, in order. The template, the File check and the Format check all read from this. */
export const FIELDS = [
  { key: 'firstName', header: 'First Name', required: true, isValid: validName, message: nameRule('First Name') },
  { key: 'lastName', header: 'Last Name', required: true, isValid: validName, message: nameRule('Last Name') },
  { key: 'email', header: 'Email Address', required: true, isValid: validEmail, message: EMAIL_RULE },
] as const satisfies readonly Field[];

export type FieldKey = (typeof FIELDS)[number]['key'];
