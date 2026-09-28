import {
  Building2,
  Cpu,
  Map as MapIcon,
  Pencil,
  Users,
  Gauge,
  Radar,
  Upload,
  FileText,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { navigate } from '../router';
import { useSession } from '../state/SessionContext';

export function SiteManagerDashboard() {
  const { t } = useTranslation();

  const {
    selectedMine,
    mineSetups,
    saveMineSetup,
  } = useSession();

  const setup = selectedMine
    ? mineSetups[selectedMine.id]
    : undefined;

  if (!selectedMine || !setup) return null;

  // Keep stored values unchanged; translate known options only for display.
  const displayOption = (value: string) =>
    t(`setupOptions.${value}`, {
      defaultValue: value,
    });

  return (
    <div className="app shell">
      <WorkspaceHeader />

      <main className="shell-main">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              {t('landing.roles.SITE_MANAGER.label')}
            </div>

            <h1>{t('siteDashboard.title')}</h1>
          </div>

          <button
            className="btn small"
            onClick={() =>
              navigate('/site-manager/setup')
            }
          >
            <Pencil size={13} />
            {t('siteDashboard.editSetup')}
          </button>
        </div>

        <div className="workspace-grid three">

          {/* MINE */}
          <section className="panel">
            <div className="panel-title">
              <span>
                <Building2 size={13} />
              </span>

              <b>{t('siteDashboard.mine')}</b>
              <i />
            </div>

            <div className="kv">
              <span>{t('siteDashboard.name')}</span>
              <b>{selectedMine.name}</b>
            </div>

            <div className="kv">
              <span>{t('siteDashboard.mineCode')}</span>
              <b>{selectedMine.officialMineCode}</b>
            </div>

            <div className="kv">
              <span>{t('siteDashboard.district')}</span>
              <b>
                {selectedMine.district}
                {selectedMine.state
                  ? `, ${selectedMine.state}`
                  : ''}
              </b>
            </div>

            <div className="kv">
              <span>{t('siteDashboard.status')}</span>
              <b>
                {displayOption(selectedMine.status)}
              </b>
            </div>
          </section>

          {/* OPERATIONS */}
          <section className="panel">
            <div className="panel-title">
              <span>
                <Gauge size={13} />
              </span>

              <b>{t('siteDashboard.operations')}</b>
              <i />
            </div>

            <div className="kv">
              <span>
                {t('siteDashboard.workingMethod')}
              </span>
              <b>
                {displayOption(setup.workingMethod)}
              </b>
            </div>

            <div className="kv">
              <span>
                {t('siteDashboard.gassiness')}
              </span>
              <b>
                {displayOption(setup.gassiness)}
              </b>
            </div>

            <div className="kv">
              <span>{t('siteDashboard.levels')}</span>
              <b>{setup.levels}</b>
            </div>

            <div className="kv">
              <span>{t('siteDashboard.maxDepth')}</span>
              <b>
                {setup.maxDepth}{' '}
                {t('siteDashboard.metres')}
              </b>
            </div>

            <div className="kv">
              <span>
                {t('siteDashboard.workersPerShift')}
              </span>
              <b>{setup.workforcePerShift}</b>
            </div>

            <div className="kv">
              <span>
                {t('siteDashboard.shiftsPerDay')}
              </span>
              <b>{setup.shiftsPerDay}</b>
            </div>

            <div className="kv">
              <span>{t('siteDashboard.panels')}</span>
              <b>{setup.panels}</b>
            </div>

            <div className="kv">
              <span>
                {t('siteDashboard.galleries')}
              </span>
              <b>{setup.galleries}</b>
            </div>

            <div className="kv">
              <span>
                {t('siteDashboard.workingAreas')}
              </span>
              <b>{setup.workingAreas}</b>
            </div>
          </section>

          {/* MINE MAP */}
          <section className="panel">
            <div className="panel-title">
              <span>
                <MapIcon size={13} />
              </span>

              <b>{t('siteDashboard.mineMap')}</b>
              <i />
            </div>

            <div className="kv">
              <span>
                {t('siteDashboard.mapStatus')}
              </span>

              <b>
                {setup.mapStatus === 'COMPLETE'
                  ? t('siteDashboard.complete')
                  : t('siteDashboard.notMapped')}
              </b>
            </div>

            <div className="kv">
              <span>
                {t('siteDashboard.currentSource')}
              </span>

              <b>
                {setup.mapStatus === 'COMPLETE'
                  ? setup.mapMethod === 'UPLOAD'
                    ? t('siteDashboard.uploadedMap')
                    : t('siteDashboard.slamMapping')
                  : t('siteDashboard.notMapped')}
              </b>
            </div>

            {setup.mapFileName && (
              <div className="kv">
                <span>
                  {t('siteDashboard.file')}
                </span>

                <b>
                  <FileText size={13} />{' '}
                  {setup.mapFileName}
                </b>
              </div>
            )}

            {setup.lastMappedAt && (
              <div className="kv">
                <span>
                  {t('siteDashboard.lastMapped')}
                </span>

                <b>
                  {new Date(
                    setup.lastMappedAt
                  ).toLocaleString()}
                </b>
              </div>
            )}

            {setup.previousMappedAt && (
              <div className="kv">
                <span>
                  {t('siteDashboard.lastUpdate')}
                </span>

                <b>
                  {new Date(
                    setup.previousMappedAt
                  ).toLocaleString()}
                </b>
              </div>
            )}

            <input
              type="file"
              hidden
              accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf"
              onChange={(event) => {
                const file =
                  event.target.files?.[0];

                if (!file) return;

                const now =
                  new Date().toISOString();

                saveMineSetup({
                  ...setup,
                  mapMethod: 'UPLOAD',
                  mapFileName: file.name,
                  mapStatus: 'COMPLETE',
                  previousMappedAt:
                    setup.lastMappedAt ??
                    setup.previousMappedAt,
                  lastMappedAt: now,
                });

                // Mark this as a NEW upload so the
                // operations dashboard can show the
                // one-time map-processing animation.
                sessionStorage.setItem(
                  `mole-upload-map-pending-${selectedMine.id}`,
                  '1'
                );

                event.currentTarget.value = '';

                // Immediately enter the
                // pre-disaster operations dashboard.
                navigate(
                  '/site-manager/operations'
                );
              }}
              id={`mine-map-upload-${selectedMine.id}`}
            />

            <div
              className="page-heading-actions"
              style={{ marginTop: 12 }}
            >
              <label
                className="btn small"
                htmlFor={`mine-map-upload-${selectedMine.id}`}
              >
                <Upload size={13} />
                {t(
                  'siteDashboard.uploadExistingMap',
                  {
                    defaultValue:
                      'UPLOAD EXISTING MINE MAP',
                  }
                )}
              </label>

              <button
                className="btn small primary"
                type="button"
                onClick={() =>
                  navigate('/site-manager/slam')
                }
              >
                <Radar size={13} />

                {setup.mapStatus === 'COMPLETE'
                  ? t(
                      'siteDashboard.startNewSlam',
                      {
                        defaultValue:
                          'START NEW SLAM MAPPING',
                      }
                    )
                  : t(
                      'siteDashboard.startSlam',
                      {
                        defaultValue:
                          'START SLAM MAPPING',
                      }
                    )}
              </button>

              {setup.mapStatus === 'COMPLETE' && (
                <button
                  className="btn small"
                  type="button"
                  onClick={() =>
                    navigate(
                      '/site-manager/operations'
                    )
                  }
                >
                  <MapIcon size={13} />

                  {t(
                    'siteDashboard.openPreDisaster',
                    {
                      defaultValue:
                        'OPEN PRE-DISASTER DASHBOARD',
                    }
                  )}
                </button>
              )}
            </div>
          </section>

          {/* TEAM */}
          <section className="panel">
            <div className="panel-title">
              <span>
                <Users size={13} />
              </span>

              <b>{t('siteDashboard.team')}</b>
              <i />
            </div>

            {setup.team.map((member, index) => (
              <div
                className="kv"
                key={index}
              >
                <span>
                  {displayOption(
                    member.designation
                  ).toUpperCase()}
                </span>

                <b>
                  {member.name}

                  <small className="kv-sub">
                    {member.mobile}
                  </small>
                </b>
              </div>
            ))}
          </section>

          {/* ROVER FLEET */}
          <section className="panel span-2">
            <div className="panel-title">
              <span>
                <Cpu size={13} />
              </span>

              <b>
                {t('siteDashboard.roverFleet', {
                  count: setup.rovers.length,
                })}
              </b>

              <i />
            </div>

            {setup.rovers.map((rover) => (
              <div
                className="kv"
                key={rover.roverId}
              >
                <span>
                  {rover.roverId}

                  <small className="kv-sub">
                    {rover.serial}
                  </small>
                </span>

                <b>
                  {rover.payloads
                    .map(displayOption)
                    .join(' · ')}
                </b>
              </div>
            ))}
          </section>

        </div>
      </main>
    </div>
  );
}