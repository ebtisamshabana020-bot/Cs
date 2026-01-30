
import React, { useState } from 'react';
import { Group, User, Question } from '../types';
import { supabase } from './services/supabaseClient';

interface ExamCreatorProps {
  group: Group;
  user: User;
  onBack: () => void;
}

const ExamCreator: React.FC<ExamCreatorProps> = ({ group, user, onBack }) => {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQText, setNewQText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState(0);
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    if (!newQText.trim()) {
        alert("يرجى كتابة نص السؤال أولاً.");
        return;
    }
    
    // Filter out completely empty options but keep the rest
    const filledOptions = options.map(o => o.trim());
    if (filledOptions.filter(o => o !== '').length < 2) {
        alert("يرجى كتابة خيارين على الأقل للسؤال.");
        return;
    }
    
    const q: Question = {
      id: Math.random().toString(36).substr(2, 9),
      text: newQText,
      options: filledOptions,
      correctAnswer: correct,
      type: 'MCQ'
    };
    
    setQuestions([...questions, q]);
    setNewQText('');
    setOptions(['', '', '', '']);
    setCorrect(0);
    alert("تم إضافة السؤال للقائمة بنجاح ✅");
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("يرجى إدخال عنوان للاختبار.");
      return;
    }
    if (questions.length === 0) {
      alert("لا يمكن نشر اختبار بدون أسئلة. أضف سؤالاً واحداً على الأقل.");
      return;
    }

    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('exams')
        .insert([{
          group_id: group.id,
          title: title,
          questions: questions,
          creator_id: user.id
        }]);

      if (error) throw error;

      alert("🎉 تم نشر الاختبار بنجاح في المجموعة!");
      onBack();
    } catch (err: any) {
      console.error(err);
      alert("فشل حفظ الاختبار: " + (err.message || "خطأ غير معروف"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 text-right" dir="rtl">
      <div className="flex items-center justify-between flex-row-reverse mb-4">
        <div className="text-right">
           <h2 className="text-3xl font-black text-slate-900">إنشاء اختبار جديد</h2>
           <p className="text-slate-500 text-sm">أنت الآن تقوم بإعداد اختبار لمجموعة: <span className="text-indigo-600 font-bold">{group.name}</span></p>
        </div>
        <button onClick={onBack} className="text-slate-400 font-bold hover:text-indigo-600 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm transition-all flex items-center gap-2">
           <span>&larr;</span> العودة للرئيسية
        </button>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <label className="block text-sm font-black text-slate-700 mb-3">عنوان الاختبار (مثال: اختبار الكيمياء الشهري)</label>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold" 
          placeholder="أدخل عنواناً واضحاً للاختبار..."
        />
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-full bg-indigo-600"></div>
        <h3 className="font-black text-xl mb-6 flex items-center gap-2">
          <span>📝</span> إضافة سؤال جديد
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">نص السؤال</label>
            <textarea 
              value={newQText}
              onChange={(e) => setNewQText(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 h-28 font-bold leading-relaxed" 
              placeholder="اكتب السؤال هنا..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((opt, i) => (
              <div key={i} className={`flex gap-3 items-center p-3 rounded-2xl transition-all border-2 ${correct === i ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-50 bg-slate-50'}`}>
                <input 
                  type="radio" 
                  checked={correct === i} 
                  onChange={() => setCorrect(i)}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                  name="correct" 
                />
                <input 
                  type="text" 
                  value={opt} 
                  onChange={(e) => {
                    const n = [...options];
                    n[i] = e.target.value;
                    setOptions(n);
                  }}
                  className="flex-1 bg-transparent outline-none font-bold text-sm" 
                  placeholder={`الخيار ${i+1} (يمكن تركه فارغاً)`}
                />
              </div>
            ))}
          </div>
          
          <button 
            onClick={addQuestion} 
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
          >
            <span>➕</span> إضافة هذا السؤال للقائمة
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
          <span>📋</span> الأسئلة المضافة حالياً ({questions.length})
        </h3>
        {questions.length === 0 && (
          <div className="py-10 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">لا توجد أسئلة في القائمة بعد.</p>
          </div>
        )}
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex justify-between items-center group animate-in slide-in-from-right duration-300">
            <div>
              <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">السؤال {idx + 1}</span>
              <p className="font-bold text-slate-800 mt-1">{q.text}</p>
            </div>
            <button 
              onClick={() => setQuestions(questions.filter(qu => qu.id !== q.id))} 
              className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        ))}
      </div>

      <div className="pt-10">
        <button 
          onClick={handleSave} 
          disabled={saving || questions.length === 0} 
          className={`w-full py-5 rounded-[2rem] font-black text-xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3
            ${(saving || questions.length === 0) ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'}
          `}
        >
          {saving ? 'جاري النشر...' : '🚀 نشر الاختبار الآن'}
        </button>
      </div>
    </div>
  );
};

export default ExamCreator;
