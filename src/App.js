import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Buddy',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna'
];

const clickSfx = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); 

const playSound = (audio) => {
  audio.currentTime = 0;
  audio.volume = 0.4;
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
      const { index, savedScore, savedTime, savedQuestions, savedAvatar, savedUserAnswers } = JSON.parse(saved);
      setQuestions(savedQuestions);
      setCurrentIndex(index);
      setScore(savedScore);
      setTimer(savedTime);
      setAvatar(savedAvatar || AVATARS[0]);
      setUserAnswers(savedUserAnswers || []);
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
            index: currentIndex, 
            savedScore: score, 
            savedTime: newTime, 
            savedQuestions: questions, 
            savedAvatar: avatar,
            savedUserAnswers: userAnswers
          }));
          return newTime;
        });
      }, 1000);
    } else if (timer === 0 && isStarted) setShowResult(true);
    return () => clearInterval(interval);
  }, [isStarted, timer, showResult, currentIndex, score, questions, avatar, userAnswers]);

  const handleAnswer = (selectedAns, isCorrect) => {
    playSound(clickSfx); 

    const newAnswer = {
      question: questions[currentIndex].question,
      selected: selectedAns,
      correct: questions[currentIndex].correct_answer,
      isCorrect: isCorrect
    };
    setUserAnswers([...userAnswers, newAnswer]);

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

  // --- KOMPONEN LATAR BELAKANG ANIMASI ---
  const AnimatedBg = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#e0e7ff]">
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
          rotate: [0, 45, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-purple-300/40 rounded-full blur-[100px]"
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          x: [0, -60, 0],
          y: [0, -40, 0],
          rotate: [0, -45, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-20 -right-20 w-[600px] h-[600px] bg-indigo-300/30 rounded-full blur-[100px]"
      />
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-pink-200/20 rounded-full blur-[80px]"
      />
    </div>
  );

  if (!user || !isStarted) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6 font-sans">
        <AnimatedBg />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-lg rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl text-center border border-white">
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
            <input name="username" className="w-full bg-white/50 p-4 rounded-2xl mb-4 outline-none border-2 border-transparent focus:border-[#6d5dfc] font-bold" placeholder="Siapa namamu?" required />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-[#6d5dfc] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#6d5dfc]/30 uppercase tracking-widest">Ayo Mulai!</motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (showResult) {
    const isWin = score >= 5;
    const resultMessage = isWin ? "Keren Banget! 🔥" : "Gapapa, kamu bisa coba lagi! ✨";

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`min-h-screen py-10 flex flex-col items-center p-4 ${isWin ? 'bg-gradient-to-br from-[#FFD93D] via-[#FF8400] to-[#FF449F]' : 'bg-gradient-to-br from-[#2D31FA] to-[#9092FF]'}`}>
        
        <motion.div initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white/10 backdrop-blur-3xl border-2 border-white/40 rounded-[3.5rem] p-10 w-full max-w-2xl text-center shadow-2xl mb-8 relative overflow-hidden">
          <motion.img 
            animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            src={avatar} 
            className="w-32 h-32 bg-white rounded-full mx-auto mb-6 shadow-xl border-4 border-white" 
            alt="user avatar" 
          />
          
          <h2 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">{resultMessage}</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-8 mt-6">
            <div className="bg-white/20 p-4 rounded-2xl text-white"><p className="text-[10px] font-bold uppercase opacity-60">Soal</p><p className="text-2xl font-black">{currentIndex}</p></div>
            <div className="bg-white p-4 rounded-2xl text-[#FF8400] shadow-xl"><p className="text-[10px] font-bold uppercase opacity-60">Skor</p><p className="text-2xl font-black">{score}</p></div>
            <div className="bg-white/20 p-4 rounded-2xl text-white"><p className="text-[10px] font-bold uppercase opacity-60">Salah</p><p className="text-2xl font-black">{currentIndex - score}</p></div>
          </div>

          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-white text-[#FF449F] font-black px-10 py-4 rounded-3xl shadow-lg uppercase tracking-widest hover:scale-105 transition-all mb-4">Main Lagi</button>
        </motion.div>

        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-[2.5rem] p-8 shadow-xl">
          <h3 className="text-2xl font-black text-gray-800 mb-6 text-center">Riwayat Soal 📝</h3>
          <div className="space-y-4">
            {userAnswers.map((item, idx) => (
              <div key={idx} className={`p-5 rounded-3xl border-2 ${item.isCorrect ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                <p className="font-bold text-gray-800 mb-2" dangerouslySetInnerHTML={{ __html: `${idx + 1}. ${item.question}` }} />
                <div className="text-sm">
                  <p className={`${item.isCorrect ? 'text-green-600' : 'text-red-600'} font-bold`}>
                    Kamu: <span dangerouslySetInnerHTML={{ __html: item.selected }} /> {item.isCorrect ? '✅' : '❌'}
                  </p>
                  {!item.isCorrect && (
                    <p className="text-green-600 font-bold mt-1">
                      Benar: <span dangerouslySetInnerHTML={{ __html: item.correct }} />
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </motion.div>
    );
  }

  const currentQ = questions[currentIndex];
  const options = [...currentQ.incorrect_answers, currentQ.correct_answer].sort();

  return (
    <div className="min-h-screen relative flex flex-col items-center py-12 px-4">
      <AnimatedBg />
      
      <div className="w-full max-w-4xl bg-white/80 backdrop-blur-xl rounded-[3.5rem] p-12 shadow-2xl border border-white relative overflow-hidden">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4 bg-white/50 pr-6 rounded-full py-1 border border-white">
            <img src={avatar} className="w-16 h-16 bg-white rounded-2xl p-2 border-2 border-gray-50 shadow-sm" alt="avatar" />
            <span className="font-black text-gray-800 uppercase tracking-tighter">{user}</span>
          </div>
          <motion.div animate={timer < 10 ? { scale: [1, 1.1, 1], color: '#ff4444' } : {}} transition={{ repeat: Infinity }} className="bg-gray-900 text-white px-8 py-3 rounded-[1.5rem] font-black text-2xl tracking-tighter italic shadow-lg">
            {timer}s
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentIndex} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ duration: 0.4 }}>
            <div className="mb-12 text-center">
              <div className="w-full bg-gray-100 h-6 rounded-full mb-10 overflow-hidden border-4 border-white shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${((currentIndex+1)/questions.length)*100}%` }} className="bg-gradient-to-r from-[#6d5dfc] to-[#9092FF] h-full rounded-full"></motion.div>
              </div>
              <h3 className="text-3xl font-black text-gray-800 leading-snug px-4" dangerouslySetInnerHTML={{ __html: currentQ.question }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {options.map((ans, i) => (
                <motion.button 
                  whileHover={{ y: -8, shadow: "0 20px 40px rgba(109, 93, 252, 0.15)" }} whileTap={{ scale: 0.95 }}
                  key={i} onClick={() => handleAnswer(ans, ans === currentQ.correct_answer)}
                  className="group bg-white/70 backdrop-blur-sm border-4 border-white/50 p-8 rounded-[2.5rem] text-left hover:border-[#6d5dfc] transition-all flex items-center gap-5 shadow-sm"
                >
                  <span className="w-14 h-14 flex items-center justify-center bg-gray-50 rounded-2xl font-black text-[#6d5dfc] group-hover:bg-[#6d5dfc] group-hover:text-white transition-colors text-xl">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-bold text-gray-700 text-lg flex-1" dangerouslySetInnerHTML={{ __html: ans }} />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="mt-10 text-indigo-900 font-black italic tracking-[0.3em] text-[10px] uppercase text-center opacity-60">Putri Olivia • Frontend Developer Portfolio</p>
    </div>
  );
};

export default App;