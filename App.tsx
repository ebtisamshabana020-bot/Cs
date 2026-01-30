
import React, { useState, useEffect } from 'react';
import { AppView, User, UserRole, Group, Exam } from './types';
import { supabase } from './components/services/supabaseClient';
import Login from './components/Login';
import { Register } from './components/Register';
import Dashboard from './components/Dashboard';
import GroupsList from './components/GroupsList';
import AdminPanel from './components/AdminPanel';
import ExamCreator from './components/ExamCreator';
import QuizTaker from './components/QuizTaker';
import ProfileEditor from './components/ProfileEditor';
// Added ImageEditor import to resolve component reference error
import ImageEditor from './components/ImageEditor';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profile) {
          setCurrentUser({
            id: session.user.id,
            username: profile.username,
            role: profile.role as UserRole,
            avatar: profile.avatar_url,
            isVerified: profile.is_verified,
            joinedGroups: []
          });
          setView(AppView.DASHBOARD);
        }
      }
      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setCurrentUser(null);
        setView(AppView.LOGIN);
      } else if (event === 'SIGNED_IN' && session) {
         checkSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGroupAction = async (g: Group, manageMode: boolean = false) => {
    setSelectedGroup(g);
    
    if (manageMode) {
        setView(AppView.EXAM_CREATOR);
        return;
    }

    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('group_id', g.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setActiveExam({
          id: data.id,
          groupId: data.group_id,
          title: data.title,
          questions: data.questions,
          creatorId: data.creator_id
        });
        setView(AppView.EXAM_TAKER);
        return;
      }
    } catch (err) { 
      console.error("Fetch exam error:", err); 
    }

    const FALLBACK_ID = `fallback_${g.id}`;
    setActiveExam({
      id: FALLBACK_ID,
      groupId: g.id,
      title: `${g.name} - اختبار افتراضي`,
      creatorId: g.creatorId,
      questions: [
        { id: 'q1', text: 'هل يدعم هذا النظام التشفير التام (E2EE)؟', options: ['نعم، جميع الرسائل مشفرة', 'لا، الرسائل نصية عادية'], correctAnswer: 0, type: 'MCQ' }
      ]
    });
    setView(AppView.EXAM_TAKER);
  };

  const renderContent = () => {
    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">تحميل البوابة...</div>;

    if (!currentUser) {
      if (view === AppView.REGISTER) return <Register onBack={() => setView(AppView.LOGIN)} onRegister={(u) => {setCurrentUser(u); setView(AppView.DASHBOARD);}} />;
      return <Login onLogin={(u) => {setCurrentUser(u); setView(AppView.DASHBOARD);}} onGoToRegister={() => setView(AppView.REGISTER)} />;
    }

    switch (view) {
      case AppView.DASHBOARD:
        return <Dashboard user={currentUser} onNavigate={setView} onOpenGroup={() => {}} />;
      case AppView.GROUPS:
        return <GroupsList user={currentUser} onBack={() => setView(AppView.DASHBOARD)} onJoinGroup={handleGroupAction} />;
      case AppView.ADMIN_PANEL:
        return <AdminPanel onBack={() => setView(AppView.DASHBOARD)} />;
      case AppView.EXAM_CREATOR:
        return <ExamCreator group={selectedGroup!} user={currentUser} onBack={() => setView(AppView.DASHBOARD)} />;
      case AppView.EXAM_TAKER:
        return <QuizTaker exam={activeExam!} user={currentUser} onBack={() => setView(AppView.DASHBOARD)} />;
      case AppView.PROFILE:
          return <ProfileEditor user={currentUser} onBack={() => setView(AppView.DASHBOARD)} onUpdate={setCurrentUser} />;
      // Added case to render ImageEditor component when AppView is IMAGE_EDITOR
      case AppView.IMAGE_EDITOR:
          return <ImageEditor onBack={() => setView(AppView.DASHBOARD)} />;
      default:
        return <Dashboard user={currentUser} onNavigate={setView} onOpenGroup={() => {}} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {currentUser && (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 h-16 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(AppView.DASHBOARD)}>
            <div className="bg-indigo-600 p-2 rounded-lg text-white font-bold shadow-indigo-100 shadow-lg">SG</div>
            <span className="font-bold text-xl tracking-tight text-indigo-900 hidden md:block">StudyGenius</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div 
              onClick={() => setView(AppView.PROFILE)}
              className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 cursor-pointer hover:bg-slate-100 transition-all"
            >
              <div className="relative">
                <img src={currentUser.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + currentUser.username} className="w-8 h-8 rounded-full border border-slate-200" alt="avatar" />
                {currentUser.isVerified && (
                  <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">✓</span>
                )}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold leading-none">{currentUser.username}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{currentUser.role}</span>
              </div>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="تسجيل الخروج">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </button>
          </div>
        </nav>
      )}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
