import type { Factory } from '../../types';
import { useChatDispatch } from '../../context/ChatContext';

interface Props {
  factory: Factory;
}

export function PanelFooter({ factory }: Props) {
  const dispatch = useChatDispatch();
  const factoryId = 'factoryid' in factory ? factory.factoryid : (factory.id || '');
  const srmUrl = `https://platform.leverstyle.com/p/GeneralInformationView/${factoryId}`;
  const isExternal = factory.type === 'external';

  const handleAskAI = () => {
    dispatch({ type: 'CLOSE_FACTORY' });
    dispatch({ type: 'SET_PENDING_INPUT', value: factory.factoryname });
  };

  return (
    <div className="panel-footer">
      <a
        href={isExternal ? undefined : srmUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn btn-secondary${isExternal ? ' disabled' : ''}`}
        style={{ textDecoration: 'none', textAlign: 'center' }}
        onClick={isExternal ? (e) => e.preventDefault() : undefined}
      >
        Open in SRM
      </a>
      <button className="btn" onClick={handleAskAI}>Ask AI more</button>
    </div>
  );
}
