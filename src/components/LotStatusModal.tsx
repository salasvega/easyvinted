import { FileText, CheckCircle2, Clock, Send, DollarSign } from 'lucide-react';
import { LotStatus } from '../types/lot';
import { Modal } from './ui/Modal';

const STATUS_LABELS: Record<LotStatus, string> = {
  draft: 'Brouillon',
  ready: 'Prêt',
  scheduled: 'Planifié',
  published: 'Publié',
  sold: 'Vendu',
};

const STATUS_COLORS: Record<LotStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  ready: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  published: 'bg-purple-100 text-purple-700',
  sold: 'bg-green-100 text-green-700',
};

const renderStatusIcon = (status: LotStatus) => {
  switch (status) {
    case 'draft':
      return <FileText className="w-3.5 h-3.5" />;
    case 'ready':
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'scheduled':
      return <Clock className="w-3.5 h-3.5" />;
    case 'published':
      return <Send className="w-3.5 h-3.5" />;
    case 'sold':
      return <DollarSign className="w-3.5 h-3.5" />;
    default:
      return null;
  }
};

interface LotStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: LotStatus;
  onStatusChange: (status: LotStatus) => Promise<void>;
  onOpenSoldModal?: () => void;
}

export function LotStatusModal({
  isOpen,
  onClose,
  currentStatus,
  onStatusChange,
  onOpenSoldModal,
}: LotStatusModalProps) {
  const handleStatusClick = async (status: LotStatus) => {
    if (status === 'sold' && onOpenSoldModal) {
      onClose();
      onOpenSoldModal();
      return;
    }

    await onStatusChange(status);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Changer le statut">
      <div className="space-y-2">
        {(['draft', 'ready', 'scheduled', 'published', 'sold'] as LotStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => handleStatusClick(status)}
            disabled={currentStatus === status}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 ${
              currentStatus === status
                ? 'bg-gray-50 border-gray-300 cursor-not-allowed opacity-60'
                : 'bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
              {renderStatusIcon(status)}
              {STATUS_LABELS[status]}
            </span>
            {currentStatus === status && (
              <span className="ml-auto text-xs text-gray-500">(Actuel)</span>
            )}
          </button>
        ))}
      </div>
    </Modal>
  );
}
