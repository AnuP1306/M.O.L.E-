/* Same brand block as the dashboard top bar (re-uses the existing .brand styles). */
export function Brand({ onClick }: { onClick?: () => void }) {
  const inner = (
    <>
      <div className="brand-mark">M.</div>
      <div>
        <strong>M.O.L.E.</strong>
        <small>MINE OPERATIONS & LIFE-SAVING EXPLORER</small>
      </div>
    </>
  );
  return onClick
    ? <button className="brand brand-link" onClick={onClick} title="Home">{inner}</button>
    : <div className="brand">{inner}</div>;
}
