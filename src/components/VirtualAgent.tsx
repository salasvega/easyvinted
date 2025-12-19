import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Check, Volume2, VolumeX, Minimize2, Maximize2 } from 'lucide-react';
import { Article } from '../types/article';
import { getStructuredCoachAdvice, Suggestion, generateSpeech } from '../lib/geminiService';

interface VirtualAgentProps {
  article: Partial<Article>;
  activePhoto?: string;
  onApplySuggestion?: (field: string, value: string | number) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestions?: Suggestion[];
}

interface Position {
  x: number;
  y: number;
}

const decode = (pcm: ArrayBuffer): Float32Array => {
  const view = new DataView(pcm);
  const samples = new Float32Array(pcm.byteLength / 2);

  for (let i = 0; i < samples.length; i++) {
    const int16 = view.getInt16(i * 2, true);
    samples[i] = int16 / 32768.0;
  }

  return samples;
};

const decodeAudioData = async (pcm: ArrayBuffer): Promise<AudioBuffer> => {
  const audioContext = new AudioContext({ sampleRate: 24000 });
  const samples = decode(pcm);
  const audioBuffer = audioContext.createBuffer(1, samples.length, 24000);

  audioBuffer.getChannelData(0).set(samples);

  return audioBuffer;
};

const VirtualAgent: React.FC<VirtualAgentProps> = ({ article, activePhoto, onApplySuggestion }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Bonjour ! Je suis Kelly votre coach de vente IA. Je peux analyser votre annonce et vous donner des conseils pour vendre plus rapidement. Cliquez sur 'Analyser l'annonce' quand vous êtes prêt(e) et activez le petit bouton du son si vous souhaitez écouter ma belle voix :)",
      timestamp: Date.now()
    }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    return () => {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !position) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setPosition({
        x: position.x + deltaX,
        y: position.y + deltaY
      });

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position, dragStart]);

  const speak = async (text: string) => {
    if (!voiceEnabled) return;

    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
    }

    try {
      setIsSpeaking(true);

      const cleanText = text.replace(/\*\*/g, '').replace(/\n/g, ' ');

      const pcmData = await generateSpeech(cleanText);
      const audioBuffer = await decodeAudioData(pcmData);

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      source.onended = () => {
        setIsSpeaking(false);
        audioSourceRef.current = null;
      };

      audioSourceRef.current = source;
      source.start(0);
    } catch (error) {
      console.error('Error playing speech:', error);
      setIsSpeaking(false);
    }
  };

  const toggleVoice = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);

    if (!newState) {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      setIsSpeaking(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: "Analyse mon annonce, Baby !", timestamp: Date.now() }]);

    try {
      const advice = await getStructuredCoachAdvice(article, activePhoto);
      const message = {
        role: 'assistant' as const,
        content: advice.generalAdvice,
        timestamp: Date.now(),
        suggestions: advice.suggestions
      };
      setMessages(prev => [...prev, message]);
      setHasAnalysis(true);

      speak(advice.generalAdvice);
    } catch (e) {
      const errorMessage = "Désolé, j'ai eu un souci technique. Réessayez ?";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage, timestamp: Date.now() }]);
      speak(errorMessage);
    }
    setLoading(false);
  };

  const handleApply = () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.suggestions && onApplySuggestion) {
      lastMessage.suggestions.forEach(suggestion => {
        if (isSuggestionApplied(suggestion)) {
          onApplySuggestion(suggestion.field, suggestion.suggestedValue);
        }
      });
    }
    handleClose();
  };

  const handleApplySuggestion = (suggestion: Suggestion) => {
    const suggestionKey = `${suggestion.field}-${suggestion.suggestedValue}`;
    setAppliedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionKey)) {
        newSet.delete(suggestionKey);
      } else {
        newSet.add(suggestionKey);
      }
      return newSet;
    });
  };

  const isSuggestionApplied = (suggestion: Suggestion) => {
    return appliedSuggestions.has(`${suggestion.field}-${suggestion.suggestedValue}`);
  };

  const handleClose = () => {
    setIsOpen(false);
    setHasAnalysis(false);
    setIsMinimized(false);
    setPosition(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.innerWidth < 640) return;

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });

    if (!position && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({ x: rect.left, y: rect.top });
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[70] bg-gray-900 text-white p-4 rounded-full shadow-xl hover:bg-gray-800 transition-all hover:scale-105 flex items-center gap-2 group"
      >
        <div className="relative">
          <Bot size={24} />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <span className="font-medium pr-1 group-hover:block hidden animate-in slide-in-from-right-2 duration-200">Ma Coach IA</span>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <button
        onClick={toggleMinimize}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[70] bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl hover:bg-gray-800 transition-all flex items-center gap-3 group animate-in slide-in-from-bottom-4 duration-300"
      >
        <div className="relative">
          <Bot size={20} />
          {hasAnalysis && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-fuchsia-500"></span>
            </span>
          )}
        </div>
        <div className="flex flex-col items-start">
          <span className="font-bold text-xs text-fuchsia-500">Kelly</span>
          <span className="text-[10px] text-gray-300">
            {hasAnalysis ? 'Analyse disponible' : 'Prête à analyser'}
          </span>
        </div>
        <Maximize2 size={16} className="text-gray-400" />
      </button>
    );
  }

  const positionStyle = position
    ? { position: 'fixed' as const, left: `${position.x}px`, top: `${position.y}px`, bottom: 'auto', right: 'auto' }
    : {};

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[70] w-[calc(100vw-2rem)] sm:w-96 h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300"
      style={positionStyle}
    >
      <div
        className="bg-black p-4 flex justify-between items-center text-white sm:cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3 pointer-events-none">
          <div className="bg-white/10 p-2 rounded-lg">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-fuchsia-500">Kelly</h3>
            <p className="text-[10px] text-gray-300 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-500'}`}></span>
              {isSpeaking ? 'Parle...' : 'En ligne'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleVoice}
            className={`p-2 rounded-lg transition-all ${
              voiceEnabled
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title={voiceEnabled ? 'Désactiver la voix' : 'Activer la voix'}
          >
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            onClick={toggleMinimize}
            className="sm:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title="Réduire"
          >
            <Minimize2 size={18} />
          </button>
          <button onClick={handleClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-gray-900 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}
            >
              <div className="flex items-start gap-2">
                {msg.role === 'assistant' && voiceEnabled && (
                  <button
                    onClick={() => speak(msg.content)}
                    className="flex-shrink-0 mt-0.5 p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Écouter ce message"
                  >
                    <Volume2 size={14} className="text-emerald-600" />
                  </button>
                )}
                <div className="flex-1 whitespace-pre-wrap font-sans">
                  {msg.content.split('**').map((part, i) =>
                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                  )}
                </div>
              </div>

              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-gray-200 pt-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Cochez les suggestions à appliquer :</p>
                  {msg.suggestions.map((suggestion, sidx) => {
                    const isApplied = isSuggestionApplied(suggestion);
                    const fieldLabels: Record<string, string> = {
                      title: 'Titre',
                      description: 'Description',
                      price: 'Prix',
                      brand: 'Marque',
                      size: 'Taille',
                      color: 'Couleur',
                      material: 'Matière',
                      condition: 'État'
                    };

                    return (
                      <div key={sidx} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => handleApplySuggestion(suggestion)}
                            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isApplied
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'border-gray-300 hover:border-emerald-500 hover:bg-emerald-50'
                            }`}
                          >
                            {isApplied && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 mb-1">
                              {fieldLabels[suggestion.field as keyof typeof fieldLabels] || suggestion.field}
                            </p>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {suggestion.reason}
                            </p>
                            <div className="bg-white rounded-lg p-2 border border-gray-200">
                              <p className="text-xs text-emerald-600 font-medium break-words">
                                {suggestion.suggestedValue}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <button
          onClick={hasAnalysis ? handleApply : handleAnalyze}
          disabled={loading || (hasAnalysis && appliedSuggestions.size === 0)}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <>Réflexion en cours...</>
          ) : hasAnalysis ? (
            <>
              <Check size={18} className="group-hover:scale-110 transition-transform" />
              {appliedSuggestions.size > 0
                ? `Appliquer (${appliedSuggestions.size} sélectionnée${appliedSuggestions.size > 1 ? 's' : ''})`
                : 'Sélectionnez des suggestions à appliquer'
              }
            </>
          ) : (
            <>
              <Sparkles size={18} className="group-hover:text-yellow-300 transition-colors" /> Analyser l'annonce
            </>
          )}
        </button>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          Kelly peut dire des trucs chelous. Vérifiez toujours ses conseils.
        </p>
      </div>
    </div>
  );
};

export default VirtualAgent;
