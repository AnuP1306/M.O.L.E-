import { useCallback, useContext, useEffect, useMemo, useState, createContext, type ReactNode } from 'react';
import hi from './locales/hi.json';

type Language = 'en' | 'hi';
type Dict = Record<string, string>;

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; toggleLanguage: () => void }>({
  language: 'en', setLanguage: () => {}, toggleLanguage: () => {},
});

const wordMap: Record<string, string> = {
  active:'सक्रिय', status:'स्थिति', current:'वर्तमान', select:'चुनें', selected:'चयनित', mine:'खदान', mines:'खदानें',
  dashboard:'नियंत्रण-पटल', operations:'संचालन', operation:'संचालन', mission:'अभियान', missions:'अभियान', time:'समय', overview:'अवलोकन',
  camera:'कैमरा', mapping:'मानचित्रण', map:'मानचित्र', environment:'पर्यावरण', hazards:'जोखिम', hazard:'जोखिम', rescue:'बचाव',
  target:'लक्ष्य', targets:'लक्ष्य', remote:'दूरस्थ', log:'अभिलेख', details:'विवरण', official:'आधिकारिक', access:'प्रवेश', request:'अनुरोध',
  login:'प्रवेश', password:'कूटशब्द', logout:'बाहर निकलें', home:'मुखपृष्ठ', name:'नाम', role:'भूमिका', organization:'संगठन', district:'जिला', state:'राज्य',
  date:'तारीख', shift:'पाली', workers:'कर्मचारी', worker:'कर्मचारी', total:'कुल', number:'संख्या', required:'आवश्यक', battery:'बैटरी', speed:'गति', distance:'दूरी',
  heading:'दिशा', signal:'संकेत', link:'संपर्क', quality:'गुणवत्ता', environmental:'पर्यावरणीय', sensors:'सेंसर', temperature:'तापमान', humidity:'आर्द्रता',
  atmospheric:'वायुमंडलीय', composition:'संरचना', water:'जल', ingress:'प्रवेश', warning:'चेतावनी', critical:'गंभीर', safe:'सुरक्षित', unknown:'अज्ञात',
  alive:'जीवित', injured:'घायल', detected:'पता चला', stable:'स्थिर', ready:'तैयार', normal:'सामान्य', emergency:'आपातकाल', stop:'रोकें', start:'शुरू',
  end:'समाप्त', resume:'पुनः शुरू', back:'वापस', cancel:'रद्द करें', submit:'जमा करें', upload:'अपलोड करें', existing:'मौजूदा', new:'नया', source:'स्रोत',
  progress:'प्रगति', complete:'पूर्ण', in:'में', not:'नहीं', mapped:'मानचित्रित', previous:'पिछला', last:'अंतिम', update:'अद्यतन', calibration:'अंशांकन',
  command:'आदेश', commands:'आदेश', communication:'संचार', rover:'रोवर', thermal:'तापीय', telemetry:'दूरमापी', verification:'सत्यापन', verify:'सत्यापित करें',
  confirm:'पुष्टि करें', deployment:'तैनाती', deployed:'तैनात', declared:'घोषित', incident:'घटना', area:'क्षेत्र', type:'प्रकार', possible:'संभावित',
  viable:'व्यवहार्य', blocked:'अवरुद्ध', gas:'गैस', leak:'रिसाव', flood:'बाढ़', explosion:'विस्फोट', tunnel:'सुरंग', collapse:'ढहना', team:'दल',
  personnel:'कर्मी', attendance:'उपस्थिति', remarks:'टिप्पणियाँ', system:'प्रणाली', capabilities:'क्षमताएँ', help:'सहायता', protocols:'प्रोटोकॉल', search:'खोजें',
  device:'उपकरण', remember:'याद रखें', forgot:'भूल गए', account:'खाता', created:'बनाया गया', successfully:'सफलतापूर्वक', choose:'चुनें', file:'फाइल',
  optional:'वैकल्पिक', live:'सजीव', now:'अभी', survivors:'जीवित बचे लोग', survivor:'जीवित व्यक्ति', human:'मानव', detection:'पहचान', depth:'गहराई',
  coverage:'आवरण', routes:'मार्ग', recorded:'दर्ज किए गए', fitted:'स्थापित', alternate:'वैकल्पिक', paths:'मार्ग', setup:'स्थापना', edit:'संपादित करें',
  save:'सहेजें', add:'जोड़ें', remove:'हटाएँ', person:'व्यक्ति', panel:'खंड', gallery:'गैलरी', location:'स्थान', manually:'मैन्युअल रूप से',
  automatically:'स्वचालित रूप से', verified:'सत्यापित', operator:'संचालक', awaiting:'प्रतीक्षारत', review:'समीक्षा', all:'सभी', paused:'रुका हुआ',
  data:'आँकड़े', simulated:'अनुकरणित', mode:'प्रणाली', standby:'प्रतीक्षा', underground:'भूमिगत', coal:'कोयला', safety:'सुरक्षा', life:'जीवन',
  saving:'बचाव', explorer:'अन्वेषक', daily:'दैनिक', record:'दर्ज करें', drive:'चलाएँ', surface:'सतह', robotic:'रोबोटिक', arm:'भुजा', controls:'नियंत्रण',
  flag:'चिह्नित करें', vital:'जीवन-चिह्न', cues:'संकेत', coordinate:'समन्वय', report:'प्रतिवेदन', survey:'सर्वेक्षण', summary:'सारांश', archive:'अभिलेखागार',
  starting:'प्रारंभिक', final:'अंतिम', generation:'निर्माण', creating:'बनाया जा रहा', autonomous:'स्वायत्त', cartography:'मानचित्रण', structure:'संरचना',
  inspection:'निरीक्षण', picture:'चित्र', clean:'साफ करें', lens:'लेंस', vision:'दृष्टि', flashlight:'टॉर्च', manual:'मैन्युअल', clear:'स्पष्ट', pick:'चुनें',
  declaration:'घोषणा', affected:'प्रभावित', initial:'प्रारंभिक', information:'जानकारी', trapped:'फँसे हुए', enter:'दर्ज करें', brief:'संक्षेप में',
  describe:'वर्णन करें', situation:'स्थिति', change:'बदलें', auto:'स्वचालित', fill:'भरें', code:'कोड', designation:'पद', email:'ईमेल', mobile:'मोबाइल',
  phone:'फोन', incharge:'प्रभारी', authentication:'प्रमाणीकरण', failed:'विफल', check:'जाँचें', valid:'मान्य', invalid:'अमान्य', temporary:'अस्थायी', credentials:'प्रमाण-पत्र',
  manager:'प्रबंधक', assistant:'सहायक', officer:'अधिकारी', safety:'सुरक्षा', console:'नियंत्रण-पटल', control:'नियंत्रण', controls:'नियंत्रण',
  an:'एक', a:'एक', and:'और', or:'या', for:'के लिए', with:'के साथ', from:'से', to:'को', into:'में', during:'के दौरान',
  each:'प्रत्येक', which:'जिसे', that:'जो', this:'यह', these:'ये', your:'आपका', you:'आप', are:'हैं', is:'है', the:'यह', of:'का', on:'पर', at:'पर', by:'द्वारा', as:'के रूप में', only:'केवल',
  brings:'लाता है', single:'एकल', under:'अंतर्गत', above:'ऊपर', below:'नीचे', before:'पहले', after:'बाद',
  room:'कक्ष', underground:'भूमिगत', entrance:'प्रवेश', designated:'निर्धारित', point:'बिंदु', read:'पढ़ें', reading:'पठन',
  generation:'निर्माण', generated:'निर्मित', completed:'पूर्ण', processing:'प्रसंस्करण', progress:'प्रगति',
};

