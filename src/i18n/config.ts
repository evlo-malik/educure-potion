import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all locale files
import en from './locales/en.json';
import lt from './locales/lt.json';
import ms from './locales/ms.json';
import id from './locales/id.json';
import ur from './locales/ur.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';
import pl from './locales/pl.json';
import hi from './locales/hi.json';
import fil from './locales/fil.json';
import nl from './locales/nl.json';
import tr from './locales/tr.json';
import uk from './locales/uk.json';
import sv from './locales/sv.json';
import da from './locales/da.json';
import ro from './locales/ro.json';
import el from './locales/el.json';
import bg from './locales/bg.json';
import vi from './locales/vi.json';
import lv from './locales/lv.json';
import no from './locales/no.json';

const resources = {
  en: { translation: en },
  lt: { translation: lt },
  ms: { translation: ms },
  id: { translation: id },
  ur: { translation: ur },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  pt: { translation: pt },
  ru: { translation: ru },
  zh: { translation: zh },
  ar: { translation: ar },
  pl: { translation: pl },
  hi: { translation: hi },
  fil: { translation: fil },
  nl: { translation: nl },
  tr: { translation: tr },
  uk: { translation: uk },
  sv: { translation: sv },
  da: { translation: da },
  ro: { translation: ro },
  el: { translation: el },
  bg: { translation: bg },
  vi: { translation: vi },
  lv: { translation: lv },
  no: { translation: no }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'userLanguage',
      caches: ['localStorage']
    },
    react: {
      useSuspense: false
    }
  });

// Force reload of language from localStorage if it exists
const storedLanguage = localStorage.getItem('userLanguage');
if (storedLanguage) {
  i18n.changeLanguage(storedLanguage);
}

export default i18n; 