import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
  }
}

// Complete 130+ World Languages List for Google Translate
const ALL_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇦🇪' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', native: '中文(简体)', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', native: '中文(繁體)', flag: '🇹🇼' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', flag: '🇳🇱' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'pl', name: 'Polish', native: 'Polski', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', native: 'Svenska', flag: '🇸🇪' },
  { code: 'th', name: 'Thai', native: 'ไทย', flag: '🇹🇭' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'af', name: 'Afrikaans', native: 'Afrikaans', flag: '🇿🇦' },
  { code: 'sq', name: 'Albanian', native: 'Shqip', flag: '🇦🇱' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ', flag: '🇪🇹' },
  { code: 'hy', name: 'Armenian', native: 'Հայերեն', flag: '🇦🇲' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'ay', name: 'Aymara', native: 'Aymar', flag: '🇧🇴' },
  { code: 'az', name: 'Azerbaijani', native: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'bm', name: 'Bambara', native: 'Bamanankan', flag: '🇲🇱' },
  { code: 'eu', name: 'Basque', native: 'Euskara', flag: '🇪🇸' },
  { code: 'be', name: 'Belarusian', native: 'Беларуская', flag: '🇧🇾' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇧🇩' },
  { code: 'bho', name: 'Bhojpuri', native: 'भोजपुरी', flag: '🇮🇳' },
  { code: 'bs', name: 'Bosnian', native: 'Bosanski', flag: '🇧🇦' },
  { code: 'bg', name: 'Bulgarian', native: 'Български', flag: '🇧🇬' },
  { code: 'ca', name: 'Catalan', native: 'Català', flag: '🇪🇸' },
  { code: 'ceb', name: 'Cebuano', native: 'Cebuano', flag: '🇵🇭' },
  { code: 'ny', name: 'Chichewa', native: 'Nyanja', flag: '🇲🇼' },
  { code: 'co', name: 'Corsican', native: 'Corsu', flag: '🇫🇷' },
  { code: 'hr', name: 'Croatian', native: 'Hrvatski', flag: '🇭🇷' },
  { code: 'cs', name: 'Czech', native: 'Čeština', flag: '🇨🇿' },
  { code: 'da', name: 'Danish', native: 'Dansk', flag: '🇩🇰' },
  { code: 'dv', name: 'Dhivehi', native: 'ދިވެހި', flag: '🇲🇻' },
  { code: 'doi', name: 'Dogri', native: 'डोगरी', flag: '🇮🇳' },
  { code: 'eo', name: 'Esperanto', native: 'Esperanto', flag: '🌐' },
  { code: 'et', name: 'Estonian', native: 'Eesti', flag: '🇪🇪' },
  { code: 'ee', name: 'Ewe', native: 'Eʋegbe', flag: '🇬🇭' },
  { code: 'tl', name: 'Filipino', native: 'Tagalog', flag: '🇵🇭' },
  { code: 'fi', name: 'Finnish', native: 'Suomi', flag: '🇫🇮' },
  { code: 'fy', name: 'Frisian', native: 'Frysk', flag: '🇳🇱' },
  { code: 'gl', name: 'Galician', native: 'Galego', flag: '🇪🇸' },
  { code: 'ka', name: 'Georgian', native: 'ქართული', flag: '🇬🇪' },
  { code: 'gn', name: 'Guarani', native: 'Avañe\'ẽ', flag: '🇵🇾' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ht', name: 'Haitian Creole', native: 'Kreyòl Ayisyen', flag: '🇭🇹' },
  { code: 'ha', name: 'Hausa', native: 'Hausa', flag: '🇳🇬' },
  { code: 'haw', name: 'Hawaiian', native: 'ʻŌlelo Hawaiʻi', flag: '🇺🇸' },
  { code: 'he', name: 'Hebrew', native: 'עברית', flag: '🇮🇱' },
  { code: 'hmn', name: 'Hmong', native: 'Hmoob', flag: '🇱🇦' },
  { code: 'hu', name: 'Hungarian', native: 'Magyar', flag: '🇭🇺' },
  { code: 'is', name: 'Icelandic', native: 'Íslenska', flag: '🇮🇸' },
  { code: 'ig', name: 'Igbo', native: 'Asụsụ Igbo', flag: '🇳🇬' },
  { code: 'ilo', name: 'Ilocano', native: 'Ilokano', flag: '🇵🇭' },
  { code: 'ga', name: 'Irish', native: 'Gaeilge', flag: '🇮🇪' },
  { code: 'jw', name: 'Javanese', native: 'Basa Jawa', flag: '🇮🇩' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'kk', name: 'Kazakh', native: 'Қазақ тілі', flag: '🇰🇿' },
  { code: 'km', name: 'Khmer', native: 'ភាសាខ្មែរ', flag: '🇰🇭' },
  { code: 'rw', name: 'Kinyarwanda', native: 'Ikinyarwanda', flag: '🇷🇼' },
  { code: 'gom', name: 'Konkani', native: 'कोंकणी', flag: '🇮🇳' },
  { code: 'kri', name: 'Krio', native: 'Krio', flag: '🇸🇱' },
  { code: 'ku', name: 'Kurdish (Kurmanji)', native: 'Kurdî', flag: '🇮🇶' },
  { code: 'ckb', name: 'Kurdish (Sorani)', native: 'کوردی', flag: '🇮🇶' },
  { code: 'ky', name: 'Kyrgyz', native: 'Кыргызча', flag: '🇰🇬' },
  { code: 'lo', name: 'Lao', native: 'ພາສາລາວ', flag: '🇱🇦' },
  { code: 'la', name: 'Latin', native: 'Latina', flag: '🏛️' },
  { code: 'lv', name: 'Latvian', native: 'Latviešu', flag: '🇱🇻' },
  { code: 'ln', name: 'Lingala', native: 'Lingála', flag: '🇨🇩' },
  { code: 'lt', name: 'Lithuanian', native: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lg', name: 'Luganda', native: 'Luganda', flag: '🇺🇬' },
  { code: 'lb', name: 'Luxembourgish', native: 'Lëtzebuergesch', flag: '🇱🇺' },
  { code: 'mk', name: 'Macedonian', native: 'Македонски', flag: '🇲🇰' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली', flag: '🇮🇳' },
  { code: 'mg', name: 'Malagasy', native: 'Malagasy', flag: '🇲🇬' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mt', name: 'Maltese', native: 'Malti', flag: '🇲🇹' },
  { code: 'mi', name: 'Maori', native: 'Te Reo Māori', flag: '🇳🇿' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'mni-Mtei', name: 'Meiteilon (Manipuri)', native: 'ꯃꯤꯇꯩꯂꯣꯟ', flag: '🇮🇳' },
  { code: 'lus', name: 'Mizo', native: 'Mizo ṭawng', flag: '🇮🇳' },
  { code: 'mn', name: 'Mongolian', native: 'Монгол', flag: '🇲🇳' },
  { code: 'my', name: 'Myanmar (Burmese)', native: 'မြန်မာ', flag: '🇲🇲' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली', flag: '🇳🇵' },
  { code: 'no', name: 'Norwegian', native: 'Norsk', flag: '🇳🇴' },
  { code: 'or', name: 'Odia (Oriya)', native: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'om', name: 'Oromo', native: 'Afaan Oromoo', flag: '🇪🇹' },
  { code: 'ps', name: 'Pashto', native: 'پښتو', flag: '🇦🇫' },
  { code: 'fa', name: 'Persian', native: 'فارسی', flag: '🇮🇷' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'qu', name: 'Quechua', native: 'Runa Simi', flag: '🇵🇪' },
  { code: 'ro', name: 'Romanian', native: 'Română', flag: '🇷🇴' },
  { code: 'sm', name: 'Samoan', native: 'Gagana Samoa', flag: '🇼🇸' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्', flag: '🇮🇳' },
  { code: 'gd', name: 'Scots Gaelic', native: 'Gàidhlig', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'nso', name: 'Sepedi', native: 'Sepedi', flag: '🇿🇦' },
  { code: 'sr', name: 'Serbian', native: 'Српски', flag: '🇷🇸' },
  { code: 'st', name: 'Sesotho', native: 'Sesotho', flag: '🇱🇸' },
  { code: 'sn', name: 'Shona', native: 'chiShona', flag: '🇿🇼' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي', flag: '🇵🇰' },
  { code: 'si', name: 'Sinhala', native: 'සිංහල', flag: '🇱🇰' },
  { code: 'sk', name: 'Slovak', native: 'Slovenčina', flag: '🇸🇰' },
  { code: 'sl', name: 'Slovenian', native: 'Slovenščina', flag: '🇸🇮' },
  { code: 'so', name: 'Somali', native: 'Soomaali', flag: '🇸🇴' },
  { code: 'su', name: 'Sundanese', native: 'Basa Sunda', flag: '🇮🇩' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili', flag: '🇰🇪' },
  { code: 'tg', name: 'Tajik', native: 'Тоҷикӣ', flag: '🇹🇯' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'tt', name: 'Tatar', native: 'Татар', flag: '🇷🇺' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ti', name: 'Tigrinya', native: 'ትግርኛ', flag: '🇪🇷' },
  { code: 'ts', name: 'Tsonga', native: 'Xitsonga', flag: '🇿🇦' },
  { code: 'tk', name: 'Turkmen', native: 'Türkmençe', flag: '🇹🇲' },
  { code: 'tw', name: 'Twi', native: 'Twi', flag: '🇬🇭' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська', flag: '🇺🇦' },
  { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇵🇰' },
  { code: 'ug', name: 'Uyghur', native: 'ئۇيغۇرچە', flag: '🇨🇳' },
  { code: 'uz', name: 'Uzbek', native: 'O‘zbek', flag: '🇺🇿' },
  { code: 'cy', name: 'Welsh', native: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'xh', name: 'Xhosa', native: 'isiXhosa', flag: '🇿🇦' },
  { code: 'yi', name: 'Yiddish', native: 'ייִדיש', flag: '🇮🇱' },
  { code: 'yo', name: 'Yoruba', native: 'Yorùbá', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', native: 'isiZulu', flag: '🇿🇦' },
];

export function GoogleTranslate() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const setLanguageCookie = (langCode: string) => {
    const hostname = window.location.hostname;
    if (langCode === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname}`;
    } else {
      document.cookie = `googtrans=/en/${langCode}; path=/;`;
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${hostname}`;
    }
    window.location.reload();
  };

  useEffect(() => {
    // 1. Check existing cookie
    const getCookieLang = () => {
      const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
      if (match && match[1]) {
        setCurrentLang(match[1]);
        return match[1];
      }
      return null;
    };

    const activeLang = getCookieLang();

    // 2. Auto-detect browser language if no cookie set yet
    if (!activeLang) {
      try {
        const rawLang = navigator.language || (navigator as any).userLanguage || 'en';
        const code = rawLang.split('-')[0].toLowerCase();
        if (code && code !== 'en') {
          setCurrentLang(code);
          setLanguageCookie(code);
        }
      } catch {
        // Translation lookup failed — silent in production
      }
    }

    // 3. Load Google Translate script
    if (!document.getElementById('google-translate-script')) {
      window.googleTranslateElementInit = () => {
        const win = window as any;
        if (win.google?.translate?.TranslateElement) {
          new win.google.translate.TranslateElement(
            { pageLanguage: 'en', autoDisplay: false },
            'google_translate_element_hidden'
          );
        }
      };

      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Close dropdown on outside click (ignoring clicks inside the portal modal)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isClickInButton = dropdownRef.current?.contains(target);
      const isClickInModal = modalRef.current?.contains(target);
      if (!isClickInButton && !isClickInModal) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    setIsOpen(false);
    setCurrentLang(code);
    setLanguageCookie(code);
  };

  const filteredLanguages = ALL_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.native.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeLangObj = ALL_LANGUAGES.find((l) => l.code === currentLang) || ALL_LANGUAGES[0];

  return (
    <div className="relative inline-block text-left notranslate" ref={dropdownRef}>
      {/* Sleek Globe Button — fixed width to prevent CLS */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50/90 hover:bg-blue-50/90 border border-slate-200/90 hover:border-blue-300 transition-all duration-200 cursor-pointer shadow-xs group"
        aria-label="Select Language"
        style={{ minWidth: '72px', height: '34px' }}
      >
        <span className="text-sm leading-none w-4 h-4 flex items-center justify-center">{activeLangObj.flag}</span>
        <svg
          className="w-4 h-4 text-slate-600 group-hover:text-blue-600 transition-colors flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
        <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 uppercase tracking-wider w-5 text-center">
          {activeLangObj.code.split('-')[0]}
        </span>
      </button>

      {/* Hidden container for Google Translate element */}
      <div id="google_translate_element_hidden" className="hidden" />

      {/* Render Language Selector Modal directly to document.body via Portal to prevent mobile drawer clipping */}
      {isOpen &&
        createPortal(
          <div className="notranslate">
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999998] transition-opacity duration-200"
              onClick={() => setIsOpen(false)}
            />

            {/* Centered Responsive Language Modal */}
            <div
              ref={modalRef}
              className="fixed inset-x-4 top-16 sm:top-24 max-w-sm mx-auto rounded-2xl bg-white/98 backdrop-blur-xl border border-slate-200/90 shadow-2xl z-[999999] overflow-hidden p-4 transition-all duration-200 flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between px-1 pb-3 mb-2 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌐</span>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Select Language</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {ALL_LANGUAGES.length}+ Languages
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative mb-3 flex-shrink-0">
                <input
                  type="text"
                  placeholder="Search 130+ languages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 pl-9 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400 font-medium"
                />
                <svg
                  className="w-4 h-4 text-slate-400 absolute left-3 top-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Language List */}
              <div className="overflow-y-auto max-h-[55vh] space-y-1 pr-1 custom-scrollbar flex-1">
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map((lang) => {
                    const isSelected = currentLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelect(lang.code)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200/60'
                            : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 active:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none">{lang.flag}</span>
                          <span className="font-semibold">{lang.name}</span>
                          <span className="text-[11px] text-slate-400 font-normal">({lang.native})</span>
                        </div>
                        {isSelected && (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 font-medium">No language found</div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default GoogleTranslate;
