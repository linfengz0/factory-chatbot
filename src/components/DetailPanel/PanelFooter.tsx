import type { Factory } from '../../types';
import { useChatDispatch } from '../../context/ChatContext';

interface Props {
  factory: Factory;
}

export function PanelFooter({ factory }: Props) {
  const dispatch = useChatDispatch();
  const factoryId = 'factoryid' in factory ? factory.factoryid : (factory.id || '');
  const srmUrl = `https://platform-uat.leverstyle.net/oauth/v2/redirect?idp=sso-ls&hash=FactoryID/${factoryId}/Business/Platform/Scroll/0`;

  const handleAskAI = () => {
    dispatch({ type: 'CLOSE_FACTORY' });
    dispatch({ type: 'SET_PENDING_INPUT', value: factory.factoryname });
  };

  return (
    <div className="panel-footer">
      <a href={srmUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ textDecoration: 'none', textAlign: 'center' }}>
        Open in SRM
      </a>
      <button className="btn" onClick={handleAskAI}>Ask AI more</button>
    </div>
  );
}
