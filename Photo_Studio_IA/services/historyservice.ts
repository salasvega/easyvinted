import { InventoryItem } from '../types';

const STORAGE_KEY = 'snapsell_inventory';

export const getInventory = (): InventoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load inventory", e);
    return [];
  }
};

export const saveToInventory = (item: InventoryItem): boolean => {
  try {
    const current = getInventory();
    // Prepend new item
    const updated = [item, ...current];
    // Limit to 20 items to avoid quota issues for now
    const trimmed = updated.slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return true;
  } catch (e) {
    console.error("Storage quota exceeded", e);
    return false;
  }
};

export const deleteFromInventory = (id: string) => {
  try {
    const current = getInventory();
    const updated = current.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete item", e);
  }
};

export const clearInventory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear inventory", e);
  }
};