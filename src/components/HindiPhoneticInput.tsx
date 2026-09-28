import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import Sanscript from '@indic-transliteration/sanscript';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
};

function convertCompletedWords(text: string): string {
  return text.replace(/[A-Za-z]+(?=\s)/g, (word) =>
    Sanscript.t(word, 'itrans', 'devanagari', { syncope: true })
  );
}

export function HindiPhoneticInput({ value, onChange, onBlur, ...props }: Props) {
  const { i18n } = useTranslation();
  const hindi = i18n.resolvedLanguage === 'hi';

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    onChange(hindi ? convertCompletedWords(text) : text);
  };

  const handleBlur: NonNullable<Props['onBlur']> = (event) => {
    if (hindi) {
      onChange(
        event.target.value.replace(/[A-Za-z]+$/g, (word) =>
          Sanscript.t(word, 'itrans', 'devanagari', { syncope: true })
        )
      );
    }
    onBlur?.(event);
  };

  return (
    <input
      {...props}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      lang={hindi ? 'hi' : 'en'}
    />
  );
}