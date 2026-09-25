import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translateTexts } from '../i18n/geminiTranslate';

const originalText = new WeakMap<Text, string>();
const lastTranslation = new WeakMap<Text, string>();

function shouldSkip(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent) return true;

  if (
    parent.closest(
      'script, style, noscript, code, pre, textarea, input, option, ' +
      '[contenteditable="true"], [data-no-translate]'
    )
  ) {
    return true;
  }

  const value = node.textContent?.trim() ?? '';

  if (!value || value.length < 2) return true;
  if (!/[A-Za-z]/.test(value)) return true;
  if (value === 'M.O.L.E.') return true;
  if (/^[\d\s.,:/%°+-]+$/.test(value)) return true;

  return false;
}

export function AutoTranslate() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage === 'hi' ? 'hi' : 'en';

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;

    let timer: number | undefined;
    let stopped = false;
    const controller = new AbortController();

    async function updatePage() {
      if (stopped || !root) return;

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const pending: Array<{ node: Text; source: string }> = [];

      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        if (shouldSkip(node)) continue;

        const current = node.textContent ?? '';
        const previousTranslation = lastTranslation.get(node);
        const previousSource = originalText.get(node);

        // React ne text dobara render kiya ho toh naya source yaad rakho.
        if (!previousSource || (current !== previousTranslation && current !== previousSource)) {
          originalText.set(node, current);
          lastTranslation.delete(node);
        }

        const source = originalText.get(node) ?? current;

        if (language === 'en') {
          if (previousTranslation && current === previousTranslation) {
            node.textContent = source;
          }
          lastTranslation.delete(node);
        } else if (current !== lastTranslation.get(node)) {
          pending.push({ node, source });
        }
      }

      if (language !== 'hi' || pending.length === 0) return;

      // Small batches keep requests manageable on large dashboard pages.
      for (let start = 0; start < pending.length; start += 35) {
        if (stopped) return;

        const batch = pending.slice(start, start + 35);

        try {
          const translated = await translateTexts(
            batch.map(({ source }) => source.trim()),
            'hi',
            controller.signal
          );

          if (stopped) return;

          batch.forEach(({ node, source }, index) => {
            if (!node.isConnected || node.textContent !== source) return;

            const leading = source.match(/^\s*/)?.[0] ?? '';
            const trailing = source.match(/\s*$/)?.[0] ?? '';
            const value = `${leading}${translated[index]}${trailing}`;

            node.textContent = value;
            lastTranslation.set(node, value);
          });
        } catch (error) {
          if (!controller.signal.aborted) {
            console.error('Page translation failed:', error);
          }
          return;
        }
      }
    }

    function scheduleUpdate() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void updatePage();
      }, 350);
    }

    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    scheduleUpdate();

    return () => {
      stopped = true;
      controller.abort();
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [language]);

  return null;
}