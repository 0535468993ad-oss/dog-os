import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { signOut } from '@/features/auth/api';
import { exportJsonFile } from '@/features/report/exportFiles';
import { todayIso } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';

import { deleteMyAccount, fetchMyData } from '../api/accountData';
import type { AccountMessage } from '../types';
import { buildExportPayload, exportFileName } from '../utils/exportPayload';

/** Data export, account deletion and sign-out for the profile screen, with one shared status message. */
export function useAccountActions(email: string | undefined) {
  const [message, setMessage] = useState<AccountMessage | null>(null);

  const exporter = useMutation({
    mutationFn: async () => {
      const payload = buildExportPayload(await fetchMyData(), email, new Date());
      await exportJsonFile(JSON.stringify(payload, null, 2), exportFileName(todayIso()));
    },
    onMutate: () => setMessage(null),
    onSuccess: () => setMessage({ kind: 'info', text: 'קובץ המידע הופק.' }),
    onError: (error) => setMessage({ kind: 'error', text: toUserMessage(error, 'הייצוא נכשל. נסו שוב.') }),
  });

  const deleter = useMutation({
    mutationFn: deleteMyAccount,
    onMutate: () => setMessage(null),
    onError: (error) => setMessage({ kind: 'error', text: toUserMessage(error, 'מחיקת החשבון נכשלה. נסו שוב או פנו אלינו.') }),
  });

  return {
    message,
    exporting: exporter.isPending,
    exportData: () => exporter.mutate(),
    // Stays busy after success: the auth listener moves to the sign-in screen.
    deleting: deleter.isPending || deleter.isSuccess,
    deleteAccount: () => deleter.mutate(),
    signOut: () => void signOut(),
  };
}
