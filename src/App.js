import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Buddy',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna'
];

// --- SOUND ASSETS ---
const clickSfx = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); 
// Suara Fanfare/Tada yang menandakan kuis selesai
const finishSfx = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'); 

const playSound = (audio, volume = 0.4) => {
  audio.currentTime = 0;
  audio.volume = volume;
  audio.play().catch(err => console.log("Audio play blocked", err));
};

const App = () => {
  const [user, setUser] = useState(localStorage.getItem('quiz_user') || '');
  const [avatar, setAvatar] = useState(localStorage.getItem('quiz_avatar') || AVATARS[0]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isStarted, setIsStarted] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [leaderboard, setLeaderboard] = useState(JSON.parse(localStorage.getItem('quiz_leaderboard')) || []);
  const [loading, setLoading] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setQuestions(data.results);
        setIsStarted(true);
      }
    } catch (error) {
      alert("Koneksi terputus!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (isStarted && timer > 0 && !showResult) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0 && isStarted) {
      handleFinish();
    }
    return () => clearInterval(interval);
  }, [isStarted, timer, showResult]);

  const handleAnswer = (selectedAns, isCorrect) => {
    playSound(clickSfx); 
    const newAnswer = {
      question: questions[currentIndex].question,
      selected: selectedAns,
      correct: questions[currentIndex].correct_answer,
      isCorrect: isCorrect
    };
    const updatedAnswers = [...userAnswers, newAnswer];
    setUserAnswers(updatedAnswers);

    const nextScore = isCorrect ? score + 1 : score;
    const nextIndex = currentIndex + 1;
    setScore(nextScore);

    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
    } else {
      handleFinish(nextScore, updatedAnswers);
    }
  };

  const handleFinish = (finalScore = score, finalAnswers = userAnswers) => {
    setShowResult(true);
    
    // --- TRIGGER SUARA KUIS SELESAI ---
    playSound(finishSfx, 0.6); 

    const newEntry = { 
      name: user, 
      avatar, 
      score: finalScore, 
      timeLeft: timer, 
      date: new Date().toLocaleDateString() 
    };
    const newLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => (b.score === a.score ? b.timeLeft - a.timeLeft : b.score - a.score))
      .slice(0, 5);
    setLeaderboard(newLeaderboard);
    localStorage.setItem('quiz_leaderboard', JSON.stringify(newLeaderboard));
  };

  const AnimatedBg = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#e0e7ff]">
      <motion.div animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0], rotate: [0, 45, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-purple-300/40 rounded-full blur-[100px]" />
      <motion.div animate={{ scale: [1.2, 1, 1.2], x: [0, -60, 0], y: [0, -40, 0], rotate: [0, -45, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -bottom-20 -right-20 w-[600px] h-[600px] bg-indigo-300/30 rounded-full blur-[100px]" />
    </div>
  );

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4">
      <AnimatedBg />
      
      <AnimatePresence mode="wait">
        {!isStarted && !showResult && (
          <motion.div key="login" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-[2.5rem] p-10 shadow-2xl text-center border border-white">
            <h1 className="text-3xl font-black text-[#2d2d2d] mb-2 font-mono tracking-tighter uppercase">Quiz Master</h1>
            <p className="text-gray-400 mb-8 font-bold uppercase tracking-widest text-[10px]">{loading ? "Memuat Soal..." : "Pilih Avatar & Mulai"}</p>
            {loading ? (
              <div className="flex justify-center py-10">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-[#6d5dfc] border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                <div className="flex justify-center gap-4 mb-8">
                  {AVATARS.map((src, i) => (
                    <motion.img whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} key={i} src={src} className={`w-16 h-16 rounded-2xl cursor-pointer transition-all border-4 ${avatar === src ? 'border-[#6d5dfc] bg-indigo-50 shadow-lg' : 'border-transparent opacity-30'}`} onClick={() => { playSound(clickSfx); setAvatar(src); }} />
                  ))}
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setUser(e.target.username.value);
                  fetchQuestions();
                }}>
                  <input name="username" defaultValue={user} className="w-full bg-white/50 p-4 rounded-2xl mb-4 outline-none border-2 border-transparent focus:border-[#6d5dfc] font-bold text-center" placeholder="Nama Kamu..." required />
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-[#6d5dfc] text-white font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest">Mulai Sekarang</motion.button>
                </form>
              </>
            )}
          </motion.div>
        )}

        {isStarted && !showResult && questions.length > 0 && (
          <motion.div key="quiz" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -50 }} className="w-full max-w-4xl bg-white/80 backdrop-blur-xl rounded-[3.5rem] p-10 shadow-2xl border border-white relative">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3 bg-white/50 pr-5 rounded-full py-1 border border-white">
                <img src={avatar} className="w-12 h-12 bg-white rounded-2xl p-1" alt="avatar" />
                <span className="font-black text-gray-800 uppercase text-sm">{user}</span>
              </div>
              <div className="bg-gray-900 text-white px-6 py-2 rounded-2xl font-black text-xl italic shadow-lg">{timer}s</div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={currentIndex} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.3 }}>
                <div className="mb-10 text-center">
                  <div className="w-full bg-gray-100 h-4 rounded-full mb-8 overflow-hidden border border-white shadow-inner">
                    <motion.div animate={{ width: `${((currentIndex+1)/questions.length)*100}%` }} className="bg-gradient-to-r from-[#6d5dfc] to-[#9092FF] h-full" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 px-4" dangerouslySetInnerHTML={{ __html: questions[currentIndex]?.question }} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...questions[currentIndex].incorrect_answers, questions[currentIndex].correct_answer].sort().map((ans, i) => (
                    <motion.button whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }} key={i} onClick={() => handleAnswer(ans, ans === questions[currentIndex].correct_answer)} className="bg-white/70 backdrop-blur-sm border-2 border-gray-100 p-6 rounded-[2rem] text-left hover:border-[#6d5dfc] transition-all flex items-center gap-4 shadow-sm">
                      <span className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl font-black text-[#6d5dfc] text-sm">{String.fromCharCode(65 + i)}</span>
                      <span className="font-bold text-gray-700 text-base" dangerouslySetInnerHTML={{ __html: ans }} />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {showResult && (
          <motion.div key="result" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl space-y-6">
            <div className={`rounded-[3rem] p-10 text-center shadow-2xl border-4 border-white ${score >= 5 ? 'bg-gradient-to-br from-[#FFD93D] to-[#FF449F]' : 'bg-gradient-to-br from-[#2D31FA] to-[#9092FF]'}`}>
              <motion.img animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} src={avatar} className="w-24 h-24 bg-white rounded-full mx-auto mb-4 border-4 border-white shadow-lg" />
              <h2 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">{score >= 5 ? "Keren Banget! 🔥" : "Coba Lagi Ya! ✨"}</h2>
              <div className="bg-white/20 inline-block px-8 py-2 rounded-full text-white font-black mb-6">SKOR AKHIR: {score}</div>
              <br />
              <button onClick={() => window.location.reload()} className="bg-white text-gray-900 font-black px-10 py-4 rounded-3xl uppercase tracking-widest hover:scale-105 transition-all">Main Lagi</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
              {/* Leaderboard & Review Sections remain same */}
              <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-8 shadow-xl border border-white">
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">🏆 Top 5 Leaderboard</h3>
                <div className="space-y-3">
                  {leaderboard.map((entry, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-3 rounded-2xl ${entry.name === user && entry.score === score ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-gray-400 w-5">{idx + 1}</span>
                        <img src={entry.avatar} className="w-10 h-10 bg-white rounded-lg p-1" alt="" />
                        <span className="font-bold text-gray-700 text-sm">{entry.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-indigo-600 leading-none">{entry.score}</p>
                        <p className="text-[8px] text-gray-400 mt-1">{entry.timeLeft}s left</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-8 shadow-xl max-h-[400px] overflow-y-auto border border-white">
                <h3 className="text-xl font-black text-gray-800 mb-6">📝 Review Jawaban</h3>
                <div className="space-y-4">
                  {userAnswers.map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border-2 ${item.isCorrect ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                      <p className="font-bold text-xs text-gray-800 mb-1" dangerouslySetInnerHTML={{ __html: item.question }} />
                      <p className={`text-[10px] font-black ${item.isCorrect ? 'text-green-600' : 'text-red-600'}`}>{item.isCorrect ? '✅ BENAR' : `❌ SALAH (Benar: ${item.correct})`}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="fixed bottom-4 text-indigo-900 font-black italic tracking-[0.3em] text-[10px] uppercase opacity-40">Putri Olivia • Frontend Developer Portfolio</p>
    </div>
  );
};

export default App;