const exact = new Map(Object.entries(hi).map(([k,v]) => [k.trim().toLowerCase(), v]));
const phraseEntries = [...exact.entries()].sort((a,b) => b[0].length - a[0].length);

function translateWordwise(text: string): string {
  const exactHit = exact.get(text.trim().toLowerCase());
  if (exactHit) return preserveCaseShape(text, exactHit);
  return text.replace(/[A-Za-z][A-Za-z'/-]*/g, token => {
    if (/^(CH4|CO2?|O2|LiDAR|SLAM|MQTT|ESP32|AI|IMU|PTZ|PDF|PNG|JPG|NE|FOV|m\/s|ppm)$/i.test(token)) return token;
    const hit = wordMap[token.toLowerCase()];
    if (hit) return hit;
    // Never leave an ordinary UI word in Latin script in Hindi mode.
    return transliterateLatinToDevanagari(token);
  });
}

function preserveCaseShape(original: string, translated: string) {
  const leading = original.match(/^\s*/)?.[0] ?? '';
  const trailing = original.match(/\s*$/)?.[0] ?? '';
  return leading + translated + trailing;
}

const devanagariDigits = (text: string) => text.replace(/[0-9]/g, d => '०१२३४५६७८९'[Number(d)]);

export function translateText(text: string): string {
  if (!text.trim()) return text;
  const trimmed = text.trim();
  const exactHit = exact.get(trimmed.toLowerCase());
  if (exactHit) return preserveCaseShape(text, devanagariDigits(exactHit));

  let out = text;
  for (const [source, target] of phraseEntries) {
    const re = new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    out = out.replace(re, target);
  }
  out = translateWordwise(out);
  return devanagariDigits(out);
}

