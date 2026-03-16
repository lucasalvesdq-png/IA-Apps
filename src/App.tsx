import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  BookOpen, 
  Trophy, 
  History, 
  Play, 
  Send, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ChevronRight,
  Timer,
  LayoutDashboard,
  MessageSquare,
  GraduationCap,
  Plus,
  Trash2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { UserProfile, Subject, Message, KnowledgeLevel, StudySession, ExamQuestion, Exercise } from './types';
import { generateTutorResponse, generateSimulatedExam } from './services/gemini';

// --- Components ---

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-100 p-6", className)}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  disabled,
  loading
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost',
  className?: string,
  disabled?: boolean,
  loading?: boolean
}) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 shadow-slate-200",
    outline: "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "px-6 py-3 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2",
        variants[variant],
        className
      )}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  );
};

// --- Screens ---

export default function App() {
  const [screen, setScreen] = useState<'onboarding' | 'dashboard' | 'study' | 'exam'>('onboarding');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>('');

  useEffect(() => {
    const savedUser = localStorage.getItem('edututor_user');
    const savedSessions = localStorage.getItem('edututor_sessions');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.onboarded) setScreen('dashboard');
    }
    if (savedSessions) setSessions(JSON.parse(savedSessions));
  }, []);

  const saveUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('edututor_user', JSON.stringify(updatedUser));
  };

  const addSession = (session: StudySession) => {
    const newSessions = [session, ...sessions];
    setSessions(newSessions);
    localStorage.setItem('edututor_sessions', JSON.stringify(newSessions));
    
    // Update subject progress
    if (user) {
      const newSubjects = user.subjects.map(s => {
        if (s.name === session.subject) {
          return { ...s, progress: Math.min(100, Math.round((s.progress + session.performance) / 2)) };
        }
        return s;
      });
      saveUser({ ...user, subjects: newSubjects });
    }
  };

  if (!user && screen !== 'onboarding') return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AnimatePresence mode="wait">
        {screen === 'onboarding' && (
          <OnboardingScreen key="onboarding" onComplete={(data) => {
            saveUser({ ...data, onboarded: true });
            setScreen('dashboard');
          }} />
        )}
        {screen === 'dashboard' && user && (
          <DashboardScreen 
            key="dashboard" 
            user={user} 
            sessions={sessions}
            onStartStudy={(subject) => {
              setActiveSubject(subject);
              setScreen('study');
            }}
            onStartExam={(subject) => {
              setActiveSubject(subject);
              setScreen('exam');
            }}
          />
        )}
        {screen === 'study' && user && (
          <StudySessionScreen 
            key="study" 
            user={user} 
            subject={activeSubject}
            onEnd={(session) => {
              addSession(session);
              setScreen('dashboard');
            }}
            onBack={() => setScreen('dashboard')}
          />
        )}
        {screen === 'exam' && user && (
          <SimulatedExamScreen 
            key="exam" 
            user={user} 
            subject={activeSubject}
            onEnd={(session) => {
              addSession(session);
              setScreen('dashboard');
            }}
            onBack={() => setScreen('dashboard')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function OnboardingScreen({ onComplete }: { onComplete: (data: UserProfile) => void }) {
  const [name, setName] = useState('');
  const [targetExam, setTargetExam] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');

  const addSubject = () => {
    if (newSubjectName.trim()) {
      setSubjects([...subjects, { name: newSubjectName.trim(), level: 'iniciante', progress: 0 }]);
      setNewSubjectName('');
    }
  };

  const updateLevel = (index: number, level: KnowledgeLevel) => {
    const newSubjects = [...subjects];
    newSubjects[index].level = level;
    setSubjects(newSubjects);
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const isValid = name && targetExam && subjects.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto w-full p-6 py-12"
    >
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
          <GraduationCap className="text-white w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Bem-vindo ao EduTutor AI</h1>
        <p className="text-slate-500 mt-2">Vamos personalizar sua jornada de estudos.</p>
      </div>

      <Card className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Seu Nome</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como quer ser chamado?"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Concurso ou Exame Alvo</label>
          <input 
            type="text" 
            value={targetExam}
            onChange={(e) => setTargetExam(e.target.value)}
            placeholder="Ex: ENEM, Concurso Banco do Brasil, OAB..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div className="space-y-4">
          <label className="text-sm font-semibold text-slate-700">Matérias Prioritárias</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSubject()}
              placeholder="Adicione uma matéria (ex: Português)"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            <Button onClick={addSubject} variant="secondary" className="px-4">
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-3">
            {subjects.map((subject, index) => (
              <div key={index} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-800">{subject.name}</span>
                  <button onClick={() => removeSubject(index)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  {(['iniciante', 'intermediário', 'avançado'] as KnowledgeLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => updateLevel(index, lvl)}
                      className={cn(
                        "flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all capitalize",
                        subject.level === lvl 
                          ? "bg-blue-600 text-white shadow-sm" 
                          : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={() => onComplete({ name, targetExam, subjects, onboarded: true })}
          disabled={!isValid}
          className="w-full py-4 mt-4"
        >
          Começar estudos
          <ArrowRight className="w-5 h-5" />
        </Button>
      </Card>
    </motion.div>
  );
}

function DashboardScreen({ 
  user, 
  sessions, 
  onStartStudy, 
  onStartExam 
}: { 
  user: UserProfile, 
  sessions: StudySession[],
  onStartStudy: (subject: string) => void,
  onStartExam: (subject: string) => void
}) {
  return (
    <div className="max-w-5xl mx-auto w-full p-6 py-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Olá, {user.name}! 👋</h1>
          <p className="text-slate-500">Foco total no {user.targetExam}.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="text-sm py-2 px-4">
            <User className="w-4 h-4" />
            Perfil
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Suas Matérias
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {user.subjects.map((subject, index) => (
              <div key={index} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800">{subject.name}</h3>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full capitalize">
                      {subject.level}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-400 group-hover:text-blue-600">
                    {subject.progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${subject.progress}%` }}
                    className="bg-blue-600 h-full rounded-full"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onStartStudy(subject.name)}
                    className="flex-1 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center justify-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Tutor
                  </button>
                  <button 
                    onClick={() => onStartExam(subject.name)}
                    className="flex-1 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all flex items-center justify-center gap-1"
                  >
                    <Trophy className="w-3 h-3" />
                    Simulado
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-blue-600" />
              Histórico
            </h2>
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4 italic">Nenhuma sessão realizada ainda.</p>
              ) : (
                sessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{session.subject}</p>
                      <p className="text-xs text-slate-500">{new Date(session.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600">{session.performance}%</p>
                      <p className="text-[10px] text-slate-400">{session.duration}min</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="bg-blue-600 text-white border-none shadow-blue-200">
            <h3 className="font-bold mb-2">Dica do Tutor 💡</h3>
            <p className="text-sm text-blue-100 leading-relaxed">
              Estudos intercalados aumentam a retenção em até 40%. Tente alternar entre {user.subjects[0]?.name} e {user.subjects[1]?.name || 'outras matérias'} hoje!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StudySessionScreen({ 
  user, 
  subject, 
  onEnd, 
  onBack 
}: { 
  user: UserProfile, 
  subject: string, 
  onEnd: (session: StudySession) => void,
  onBack: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Olá ${user.name}! Vamos começar nossa sessão de **${subject}**? Estou pronto para te ajudar a dominar os tópicos mais importantes para o ${user.targetExam}. O que você gostaria de revisar agora?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const parseExercise = (text: string): { cleanText: string, exercise?: Exercise } => {
    const startTag = '[EXERCISE_START]';
    const endTag = '[EXERCISE_END]';
    if (text.includes(startTag) && text.includes(endTag)) {
      const parts = text.split(startTag);
      const cleanText = parts[0].trim();
      const exerciseJson = parts[1].split(endTag)[0].trim();
      try {
        return { cleanText, exercise: JSON.parse(exerciseJson) };
      } catch (e) {
        return { cleanText: text };
      }
    }
    return { cleanText: text };
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await generateTutorResponse(user, [...messages, userMsg], subject);
      const { cleanText, exercise } = parseExercise(responseText);
      
      const modelMsg: Message = { 
        role: 'model', 
        text: cleanText,
        type: exercise ? 'exercise' : 'text',
        exercise
      };
      
      setMessages(prev => [...prev, modelMsg]);
      if (exercise) setTotalExercises(prev => prev + 1);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Ops, tive um probleminha. Pode repetir?" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseAnswer = (exercise: Exercise, answerIndex: number) => {
    const isCorrect = answerIndex === exercise.correctAnswer;
    if (isCorrect) setCorrectAnswers(prev => prev + 1);

    const feedbackMsg: Message = {
      role: 'model',
      text: isCorrect 
        ? `✅ **Correto!** ${exercise.explanation}` 
        : `❌ **Não foi dessa vez.** A resposta correta era a opção ${exercise.correctAnswer}. ${exercise.explanation}`
    };
    setMessages(prev => [...prev, feedbackMsg]);
  };

  const finishSession = () => {
    const duration = Math.round((Date.now() - sessionStartTime) / 60000);
    const performance = totalExercises > 0 ? Math.round((correctAnswers / totalExercises) * 100) : 100;
    onEnd({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      subject,
      performance,
      duration
    });
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-white md:shadow-xl md:my-4 md:rounded-3xl overflow-hidden border border-slate-100">
      <header className="p-4 border-bottom border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <XCircle className="w-6 h-6 text-slate-400" />
          </button>
          <div>
            <h2 className="font-bold text-slate-900">{subject}</h2>
            <p className="text-xs text-blue-600 font-medium">Sessão com Tutor AI</p>
          </div>
        </div>
        <Button onClick={finishSession} variant="secondary" className="py-2 px-4 text-sm">
          Encerrar
        </Button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] rounded-2xl p-4 shadow-sm",
              msg.role === 'user' 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
            )}>
              <div className="markdown-body text-sm">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
              
              {msg.exercise && (
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  <p className="font-bold text-slate-900 mb-3">{msg.exercise.question}</p>
                  {msg.exercise.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExerciseAnswer(msg.exercise!, idx)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-sm"
                    >
                      <span className="inline-block w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-center leading-6 mr-2 text-xs font-bold">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 rounded-tl-none flex gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tire sua dúvida ou peça um exercício..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <Button onClick={handleSend} loading={loading} className="px-4">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SimulatedExamScreen({ 
  user, 
  subject, 
  onEnd, 
  onBack 
}: { 
  user: UserProfile, 
  subject: string, 
  onEnd: (session: StudySession) => void,
  onBack: () => void
}) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const loadExam = async () => {
      const data = await generateSimulatedExam(user, subject);
      setQuestions(data);
      setLoading(false);
    };
    loadExam();
  }, []);

  useEffect(() => {
    if (loading || showResults) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowResults(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, showResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answerIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[currentIndex].userAnswer = answerIndex;
    setQuestions(newQuestions);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-bold text-slate-900">Gerando seu simulado...</h2>
        <p className="text-slate-500 mt-2">O Gemini está selecionando as melhores questões para você.</p>
      </div>
    );
  }

  if (showResults) {
    const correctCount = questions.filter(q => q.userAnswer === q.correctAnswer).length;
    const performance = Math.round((correctCount / questions.length) * 100);
    const duration = Math.round((Date.now() - startTime) / 60000);

    return (
      <div className="max-w-3xl mx-auto w-full p-6 py-12 space-y-8">
        <Card className="text-center py-10">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg",
            performance >= 70 ? "bg-emerald-500 shadow-emerald-100" : "bg-orange-500 shadow-orange-100"
          )}>
            {performance}%
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Resultado do Simulado</h2>
          <p className="text-slate-500 mt-2">Você acertou {correctCount} de {questions.length} questões.</p>
          <div className="flex justify-center gap-4 mt-8">
            <Button onClick={() => onEnd({ id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), subject, performance, duration })}>
              Voltar ao Dashboard
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <h3 className="text-lg font-bold">Revisão das Questões</h3>
          {questions.map((q, i) => (
            <Card key={i} className={cn(
              "border-l-4",
              q.userAnswer === q.correctAnswer ? "border-l-emerald-500" : "border-l-red-500"
            )}>
              <p className="font-bold text-slate-900 mb-4">{i + 1}. {q.question}</p>
              <div className="space-y-2 mb-4">
                {q.options.map((opt, idx) => (
                  <div key={idx} className={cn(
                    "p-3 rounded-xl text-sm border",
                    idx === q.correctAnswer ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-medium" : 
                    idx === q.userAnswer ? "bg-red-50 border-red-200 text-red-800" : "border-slate-100 text-slate-600"
                  )}>
                    {opt}
                  </div>
                ))}
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700">
                <p className="font-bold mb-1">Explicação:</p>
                {q.explanation}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto w-full p-6 py-8 flex flex-col h-screen">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-6 h-6" />
          </button>
          <h2 className="font-bold text-slate-900">Simulado: {subject}</h2>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-700 font-mono font-bold">
          <Timer className="w-4 h-4" />
          {formatTime(timeLeft)}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mb-6 flex justify-between items-center">
          <span className="text-sm font-bold text-blue-600">Questão {currentIndex + 1} de {questions.length}</span>
          <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>
        </div>

        <Card className="mb-8">
          <p className="text-lg font-medium text-slate-800 leading-relaxed">
            {currentQuestion.question}
          </p>
        </Card>

        <div className="space-y-3">
          {currentQuestion.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group flex items-center gap-4"
            >
              <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center font-bold transition-all">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1 text-slate-700 group-hover:text-blue-900 font-medium">{opt}</span>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
