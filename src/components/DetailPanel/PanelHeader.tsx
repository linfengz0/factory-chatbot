import { useChatDispatch } from '../../context/ChatContext';
import type { Factory } from '../../types';
import { COO_MAP } from '../../data/factories';

export function PanelHeader({ factory }: { factory: Factory }) {
  const dispatch = useChatDispatch();

  const isInt = factory.type === 'internal';

  const handleClose = () => {
    dispatch({ type: 'CLOSE_FACTORY' });
  };

  let title: string, subtitle: string;

  if (isInt) {
    title = factory.factoryname;
    subtitle = `${factory.factorycodelong} | ${factory.id}`;
  } else {
    title = factory.factoryname;
    subtitle = '';
  }

  return (
    <div className="panel-header">
      <div className="panel-header-top">
        <div>
          <div className="panel-title">{title}</div>
          <div className="panel-subtitle">{subtitle}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="panel-close" onClick={handleClose}>
            &times;
          </button>
        </div>
      </div>
      <div className="panel-meta">
        {isInt ? (
          <>
            <span className="meta-tag tag-internal">Internal Factory</span>
            <span className={`meta-tag ${factory.factorystatus === 'Active' ? 'tag-status-active' : 'tag-status-inactive'}`}>
              {factory.factorystatus}
            </span>
            <span className="meta-tag tag-country">
              {COO_MAP[factory.coostring] || factory.coostring}
            </span>
          </>
        ) : (
          <>
            <span className="meta-tag tag-external">External Factory</span>
            <span className="meta-tag tag-country">
              {COO_MAP[factory.coostring] || factory.coostring}
            </span>
            <span className="meta-tag tag-country">
              Est. {factory.yearfounded}
            </span>
            <span className="meta-tag tag-country">
              {factory.businesstype}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
