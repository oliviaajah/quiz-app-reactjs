import React, { useState, useEffect } from 'react';

const App = () => {
  const [user, setUser] = useState(localStorage.getItem('quiz_user') || '');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isStarted, setIsStarted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
      const data = await response.json();
      setQuestions(data.results);
      setIsStarted(true);
    } catch (error) {
      alert("Koneksi bermasalah. Pastikan internetmu aktif!");
    }
  };

  useEffect(() => {
    const savedProgress = localStorage.getItem('quiz_progress');
    if (savedProgress && user) {
      const { index, savedScore, savedTime, savedQuestions } = JSON.parse(savedProgress);
      setQuestions(savedQuestions);
      setCurrentIndex(index);
      setScore(savedScore);
      setTimer(savedTime);
      setIsStarted(true);
    }
  }, [user]);

  useEffect(() => {
    let interval;
    if (isStarted && timer > 0 && !showResult) {
      interval = setInterval(() => {
        setTimer((prev) => {
          const newTime = prev - 1;
          localStorage.setItem('quiz_progress', JSON.stringify({
            index: currentIndex, savedScore: score, savedTime: newTime, savedQuestions: questions
          }));
          return newTime;
        });
      }, 1000);
    } else if (timer === 0 && isStarted) {
      setShowResult(true);
      localStorage.removeItem('quiz_progress');
    }
    return () => clearInterval(interval);
  }, [isStarted, timer, showResult, currentIndex, score, questions]);

  const handleAnswer = (ans, isCorrect) => {
    setSelectedAnswer(ans);
    
    // Delay sedikit agar user bisa melihat pilihan yang ia klik (UX Feedback)
    setTimeout(() => {
      const nextScore = isCorrect ? score + 1 : score;
      const nextIndex = currentIndex + 1;
      setScore(nextScore);
      setSelectedAnswer(null);

      if (nextIndex < questions.length) {
        setCurrentIndex(nextIndex);
      } else {
        setShowResult(true);
        localStorage.removeItem('quiz_progress');
      }
    }, 400);
  };

  // 1. Tampilan Login yang Elegan
  if (!user || !isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl text-white">🚀</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">QUIZ MASTER</h1>
          <p className="text-indigo-100 mb-8 font-medium">Siap untuk tantangan hari ini?</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const name = e.target.username.value;
            setUser(name);
            localStorage.setItem('quiz_user', name);
            fetchQuestions();
          }}>
            <input 
              name="username" 
              className="w-full bg-white/10 border border-white/30 p-4 rounded-xl mb-4 text-white placeholder-indigo-200 outline-none focus:ring-2 focus:ring-white/50 transition"
              placeholder="Masukkan namamu..." 
              required 
            />
            <button className="w-full bg-white text-indigo-600 font-bold py-4 rounded-xl hover:bg-indigo-50 transform hover:-translate-y-1 transition-all shadow-xl">
              MULAI SEKARANG
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Tampilan Hasil (Scoreboard)
  if (showResult) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-lg text-center border border-slate-700">
          <h2 className="text-3xl font-bold text-white mb-6">Quiz Selesai! ✨</h2>
          <div className="relative inline-block mb-8">
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              {Math.round((score / questions.length) * 100)}%
            </div>
            <p className="text-slate-400 font-medium">Skor Kamu</p>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-10 text-center">
            <div className="bg-slate-700/50 p-4 rounded-2xl"><p className="text-xs text-slate-400 uppercase">Soal</p><p className="text-xl font-bold text-white">{questions.length}</p></div>
            <div className="bg-slate-700/50 p-4 rounded-2xl"><p className="text-xs text-slate-400 uppercase">Dijawab</p><p className="text-xl font-bold text-cyan-400">{currentIndex}</p></div>
            <div className="bg-slate-700/50 p-4 rounded-2xl"><p className="text-xs text-slate-400 uppercase">Benar</p><p className="text-xl font-bold text-green-400">{score}</p></div>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-2xl font-bold hover:opacity-90 transition shadow-lg shadow-cyan-500/20"
          >
            MAINKAN LAGI
          </button>
        </div>
      </div>
    );
  }

  // 3. Tampilan Utama Kuis
  const currentQ = questions[currentIndex];
  const options = [...currentQ.incorrect_answers, currentQ.correct_answer].sort();
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 font-sans text-slate-800">
      <div className="w-full max-w-3xl">
        {/* Header Stats */}
        <div className="flex justify-between items-end mb-4 px-2">
          <div>
            <h4 className="text-slate-400 font-bold text-xs uppercase tracking-widest">Pemain</h4>
            <p className="text-lg font-bold text-slate-800">👋 {user}</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-black ${timer < 10 ? 'text-red-500 animate-bounce' : 'text-indigo-600'}`}>
              00:{timer < 10 ? `0${timer}` : timer}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase">Sisa Waktu</p>
          </div>
        </div>

        {/* Progress Bar Modern */}
        <div className="w-full bg-slate-200 h-3 rounded-full mb-10 overflow-hidden flex">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
        </div>

        {/* Question Card */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
          <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-xs font-black uppercase mb-6 inline-block">
            Pertanyaan {currentIndex + 1} dari {questions.length}
          </span>
          <h3 className="text-2xl font-bold text-slate-800 mb-10 leading-snug" dangerouslySetInnerHTML={{ __html: currentQ.question }} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((ans, i) => (
              <button 
                key={i} 
                onClick={() => handleAnswer(ans, ans === currentQ.correct_answer)}
                className={`group flex items-center p-5 rounded-2xl border-2 transition-all duration-200 text-left
                  ${selectedAnswer === ans ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}
                `}
              >
                <span className={`w-10 h-10 flex items-center justify-center rounded-xl mr-4 font-black transition-colors
                  ${selectedAnswer === ans ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500'}
                `}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="font-semibold flex-1" dangerouslySetInnerHTML={{ __html: ans }} />
              </button>
            ))}
          </div>
        </div>
        
        <p className="mt-12 text-center text-slate-400 text-sm font-medium tracking-wide">
          DESIGNED BY <span className="text-indigo-500 font-bold">PUTRI OLIVIA</span> • FRONTEND DEV 2026
        </p>
      </div>
    </div>
  );
};

export default App;