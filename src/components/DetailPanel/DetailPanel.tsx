import { useRef, useEffect, useCallback } from 'react';
import { useChatDispatch, useChatState } from '../../context/ChatContext';
import { InternalFactory } from './InternalFactory';
import { ExternalFactory } from './ExternalFactory';
import { PanelHeader } from './PanelHeader';
import { AnchorNav } from './AnchorNav';
import { PanelFooter } from './PanelFooter';

export function DetailPanel() {
  const dispatch = useChatDispatch();
  const { selectedFactory } = useChatState();
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const isOpen = selectedFactory !== null;

  const handleBackdropClick = useCallback(
    (e: MouseEvent) => {
      if (!isOpen) return;
      const panel = panelRef.current;
      if (!panel) return;
      // Click is inside the panel or on a factory name — don't close
      if (panel.contains(e.target as Node)) return;
      if ((e.target as HTMLElement).closest('.factory-name, .qr-factory-link')) return;
      dispatch({ type: 'CLOSE_FACTORY' });
    },
    [isOpen, dispatch]
  );

  useEffect(() => {
    document.addEventListener('click', handleBackdropClick);
    return () => document.removeEventListener('click', handleBackdropClick);
  }, [handleBackdropClick]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        dispatch({ type: 'CLOSE_FACTORY' });
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (isOpen && bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [isOpen, selectedFactory?.type]);

  return (
    <div
      ref={panelRef}
      className={`detail-panel${isOpen ? ' open' : ''}`}
    >
      {selectedFactory && (
        <>
          <PanelHeader factory={selectedFactory} />
          <AnchorNav factory={selectedFactory} panelBodyRef={bodyRef} />
          <div className="panel-body" ref={bodyRef}>
            {selectedFactory.type === 'internal' ? (
              <InternalFactory factory={selectedFactory} />
            ) : (
              <ExternalFactory factory={selectedFactory} />
            )}
          </div>
          <PanelFooter factory={selectedFactory} />
        </>
      )}
    </div>
  );
}
