import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Article } from '../types/article';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  article?: Article;
  lot?: {
    id: string;
    name: string;
  };
  onScheduled?: () => void;
  onSchedule?: (date: Date) => void;
  currentDate?: Date;
  initialDate?: string;
}

export function ScheduleModal({ isOpen, onClose, article, lot, onScheduled, onSchedule, currentDate, initialDate }: ScheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialDate) {
      const date = new Date(initialDate);
      return date.toISOString().split('T')[0];
    }
    if (currentDate) {
      return currentDate.toISOString().split('T')[0];
    }
    return '';
  });
  const [selectedTime, setSelectedTime] = useState(() => {
    if (initialDate) {
      const date = new Date(initialDate);
      return date.toTimeString().slice(0, 5);
    }
    if (currentDate) {
      return currentDate.toTimeString().slice(0, 5);
    }
    return '';
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        const date = new Date(initialDate);
        setSelectedDate(date.toISOString().split('T')[0]);
        setSelectedTime(date.toTimeString().slice(0, 5));
      } else if (currentDate) {
        setSelectedDate(currentDate.toISOString().split('T')[0]);
        setSelectedTime(currentDate.toTimeString().slice(0, 5));
      }
    }
  }, [isOpen, initialDate, currentDate]);

  if (!isOpen) return null;

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime) return;

    try {
      setLoading(true);
      const dateTime = new Date(`${selectedDate}T${selectedTime}`);

      if (onSchedule) {
        await onSchedule(dateTime);
      } else if (article) {
        const { error } = await supabase
          .from('articles')
          .update({
            status: 'scheduled',
            scheduled_for: dateTime.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', article.id);

        if (error) throw error;

        if (onScheduled) {
          onScheduled();
        }
      } else if (lot) {
        const { error } = await supabase
          .from('lots')
          .update({
            status: 'scheduled',
            scheduled_for: dateTime.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', lot.id);

        if (error) throw error;

        if (onScheduled) {
          onScheduled();
        }
      }

      onClose();
      setSelectedDate('');
      setSelectedTime('');
    } catch (error) {
      console.error('Error scheduling:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Programmer la publication</h3>
                {article && <p className="text-sm text-gray-600">{article.title}</p>}
                {lot && <p className="text-sm text-gray-600">{lot.name}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 mt-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date de publication
              </label>
              <input
                type="date"
                min={minDate}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Heure de publication
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                {article ? "L'article" : "Le lot"} sera automatiquement publié sur Vinted à la date et l'heure choisies.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSchedule}
              disabled={!selectedDate || !selectedTime || loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Programmation...' : 'Programmer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
