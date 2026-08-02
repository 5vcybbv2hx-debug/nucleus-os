import { useState } from 'react';
import PlusMenu from '@/components/layout/PlusMenu';
import IdeaCaptureModal from '@/components/atlas/IdeaCaptureModal';
import TaskCreateModal from '@/components/atlas/TaskCreateModal';
import DailyReflectionModal from '@/components/atlas/DailyReflectionModal';

export default function AtlasQuickActions() {
  const [modal, setModal] = useState(null); // 'idea' | 'task' | 'reflection' | null

  return (
    <>
      <PlusMenu onAction={(key) => {
        if (key === 'idea') setModal('idea');
        else if (key === 'task') setModal('task');
        else if (key === 'reflection') setModal('reflection');
      }} />
      {modal === 'idea' && <IdeaCaptureModal onClose={() => setModal(null)} />}
      {modal === 'task' && <TaskCreateModal onClose={() => setModal(null)} />}
      {modal === 'reflection' && <DailyReflectionModal onClose={() => setModal(null)} />}
    </>
  );
}