const protectedInput = (el: HTMLInputElement | HTMLTextAreaElement) => {
  const type = (el.getAttribute('type') || '').toLowerCase();
  const name = `${el.name} ${el.id} ${el.placeholder}`.toLowerCase();
  return ['password','email','number','date','time','tel','url'].includes(type) || /email|password|officer.?id|employee.?id|service.?id|mine.?code|phone|mobile|login|aadhaar|pan/.test(name);
};

const consonants: Record<string,string> = { kh:'ख',gh:'घ',chh:'छ',ch:'च',jh:'झ',th:'थ',dh:'ध',ph:'फ',bh:'भ',sh:'श',ng:'ङ',ny:'ञ',tr:'त्र',dr:'द्र',kr:'क्र',gr:'ग्र',pr:'प्र',br:'ब्र',fr:'फ्र',vr:'व्र',sr:'स्र',sk:'स्क',st:'स्त',sp:'स्प',sw:'स्व',sm:'स्म',sn:'स्न',sl:'स्ल',h:'ह',k:'क',g:'ग',c:'क',j:'ज',t:'त',d:'द',n:'न',p:'प',b:'ब',m:'म',y:'य',r:'र',l:'ल',v:'व',w:'व',s:'स',f:'फ',z:'ज़',q:'क',x:'क्स'};
const vowels: Record<string,string> = { aa:'आ', ai:'ऐ', au:'औ', ii:'ई', ee:'ई', oo:'ऊ', uu:'ऊ', a:'अ', i:'इ', u:'उ', e:'ए', o:'ओ' };
const matras: Record<string,string> = { aa:'ा', ai:'ै', au:'ौ', ii:'ी', ee:'ी', oo:'ू', uu:'ू', a:'', i:'ि', u:'ु', e:'े', o:'ो' };

const commonPhonetic: Record<string, string> = {
  samiksha:'समीक्षा', samiksh:'समीक्ष', anu:'अनु', anushka:'अनुष्का', rohit:'रोहित', rahul:'राहुल', amit:'अमित', priya:'प्रिया', neha:'नेहा', pooja:'पूजा', puja:'पूजा', arjun:'अर्जुन', vikram:'विक्रम',
  mumbai:'मुंबई', delhi:'दिल्ली', jharia:'झरिया', dhanbad:'धनबाद', asansol:'आसनसोल', kolar:'कोलार', karnataka:'कर्नाटक', jharkhand:'झारखंड', bengal:'बंगाल', westbengal:'पश्चिम बंगाल',
};

