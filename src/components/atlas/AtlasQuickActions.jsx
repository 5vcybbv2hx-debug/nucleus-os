import { useState } from 'react';
import PlusMenu from '@/components/layout/PlusMenu';
import IdeaCaptureModal from '@/components/atlas/IdeaCaptureModal';
import TaskCreateModal from '@/components/atlas/TaskCreateModal';

export default function AtlasQuickActions() {
  const [modal, setModal] = useState(null); // 'idea' | 'task' | null

  return (
    <>
      <PlusMenu onAction={(key) => {
        if (key === 'idea') setModal('idea');
        else if (key === 'task') setModal('task');
      }} />
      {modal === 'idea' && <IdeaCaptureModal onClose={() => setModal(null)} />}
      {modal === 'task' && <TaskCreateModal onClose={() => setModal(null)} />}
    </>
  );
}