import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Buddy',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna'
];

// --- UPDATE SUARA: Tambah Bunyi Tetot ---
const correctSfx = new Audio('https://assets.mixkit.co/active_storage/sfx/600/600-preview.mp3'); 
const clickSfx = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); 
const failSfx = new Audio('https://www.myinstants.com/media/sounds/tetot-indonesia.mp3'); // Bunyi "Tetot"

const playSound = (audio) => {
  audio.currentTime = 0;
  audio.volume = 0.4; // Volume sedang agar nyaman
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

  const fetchQuestions = async () => {
    try {
      const response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
      const data = await response.json();
      setQuestions(data.results);
      setIsStarted(true);
    } catch (error) {
      alert("Koneksi terputus!");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('quiz_progress');
    if (saved && user) {
      const { index, savedScore, savedTime, savedQuestions, savedAvatar } = JSON.parse(saved);
      setQuestions(savedQuestions);
      setCurrentIndex(index);
      setScore(savedScore);
      setTimer(savedTime);
      setAvatar(savedAvatar || AVATARS[0]);
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
            index: currentIndex, savedScore: score, savedTime: newTime, savedQuestions: questions, savedAvatar: avatar
          }));
          return newTime;
        });
      }, 1000);
    } else if (timer === 0 && isStarted) setShowResult(true);
    return () => clearInterval(interval);
  }, [isStarted, timer, showResult, currentIndex, score, questions, avatar]);

  const handleAnswer = (isCorrect) => {
    playSound(clickSfx); 
    if (isCorrect) {
      playSound(correctSfx);
    } else {
      playSound(failSfx); // Ini bunyi tetot-nya
    }

    const nextScore = isCorrect ? score + 1 : score;
    const nextIndex = currentIndex + 1;
    setScore(nextScore);

    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
    } else {
      setShowResult(true);
      localStorage.removeItem('quiz_progress');
    }
  };

  if (!user || !isStarted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#6d5dfc] flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl text-center">
          <h1 className="text-3xl font-black text-[#2d2d2d] mb-2 font-mono tracking-tighter">QUIZ MASTER</h1>
          <p className="text-gray-400 mb-8 font-bold uppercase tracking-widest text-[10px]">Pilih Avatar Favoritmu</p>
          <div className="flex justify-center gap-4 mb-8">
            {AVATARS.map((src, i) => (
              <motion.img 
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                key={i} src={src} className={`w-16 h-16 rounded-2xl cursor-pointer transition-all border-4 ${avatar === src ? 'border-[#6d5dfc] bg-indigo-50 shadow-lg' : 'border-transparent opacity-30'}`}
                onClick={() => { playSound(clickSfx); setAvatar(src); }}
              />
            ))}
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const name = e.target.username.value;
            setUser(name);
            localStorage.setItem('quiz_user', name);
            localStorage.setItem('quiz_avatar', avatar);
            fetchQuestions();
          }}>
            <input name="username" className="w-full bg-gray-100 p-4 rounded-2xl mb-4 outline-none border-2 border-transparent focus:border-[#6d5dfc] font-bold" placeholder="Siapa namamu?" required />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-[#6d5dfc] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#6d5dfc]/30 uppercase tracking-widest">Ayo Mulai!</motion.button>
          </form>
        </div>
      </motion.div>
    );
  }

  if (showResult) {
    const isWin = score >= 5;
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className={`min-h-screen flex items-center justify-center p-4 ${isWin ? 'bg-gradient-to-br from-[#FFD93D] via-[#FF8400] to-[#FF449F]' : 'bg-gradient-to-br from-[#2D31FA] to-[#9092FF]'}`}
      >
        <motion.div 
          initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-3xl border-2 border-white/40 rounded-[3.5rem] p-12 w-full max-w-2xl text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-4 left-4 text-5xl opacity-20">🌈</div>
          <div className="absolute bottom-4 right-4 text-5xl opacity-20">🚀</div>

          <motion.img 
            animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}
            src={avatar} className="w-32 h-32 bg-white rounded-[2rem] mx-auto mb-6 border-8 border-white/50 shadow-xl" alt="avatar" 
          />
          
          <h2 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase italic">
            {isWin ? "MANTAP JIWA!" : "KEREN BANGET!"}
          </h2>
          <p className="text-white/80 font-bold mb-10 tracking-widest text-sm uppercase">Hasil akhir kamu, {user}!</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-white/20 p-6 rounded-3xl text-white border border-white/10">
                <p className="text-[10px] font-black uppercase opacity-60">Soal</p>
                <p className="text-3xl font-black">{currentIndex}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl text-[#FF8400] shadow-2xl scale-110">
                <p className="text-[10px] font-black uppercase opacity-60">Skor</p>
                <p className="text-5xl font-black">{score}</p>
            </div>
            <div className="bg-white/20 p-6 rounded-3xl text-white border border-white/10">
                <p className="text-[10px] font-black uppercase opacity-60">Salah</p>
                <p className="text-3xl font-black">{currentIndex - score}</p>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { localStorage.clear(); window.location.reload(); }} 
            className="bg-white text-[#FF449F] font-black px-12 py-5 rounded-3xl text-xl shadow-xl uppercase tracking-widest active:scale-95 transition-all"
          >
            Main Lagi?
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  const currentQ = questions[currentIndex];
  const options = [...currentQ.incorrect_answers, currentQ.correct_answer].sort();

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-4xl bg-white rounded-[3.5rem] p-12 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4 bg-gray-50 pr-6 rounded-full py-1">
            <img src={avatar} className="w-16 h-16 bg-white rounded-2xl p-2 border-2 border-gray-50 shadow-sm" alt="avatar" />
            <span className="font-black text-gray-800 uppercase tracking-tighter">{user}</span>
          </div>
          <motion.div animate={timer < 10 ? { scale: [1, 1.1, 1], color: '#ff4444' } : {}} transition={{ repeat: Infinity }} className="bg-gray-900 text-white px-8 py-3 rounded-[1.5rem] font-black text-2xl tracking-tighter italic">
            {timer}s
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentIndex} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ duration: 0.4 }}>
            <div className="mb-12 text-center">
              <div className="w-full bg-gray-100 h-5 rounded-full mb-10 overflow-hidden border-4 border-white shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${((currentIndex+1)/questions.length)*100}%` }} className="bg-gradient-to-r from-[#6d5dfc] to-[#9092FF] h-full rounded-full"></motion.div>
              </div>
              <h3 className="text-3xl font-black text-gray-800 leading-snug px-4" dangerouslySetInnerHTML={{ __html: currentQ.question }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {options.map((ans, i) => (
                <motion.button 
                  whileHover={{ y: -5, shadow: "0 10px 30px rgba(109, 93, 252, 0.2)" }} whileTap={{ scale: 0.98 }}
                  key={i} onClick={() => handleAnswer(ans === currentQ.correct_answer)}
                  className="group bg-white border-4 border-gray-50 p-7 rounded-[2.5rem] text-left hover:border-[#6d5dfc] transition-all flex items-center gap-5 shadow-sm"
                >
                  <span className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-2xl font-black text-[#6d5dfc] group-hover:bg-[#6d5dfc] group-hover:text-white transition-colors">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-bold text-gray-700 text-lg flex-1" dangerouslySetInnerHTML={{ __html: ans }} />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="mt-10 text-gray-400 font-black italic tracking-[0.3em] text-[10px] uppercase text-center opacity-50">Putri Olivia • Frontend Developer Portfolio</p>
    </div>
  );
};

export default App;