import { useTranslation } from 'react-i18next';

export function Brand({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation();

  const inner = (
    <>
      <div className="brand-mark">M.</div>
      <div>
        <strong>M.O.L.E.</strong>
        <small>{t('brand.fullName')}</small>
      </div>
    </>
  );

  return onClick ? (
    <button
      className="brand brand-link"
      onClick={onClick}
      title={t('brand.home')}
    >
      {inner}
    </button>
  ) : (
    <div className="brand">{inner}</div>
  );
}