/** Status line under the privacy settings (export result or deletion failure). */
export interface AccountMessage {
  kind: 'info' | 'error';
  text: string;
}

/** Every row the user owns, keyed by table name. */
export type UserDataByTable = Record<string, unknown[]>;

/** The data-portability file (GDPR art. 20). */
export interface UserDataExport {
  exported_at: string;
  account: { email: string | undefined };
  note: string;
  data: UserDataByTable;
}
