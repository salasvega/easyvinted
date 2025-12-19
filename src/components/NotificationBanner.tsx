import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  articleId: string;
  message: string;
  articleTitle: string;
  suggestedDate: string;
}

export function NotificationBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [closing, setClosing] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      checkNotifications();
    }
  }, [user]);

  async function checkNotifications() {
    if (!user) return;

    try {
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('enable_planner_notifications, notification_days_before')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!prefs?.enable_planner_notifications) {
        return;
      }

      const daysBefore = prefs.notification_days_before || 14;
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysBefore);

      const { data: suggestions } = await supabase
        .from('selling_suggestions')
        .select('id, article_id, suggested_date, priority, reason')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .gte('suggested_date', now.toISOString().split('T')[0])
        .lte('suggested_date', futureDate.toISOString().split('T')[0]);

      if (!suggestions || suggestions.length === 0) {
        return;
      }

      const notifs: Notification[] = [];
      for (const suggestion of suggestions) {
        const { data: article } = await supabase
          .from('articles')
          .select('title')
          .eq('id', suggestion.article_id)
          .maybeSingle();

        if (article) {
          const daysUntil = Math.ceil(
            (new Date(suggestion.suggested_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          notifs.push({
            id: suggestion.id,
            articleId: suggestion.article_id,
            message: `Période optimale dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''} !`,
            articleTitle: article.title,
            suggestedDate: suggestion.suggested_date,
          });
        }
      }

      setNotifications(notifs);
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  }

  const handleClose = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setClosing((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setDismissed((prev) => new Set(prev).add(id));
      setClosing((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  };

  const handleNotificationClick = (articleId: string) => {
    navigate(`/articles/${articleId}/preview`);
  };

  const visibleNotifications = notifications.filter((n) => !dismissed.has(n.id));

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          onClick={() => handleNotificationClick(notification.articleId)}
          className={`bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg shadow-lg p-4 flex items-start gap-3 transform transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-105 ${
            closing.has(notification.id)
              ? 'animate-slide-out-right'
              : 'animate-bounce-in'
          }`}
          style={{
            animationDelay: closing.has(notification.id) ? '0ms' : `${index * 100}ms`,
          }}
        >
          <Bell className="w-5 h-5 flex-shrink-0 mt-0.5 animate-wiggle" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{notification.message}</p>
            <p className="text-xs opacity-90 mt-1 truncate">{notification.articleTitle}</p>
            <p className="text-xs opacity-75 mt-1">
              Date suggérée: {new Date(notification.suggestedDate).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <button
            onClick={(e) => handleClose(e, notification.id)}
            className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-all duration-200 hover:rotate-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