export function transliterateLatinToDevanagari(input: string): string {
  if (!/[A-Za-z]/.test(input) || /[\u0900-\u097F]/.test(input)) return input;
  const whole = input.trim().toLowerCase();
  if (commonPhonetic[whole]) return commonPhonetic[whole];
  let out = '';
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s|[0-9.,!?()_\-/:]/.test(ch)) { out += ch; i++; continue; }
    const rest = input.slice(i).toLowerCase();
    let ckey = Object.keys(consonants).sort((a,b)=>b.length-a.length).find(k=>rest.startsWith(k));
    let vkey = Object.keys(vowels).sort((a,b)=>b.length-a.length).find(k=>rest.startsWith(k));
    if (vkey && (!ckey || vkey.length >= ckey.length)) { out += vowels[vkey]; i += vkey.length; continue; }
    if (ckey) {
      out += consonants[ckey]; i += ckey.length;
      const after = input.slice(i).toLowerCase();
      const nextV = Object.keys(matras).sort((a,b)=>b.length-a.length).find(k=>after.startsWith(k));
      if (nextV) { out += matras[nextV]; i += nextV.length; }
      else if (i < input.length && /[A-Za-z]/.test(input[i])) { out += '्'; }
      continue;
    }
    out += ch; i++;
  }
  return out;
}

let observer: MutationObserver | null = null;
let translating = false;
const originalText = new WeakMap<Node, string>();
const originalAttr = new WeakMap<Element, Record<string,string>>();

function shouldSkipElement(el: Element) {
  return ['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','INPUT','OPTION'].includes(el.tagName) || el.closest('[data-no-translate="true"]');
}

function translateDOM(root: ParentNode = document.body) {
  if (translating) return;
  translating = true;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  for (const textNode of nodes) {
    const parent = textNode.parentElement;
    if (!parent || shouldSkipElement(parent)) continue;
    if (!originalText.has(textNode)) originalText.set(textNode, textNode.nodeValue ?? '');
    const original = originalText.get(textNode)!;
    const translated = translateText(original);
    if (translated !== textNode.nodeValue) textNode.nodeValue = translated;
  }
  const attrs = ['placeholder','title','aria-label','aria-description'];
  document.querySelectorAll<HTMLElement>('*').forEach(el => {
    if (shouldSkipElement(el)) return;
    let originals = originalAttr.get(el);
    if (!originals) { originals = {}; originalAttr.set(el, originals); }
    for (const attr of attrs) {
      const value = el.getAttribute(attr);
      if (value == null) continue;
      if (!(attr in originals)) originals[attr] = value;
      const translated = translateText(originals[attr]);
      if (translated !== value) el.setAttribute(attr, translated);
    }
  });
  translating = false;
}

function restoreDOM() {
  if (translating) return;
  translating = true;
  document.querySelectorAll<HTMLElement>('*').forEach(el => {
    const originals = originalAttr.get(el);
    if (!originals) return;
    for (const [attr, value] of Object.entries(originals)) {
      if (el.getAttribute(attr) !== value) el.setAttribute(attr, value);
    }
  });
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const original = originalText.get(node);
    if (original !== undefined && node.nodeValue !== original) node.nodeValue = original;
  }
  translating = false;
}

function installInputTranslation(language: Language) {
  const handler = (event: FocusEvent) => {
    if (language !== 'hi' || event.type !== 'blur') return;
    const el = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el || !('value' in el) || protectedInput(el)) return;
    if (el.getAttribute('data-hindi-input') === 'false') return;
    const translated = transliterateLatinToDevanagari(el.value);
    if (translated !== el.value) {
      el.value = translated;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };
  document.addEventListener('blur', handler, true);
  return () => document.removeEventListener('blur', handler, true);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try { return localStorage.getItem('mole-language') === 'hi' ? 'hi' : 'en'; } catch { return 'en'; }
  });
  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try { localStorage.setItem('mole-language', next); } catch {}
  }, []);
  const toggleLanguage = useCallback(() => setLanguage(language === 'en' ? 'hi' : 'en'), [language, setLanguage]);
  const value = useMemo(() => ({ language, setLanguage, toggleLanguage }), [language, setLanguage, toggleLanguage]);

  useEffect(() => {
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
    observer?.disconnect();
    observer = null;

    // Always return the DOM to its original English state before applying a
    // new Hindi pass. This prevents translated text from becoming the source
    // text when React updates a page or when the user switches back to English.
    restoreDOM();
    if (language === 'hi') translateDOM();

    const disconnect = installInputTranslation(language);
    observer = new MutationObserver(() => {
      if (language === 'hi' && !translating) translateDOM();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder','title','aria-label','aria-description'],
    });
    return () => {
      disconnect();
      observer?.disconnect();
      observer = null;
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }
