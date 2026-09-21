import { ShieldCheck } from 'lucide-react';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { useSession } from '../state/SessionContext';

/** Rescue Operator landing while no rescue operation has been declared. */
export function NoActiveRescue() {
  const { user, selectedMine } = useSession();
  if (!user || !selectedMine) return null;
  return (
    <div className="app shell">
      <WorkspaceHeader />
      <main className="shell-main">
        <section className="panel idle-panel">
          <div className="idle-icon"><ShieldCheck size={34} /></div>
          <div className="eyebrow">RESCUE OPERATOR · {selectedMine.name.toUpperCase()}</div>
          <h1>NO ACTIVE RESCUE OPERATION</h1>
          <p>The rescue console opens here as soon as an operation is declared for this mine.</p>
          <span className="badge safe">STANDBY</span>
        </section>
      </main>
    </div>
  );
}
