import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

interface TeamStepProps {
  onNext: (data: TeamData) => void;
  onSkip: () => void;
  mainUserName: string;
  initialData?: TeamData;
}

export interface TeamMember {
  id: string;
  display_name: string;
  is_default: boolean;
}

export interface TeamData {
  members: TeamMember[];
  defaultMemberId: string;
}

export default function TeamStep({ onNext, onSkip, mainUserName, initialData }: TeamStepProps) {
  const mainMember: TeamMember = {
    id: 'main',
    display_name: mainUserName,
    is_default: true,
  };

  const [members, setMembers] = useState<TeamMember[]>(
    initialData?.members || [mainMember]
  );
  const [defaultMemberId, setDefaultMemberId] = useState(
    initialData?.defaultMemberId || 'main'
  );
  const [newMemberName, setNewMemberName] = useState('');

  const handleAddMember = () => {
    if (newMemberName.trim() === '') return;

    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      display_name: newMemberName.trim(),
      is_default: false,
    };

    setMembers([...members, newMember]);
    setNewMemberName('');
  };

  const handleRemoveMember = (id: string) => {
    if (id === 'main') return;

    setMembers(members.filter((m) => m.id !== id));

    if (defaultMemberId === id) {
      setDefaultMemberId('main');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      members,
      defaultMemberId,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Gérez votre équipe</h2>
        <p className="text-gray-600">Ajoutez d'autres vendeurs (famille, amis...)</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
            >
              <input
                type="radio"
                name="default_member"
                checked={defaultMemberId === member.id}
                onChange={() => setDefaultMemberId(member.id)}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{member.display_name}</div>
                {member.id === 'main' && (
                  <div className="text-xs text-gray-500">C'est vous</div>
                )}
              </div>
              {defaultMemberId === member.id && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Par défaut
                </span>
              )}
              {member.id !== 'main' && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddMember();
              }
            }}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nom du membre"
          />
          <button
            type="button"
            onClick={handleAddMember}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter
          </button>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Passer cette étape
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Suivant
          </button>
        </div>
      </form>
    </div>
  );
}
