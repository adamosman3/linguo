import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "pt-BR", name: "Portuguese (Brazil)", nativeName: "Português (Brasil)" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "nb", name: "Norwegian", nativeName: "Norsk" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "he", name: "Hebrew", nativeName: "עברית" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська" },
  { code: "cs", name: "Czech", nativeName: "Čeština" },
  { code: "ro", name: "Romanian", nativeName: "Română" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά" },
];

export function getLanguageName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.name || code;
}

export function getLanguageNativeName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.nativeName || code;
}

export const CONTENT_TYPES = [
  { value: "website", label: "Website Content" },
  { value: "contentful", label: "Contentful" },
  { value: "email_iterable", label: "Iterable Email" },
  { value: "email_marketo", label: "Marketo Email" },
];

export function getContentTypeLabel(value: string): string {
  return CONTENT_TYPES.find((c) => c.value === value)?.label || value;
}

export const TRANSLATION_STATUSES = {
  draft: { label: "Draft", color: "bg-yellow-100 text-yellow-800" },
  in_review: { label: "In Review", color: "bg-blue-100 text-blue-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
};

export const JOB_STATUSES = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-800" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800" },
  failed: { label: "Failed", color: "bg-red-100 text-red-800" },
};
