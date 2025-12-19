import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Star, Pencil, MoreVertical, X, Shirt, Footprints } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Toast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePersonas } from '../hooks/usePersonas';
import { CustomPersonaModal, CustomPersonaData } from '../components/CustomPersonaModal';
import { useFamilyMembers } from '../hooks/useFamilyMembers';
import { useFamilyMembersMutation } from '../hooks/useFamilyMembersMutation';
import type { FamilyMember } from '../services/settings';

export function FamilyMembersPage() {
  const { user } = useAuth();
  const { data: members = [], isLoading: loading } = useFamilyMembers(user?.id);
  const { createMutation, updateMutation, deleteMutation } = useFamilyMembersMutation(user?.id);
  const { data: personas = [], isLoading: personasLoading } = usePersonas();
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [customPersonaData, setCustomPersonaData] = useState<CustomPersonaData | null>(null);
  const [editingBasePersonaId, setEditingBasePersonaId] = useState<string | null>(null);
  const [editingCustomPersonaId, setEditingCustomPersonaId] = useState<string | null>(null);
  const [customPersonas, setCustomPersonas] = useState<Record<string, CustomPersonaData & { id: string }>>({});
  const [standaloneCustomPersonas, setStandaloneCustomPersonas] = useState<Array<CustomPersonaData & { id: string }>>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showPersonaSection, setShowPersonaSection] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    persona_id: 'friendly',
    writing_style: '',
    is_default: false,
    top_size: '',
    bottom_size: '',
    shoe_size: '',
  });

  useEffect(() => {
    loadCustomPersonas();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeMenuId]);

  async function loadCustomPersonas() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('custom_personas')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const personasMap: Record<string, CustomPersonaData & { id: string }> = {};
      const standalone: Array<CustomPersonaData & { id: string }> = [];

      data?.forEach(persona => {
        const personaData = {
          id: persona.id,
          name: persona.name,
          emoji: persona.emoji,
          description: persona.description,
          color: persona.color,
          writing_style: persona.writing_style,
        };

        if (persona.base_persona_id) {
          personasMap[persona.base_persona_id] = personaData;
        } else {
          standalone.push(personaData);
        }
      });

      setCustomPersonas(personasMap);
      setStandaloneCustomPersonas(standalone);
    } catch (error) {
      console.error('Error loading custom personas:', error);
    }
  }

  function openModal(member?: FamilyMember) {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        age: member.age.toString(),
        persona_id: member.persona_id,
        writing_style: member.writing_style || '',
        is_default: member.is_default,
        top_size: member.top_size || '',
        bottom_size: member.bottom_size || '',
        shoe_size: member.shoe_size || '',
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        age: '',
        persona_id: 'friendly',
        writing_style: '',
        is_default: false,
        top_size: '',
        bottom_size: '',
        shoe_size: '',
      });
    }
    setShowPersonaSection(false);
    setShowModal(true);
    setActiveMenuId(null);
  }

  function closeModal() {
    setShowModal(false);
    setEditingMember(null);
    setShowPersonaSection(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const age = parseInt(formData.age);
    if (isNaN(age) || age < 1 || age > 120) {
      setToast({ message: 'Veuillez entrer un âge valide', type: 'error' });
      return;
    }

    try {
      const memberData = {
        name: formData.name.trim(),
        age,
        persona_id: formData.persona_id,
        custom_persona_id: null,
        writing_style: formData.writing_style || null,
        is_default: formData.is_default,
        top_size: formData.top_size || null,
        bottom_size: formData.bottom_size || null,
        shoe_size: formData.shoe_size || null,
      };

      if (editingMember) {
        await updateMutation.mutateAsync({ memberId: editingMember.id, member: memberData });
        setToast({ message: 'Membre modifié avec succès', type: 'success' });
      } else {
        await createMutation.mutateAsync(memberData);
        setToast({ message: 'Membre ajouté avec succès', type: 'success' });
      }

      closeModal();
    } catch (error) {
      console.error('Error saving member:', error);
      setToast({ message: 'Erreur lors de l\'enregistrement', type: 'error' });
    }
  }

  async function handleDelete() {
    if (!memberToDelete) return;

    try {
      await deleteMutation.mutateAsync(memberToDelete);
      setToast({ message: 'Membre supprimé avec succès', type: 'success' });
      setMemberToDelete(null);
    } catch (error) {
      console.error('Error deleting member:', error);
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  }

  async function toggleDefault(id: string, currentDefault: boolean) {
    if (!user) return;

    try {
      if (!currentDefault) {
        for (const member of members) {
          if (member.is_default) {
            await updateMutation.mutateAsync({ memberId: member.id, member: { is_default: false } });
          }
        }
      }

      await updateMutation.mutateAsync({ memberId: id, member: { is_default: !currentDefault } });
      setActiveMenuId(null);
    } catch (error) {
      console.error('Error updating default:', error);
      setToast({ message: 'Erreur lors de la mise à jour', type: 'error' });
    }
  }

  function getPersonaInfo(member: FamilyMember) {
    if (member.persona_id === 'custom' && member.custom_persona_id) {
      const standalonePersona = standaloneCustomPersonas.find(p => p.id === member.custom_persona_id);
      if (standalonePersona) {
        return {
          name: standalonePersona.name || 'Persona personnalisé',
          emoji: standalonePersona.emoji,
          color: standalonePersona.color,
          description: standalonePersona.description || 'Description personnalisée',
          writingStyle: standalonePersona.writing_style,
        };
      }
    }

    const customPersona = customPersonas[member.persona_id];
    if (customPersona) {
      const basePersona = personas.find(p => p.id === member.persona_id);
      return {
        name: customPersona.name || basePersona?.name || 'Personnalisé',
        emoji: customPersona.emoji || basePersona?.emoji || '✨',
        color: customPersona.color || basePersona?.color || 'bg-purple-100 border-purple-300',
        description: customPersona.description || basePersona?.description || 'Description personnalisée',
        writingStyle: customPersona.writing_style || basePersona?.writing_style || 'Style d\'écriture personnalisé',
      };
    }

    const persona = personas.find(p => p.id === member.persona_id);
    if (persona) {
      return {
        name: persona.name,
        emoji: persona.emoji,
        color: persona.color,
        description: persona.description,
        writingStyle: member.writing_style || persona.writing_style,
      };
    }

    return {
      name: 'Personnalisé',
      emoji: '✨',
      color: 'bg-purple-100 border-purple-300',
      description: 'Style personnalisé',
      writingStyle: member.writing_style || 'Style d\'écriture personnalisé',
    };
  }

  async function handleSavePersona(personaData: CustomPersonaData) {
    if (!user) return;

    try {
      if (editingCustomPersonaId) {
        const { error } = await supabase
          .from('custom_personas')
          .update({
            name: personaData.name,
            emoji: personaData.emoji,
            description: personaData.description,
            color: personaData.color,
            writing_style: personaData.writing_style,
          })
          .eq('id', editingCustomPersonaId)
          .eq('user_id', user.id);

        if (error) throw error;

        await loadCustomPersonas();
        setToast({ message: 'Persona modifié avec succès', type: 'success' });
      } else if (editingBasePersonaId) {
        const { error } = await supabase
          .from('custom_personas')
          .upsert({
            user_id: user.id,
            base_persona_id: editingBasePersonaId,
            name: personaData.name,
            emoji: personaData.emoji,
            description: personaData.description,
            color: personaData.color,
            writing_style: personaData.writing_style,
          }, {
            onConflict: 'user_id,base_persona_id'
          });

        if (error) throw error;

        await loadCustomPersonas();
        setToast({ message: 'Persona modifié avec succès', type: 'success' });
      } else {
        const { data, error } = await supabase
          .from('custom_personas')
          .insert({
            user_id: user.id,
            base_persona_id: null,
            name: personaData.name,
            emoji: personaData.emoji,
            description: personaData.description,
            color: personaData.color,
            writing_style: personaData.writing_style,
          })
          .select()
          .single();

        if (error) throw error;

        await loadCustomPersonas();

        setFormData({
          ...formData,
          persona_id: 'custom',
          writing_style: personaData.writing_style,
        });

        setToast({ message: 'Persona créé avec succès', type: 'success' });
      }

      setIsPersonaModalOpen(false);
      setEditingBasePersonaId(null);
      setEditingCustomPersonaId(null);
      setCustomPersonaData(null);
    } catch (error) {
      console.error('Error saving persona:', error);
      setToast({ message: 'Erreur lors de la sauvegarde du persona', type: 'error' });
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Nos vendeurs</h1>
            <p className="text-sm text-slate-600 mt-0.5">Gérez les vendeurs de votre compte</p>
          </div>
        </div>
        <Button type="button" onClick={() => openModal()} className="w-full sm:w-auto">
          <Plus className="w-5 h-5" />
          <span className="sm:inline">Ajouter</span>
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Aucun vendeur</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Créez des profils pour les différents vendeurs de votre équipe et personnalisez leur style rédactionnel
          </p>
          <Button type="button" onClick={() => openModal()}>
            <Plus className="w-5 h-5" />
            Ajouter votre premier vendeur
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5">
          {members.map(member => {
            const personaInfo = getPersonaInfo(member);
            return (
              <div
                key={member.id}
                className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{member.name}</h3>
                          {member.is_default && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 flex-shrink-0">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Par défaut
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{member.age} ans</p>
                      </div>

                      <div className="relative flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === member.id ? null : member.id);
                          }}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {activeMenuId === member.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
                            <button
                              onClick={() => {
                                toggleDefault(member.id, member.is_default);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Star className={`w-4 h-4 ${member.is_default ? 'fill-current text-emerald-600' : 'text-slate-400'}`} />
                              {member.is_default ? 'Retirer par défaut' : 'Définir par défaut'}
                            </button>
                            <button
                              onClick={() => openModal(member)}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4 text-blue-600" />
                              Modifier
                            </button>
                            <button
                              onClick={() => {
                                setMemberToDelete(member.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {(member.top_size || member.bottom_size || member.shoe_size) && (
                      <div className="flex flex-wrap gap-2 sm:gap-3 mb-3">
                        {member.top_size && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
                            <Shirt className="w-4 h-4 text-slate-600" />
                            <span className="text-xs text-slate-500 mr-1">Haut:</span>
                            <span className="font-medium text-slate-900">{member.top_size}</span>
                          </div>
                        )}
                        {member.bottom_size && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
                            <Shirt className="w-4 h-4 text-slate-600" />
                            <span className="text-xs text-slate-500 mr-1">Bas:</span>
                            <span className="font-medium text-slate-900">{member.bottom_size}</span>
                          </div>
                        )}
                        {member.shoe_size && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
                            <Footprints className="w-4 h-4 text-slate-600" />
                            <span className="font-medium text-slate-900">{member.shoe_size}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`flex items-start gap-3 p-4 rounded-lg border ${personaInfo.color}`}>
                      <span className="text-2xl flex-shrink-0 mt-0.5">{personaInfo.emoji}</span>
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nom du Persona:</span>
                            <span className="text-sm font-bold text-slate-900">{personaInfo.name}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Description courte:</p>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {personaInfo.description}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Style de rédaction pour l'IA:</p>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {personaInfo.writingStyle}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={editingMember ? 'Modifier le vendeur' : 'Ajouter un vendeur'}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nom / Pseudo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Ex: Nina, Tom, Papa..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Âge <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Ex: 25"
                  min="1"
                  max="120"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <div className="flex items-center gap-1">
                      <Shirt className="w-4 h-4" />
                      Taille Haut
                    </div>
                  </label>
                  <select
                    value={formData.top_size}
                    onChange={(e) => setFormData({ ...formData, top_size: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="">-</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="3XL">3XL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <div className="flex items-center gap-1">
                      <Shirt className="w-4 h-4" />
                      Taille Bas
                    </div>
                  </label>
                  <select
                    value={formData.bottom_size}
                    onChange={(e) => setFormData({ ...formData, bottom_size: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="">-</option>
                    <option value="34">34</option>
                    <option value="36">36</option>
                    <option value="38">38</option>
                    <option value="40">40</option>
                    <option value="42">42</option>
                    <option value="44">44</option>
                    <option value="46">46</option>
                    <option value="48">48</option>
                    <option value="50">50</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <div className="flex items-center gap-1">
                      <Footprints className="w-4 h-4" />
                      Pointure
                    </div>
                  </label>
                  <select
                    value={formData.shoe_size}
                    onChange={(e) => setFormData({ ...formData, shoe_size: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="">-</option>
                    {Array.from({ length: 30 }, (_, i) => (i + 20).toString()).map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={() => setShowPersonaSection(!showPersonaSection)}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">Style rédactionnel</span>
                  <span className="text-xs text-slate-600">(optionnel)</span>
                </div>
                {showPersonaSection ? <X className="w-5 h-5 text-slate-600" /> : <Plus className="w-5 h-5 text-slate-600" />}
              </button>

              {showPersonaSection && (
                <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
                  <div className="flex items-center justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsPersonaModalOpen(true)}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      Créer un style personnalisé
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {personas.map(persona => {
                      const customPersona = customPersonas[persona.id];
                      const displayPersona = customPersona || persona;

                      return (
                        <label
                          key={persona.id}
                          className={`flex items-start gap-3 p-3 border rounded-lg transition-all cursor-pointer ${
                            formData.persona_id === persona.id
                              ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="persona"
                            value={persona.id}
                            checked={formData.persona_id === persona.id}
                            onChange={() => setFormData({
                              ...formData,
                              persona_id: persona.id,
                              writing_style: customPersona?.writing_style || persona.writing_style
                            })}
                            className="mt-1 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{displayPersona.emoji}</span>
                              <span className="font-medium text-slate-900 text-sm">{displayPersona.name}</span>
                              {customPersona && (
                                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                  Personnalisé
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600">{displayPersona.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setEditingBasePersonaId(persona.id);
                              setCustomPersonaData(customPersona || {
                                name: persona.name,
                                emoji: persona.emoji,
                                description: persona.description,
                                color: persona.color,
                                writing_style: persona.writing_style,
                              });
                              setIsPersonaModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded transition-colors flex-shrink-0"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </label>
                      );
                    })}
                    {standaloneCustomPersonas.map(customPersona => (
                      <label
                        key={customPersona.id}
                        className={`flex items-start gap-3 p-3 border rounded-lg transition-all cursor-pointer ${
                          formData.persona_id === 'custom'
                            ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="persona"
                          value="custom"
                          checked={formData.persona_id === 'custom'}
                          onChange={() => setFormData({
                            ...formData,
                            persona_id: 'custom',
                            writing_style: customPersona.writing_style
                          })}
                          className="mt-1 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{customPersona.emoji}</span>
                            <span className="font-medium text-slate-900 text-sm">{customPersona.name}</span>
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                              Personnalisé
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{customPersona.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setEditingCustomPersonaId(customPersona.id);
                            setCustomPersonaData({
                              name: customPersona.name,
                              emoji: customPersona.emoji,
                              description: customPersona.description,
                              color: customPersona.color,
                              writing_style: customPersona.writing_style,
                            });
                            setIsPersonaModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded transition-colors flex-shrink-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Définir comme vendeur par défaut</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" className="flex-1">
                {editingMember ? 'Sauvegarder' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmModal
        isOpen={memberToDelete !== null}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer le vendeur"
        message="Êtes-vous sûr de vouloir supprimer ce vendeur ? Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <CustomPersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => {
          setIsPersonaModalOpen(false);
          setEditingBasePersonaId(null);
          setEditingCustomPersonaId(null);
          setCustomPersonaData(null);
        }}
        onSave={handleSavePersona}
        initialData={customPersonaData}
        basePersonaId={editingBasePersonaId || undefined}
      />
    </div>
  );
}
