
import { Article, FamilyMember, ArticleStatus } from '../types';

const KEYS = {
  ARTICLES: 'easyvinted_articles',
  MEMBERS: 'easyvinted_members',
  SETTINGS: 'easyvinted_settings'
};

// --- Articles ---

export const getArticles = (): Article[] => {
  try {
    const data = localStorage.getItem(KEYS.ARTICLES);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const saveArticle = (article: Article): void => {
  const articles = getArticles();
  const index = articles.findIndex(a => a.id === article.id);
  
  if (index >= 0) {
    articles[index] = { ...article, updated_at: Date.now() };
  } else {
    articles.unshift({ ...article, created_at: Date.now(), updated_at: Date.now() });
  }
  
  localStorage.setItem(KEYS.ARTICLES, JSON.stringify(articles));
};

export const deleteArticle = (id: string): void => {
  const articles = getArticles().filter(a => a.id !== id);
  localStorage.setItem(KEYS.ARTICLES, JSON.stringify(articles));
};

export const getArticleById = (id: string): Article | undefined => {
  return getArticles().find(a => a.id === id);
};

// --- Family Members ---

export const getMembers = (): FamilyMember[] => {
  try {
    const data = localStorage.getItem(KEYS.MEMBERS);
    const members = data ? JSON.parse(data) : [];
    if (members.length === 0) {
      // Default member
      return [{ id: 'default', name: 'Me', persona: 'friendly', is_default: true }];
    }
    return members;
  } catch { return []; }
};

// --- Stats ---

export const getStats = () => {
  const articles = getArticles();
  return {
    totalItems: articles.length,
    totalValue: articles.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0),
    readyToSell: articles.filter(a => a.status === 'ready').length,
    soldItems: articles.filter(a => a.status === 'sold').length,
  };
};
