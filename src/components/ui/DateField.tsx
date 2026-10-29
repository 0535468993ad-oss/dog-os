import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, MIN_TOUCH_AREA, radius, spacing } from '@/constants/theme';
import { formatDate, parseIsoDate, toIsoDate } from '@/utils/date';

import { AppText } from './AppText';
import { Button } from './Button';

export interface DateFieldProps {
  label: string;
  value: string | null; // YYYY-MM-DD
  onChange: (value: string) => void;
  minimumDate?: string;
  maximumDate?: string;
  error?: string | null;
  optional?: boolean;
  disabled?: boolean;
  /** Optional fields: shows a control that removes the chosen date. */
  onClear?: () => void;
}

// Native date picker (Dark Luxury): Android opens the system dialog, themed dark by the datetimepicker
// config plugin in app.json; iOS shows the dark inline calendar in a sheet. Web: DateField.web.tsx.
export function DateField({ label, value, onChange, minimumDate, maximumDate, error, optional, disabled, onClear }: DateFieldProps) {
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ? parseIsoDate(value) : new Date());

  const min = minimumDate ? parseIsoDate(minimumDate) : undefined;
  const max = maximumDate ? parseIsoDate(maximumDate) : undefined;

  const open = () => {
    const current = value ? parseIsoDate(value) : max && max < new Date() ? max : new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate: min,
        maximumDate: max,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) onChange(toIsoDate(date));
        },
      });
    } else {
      setDraft(current);
      setIosOpen(true);
    }
  };

  return (
    <View style={styles.field}>
      <AppText variant="label" color="textSecondary">
        {label}
        {optional ? ' (רשות)' : ''}
      </AppText>
      <Pressable
        onPress={open}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDate(value) : 'לא נבחר'}`}
        accessibilityHint="פותח בחירת תאריך"
        style={({ pressed }) => [styles.trigger, error ? styles.triggerError : null, pressed && styles.pressed]}
      >
        {/* No line cap: a long Hebrew date ("29 באוקטובר 2026") wraps at large text sizes instead of truncating. */}
        <AppText color={value ? 'textPrimary' : 'textSecondary'} style={styles.text}>
          {value ? formatDate(value) : 'בחרו תאריך'}
        </AppText>
        <Ionicons name="calendar-outline" size={20} color={colors.primaryBright} accessible={false} />
      </Pressable>
      {error ? (
        <AppText variant="caption" color="dangerText" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
      {optional && value && onClear && !disabled ? (
        <Button title="ניקוי התאריך" variant="ghost" compact onPress={onClear} accessibilityLabel={`ניקוי ${label}`} />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <View style={styles.backdrop}>
            <SafeAreaView edges={['bottom']} style={styles.sheet} accessibilityViewIsModal>
              <AppText variant="heading" accessibilityRole="header">
                {label}
              </AppText>
              <DateTimePicker
                value={draft}
                mode="date"
                display="inline"
                locale="he-IL"
                minimumDate={min}
                maximumDate={max}
                onChange={(_event, date) => date && setDraft(date)}
                themeVariant="dark"
                accentColor={colors.primary}
              />
              <View style={styles.actions}>
                <Button title="ביטול" variant="secondary" onPress={() => setIosOpen(false)} />
                <Button
                  title="אישור"
                  onPress={() => {
                    onChange(toIsoDate(draft));
                    setIosOpen(false);
                  }}
                />
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  trigger: {
    minHeight: MIN_TOUCH_AREA + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  triggerError: {
    borderColor: colors.danger,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
