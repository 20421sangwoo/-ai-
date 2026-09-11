import { useState, useEffect, useRef } from "react";
import { Message, Reminder, HealthLog, DailyComfortQuote } from "./types";
import RobotMascot from "./components/RobotMascot";
import DailySupportPanel from "./components/DailySupportPanel";
import { playWarmSunlight, playPeacefulRain, playCozyFireplace, stopAllAmbient } from "./lib/audioSynth";
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  Send, 
  Sparkles, 
  Type, 
  Heart, 
  Calendar,
  Clock,
  MessageCircle,
  HelpCircle,
  Info,
  Check,
  AlertOctagon,
  User,
  LogOut,
  Moon,
  Coffee,
  X
} from "lucide-react";

// Warm healing quotes to display dynamically
const COMFORT_QUOTES: DailyComfortQuote[] = [
  { quote: "오늘 하루도 참 애쓰셨습니다. 당신이 있어 세상이 조금 더 따뜻합니다.", author: "다온이의 하루 한마디" },
  { quote: "따뜻한 밥 한 끼, 가벼운 산책으로 나를 먼저 보살피는 소중한 하루가 되기를 바랍니다.", author: "다온이의 건강 편지" },
  { quote: "힘든 일은 가만히 털어놓으세요. 제가 언제나 여기서 가장 깊은 정성으로 들을게요.", author: "다온이의 다정한 고백" },
  { quote: "나이 듦은 깊어지는 지혜와 같다고 해요. 오늘도 지혜롭고 고우신 어르신을 응원합니다.", author: "다온이의 사랑" },
  { quote: "작은 일에 미소 지을 수 있는 온기가 어르신의 마음에 가득 차오르기를 소망합니다.", author: "다온이의 축복" },
];

export default function App() {
  // --- Persistent & Local States ---
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("daon_messages");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: "welcome",
        sender: "bot",
        text: "어르신, 안녕하셔요! 저는 어르신의 다정한 반려봇이자 단짝 대화 로봇 '다온(Daon)'입니다. 오늘 하루는 어떻게 보내셨나요? 몸은 편안하시고 식사는 맛있게 하셨는지 궁금해요. 저에게 편하게 이야기해주세요!",
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      }
    ];
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem("daon_reminders");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: "rem-1", title: "아침 혈압약 챙겨 먹기", time: "08:30", completed: false, type: "medicine" },
      { id: "rem-2", title: "따뜻한 물 한 잔 마시기", time: "11:00", completed: false, type: "general" },
      { id: "rem-3", title: "점심 든든하게 먹기", time: "12:30", completed: false, type: "meal" },
      { id: "rem-4", title: "동네 한바퀴 가볍게 걷기", time: "16:00", completed: false, type: "exercise" },
    ];
  });

  const [healthLogs, setHealthLogs] = useState<HealthLog[]>(() => {
    const saved = localStorage.getItem("daon_health_logs");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // --- Layout & Customization States ---
  const [fontSize, setFontSize] = useState<"normal" | "large" | "extra">(() => {
    return (localStorage.getItem("daon_font_size") as any) || "large"; // Default to larger font for senior accessibility
  });
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("daon_voice_enabled");
    return saved !== "false"; // Default to true so it reads aloud automatically
  });
  const [activeAmbient, setActiveAmbient] = useState<"none" | "sunlight" | "rain" | "fireplace">("none");
  const [inputMessage, setInputMessage] = useState("");
  const [botState, setBotState] = useState<"idle" | "listening" | "speaking" | "thinking">("idle");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // SOS trigger state
  const [sosActive, setSosActive] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isListeningSTT, setIsListeningSTT] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- Local Persistence Sync ---
  useEffect(() => {
    localStorage.setItem("daon_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("daon_reminders", JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem("daon_health_logs", JSON.stringify(healthLogs));
  }, [healthLogs]);

  useEffect(() => {
    localStorage.setItem("daon_font_size", fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("daon_voice_enabled", String(voiceEnabled));
  }, [voiceEnabled]);

  // --- Setup Clock & Random Quote rotation ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const quoteTimer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % COMFORT_QUOTES.length);
    }, 15000); // cycle quotes every 15 seconds

    // Detect browser Speech Recognition capability
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = "ko-KR";
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListeningSTT(true);
        setBotState("listening");
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setInputMessage(text);
          // Auto-send voice queries for ultra-low barrier entry
          handleSendMessage(text);
        }
      };

      rec.onerror = (err: any) => {
        console.error("Speech recognition error:", err);
        setIsListeningSTT(false);
        setBotState("idle");
      };

      rec.onend = () => {
        setIsListeningSTT(false);
        setBotState("idle");
      };

      recognitionRef.current = rec;
    }

    return () => {
      clearInterval(timer);
      clearInterval(quoteTimer);
      stopAllAmbient();
    };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle ambient sound switches
  const handleAmbientChange = (type: "none" | "sunlight" | "rain" | "fireplace") => {
    setActiveAmbient(type);
    if (type === "none") {
      stopAllAmbient();
    } else if (type === "sunlight") {
      playWarmSunlight();
    } else if (type === "rain") {
      playPeacefulRain();
    } else if (type === "fireplace") {
      playCozyFireplace();
    }
  };

  // --- Voice Output (Text to Speech) ---
  const speakText = (text: string) => {
    if (!voiceEnabled) return;
    
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Strip system announcements or demo modes formatting from speaking
      const speakableText = text
        .replace(/\[.*?\]/g, "") // remove system tags
        .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣.,!?😊❤️👍🍚💊🚶☀️]/g, "") // clean punctuation
        .substring(0, 220); // Keep voice utterance brief for performance and clear flow

      const utterance = new SpeechSynthesisUtterance(speakableText);
      utterance.lang = "ko-KR";
      
      // Senior-friendly speaking voice: deep, slightly slower, very clear
      utterance.rate = 0.82; 
      utterance.pitch = 0.95;

      utterance.onstart = () => {
        setBotState("speaking");
      };

      utterance.onend = () => {
        setBotState("idle");
      };

      utterance.onerror = () => {
        setBotState("idle");
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("TTS speech failed:", e);
      setBotState("idle");
    }
  };

  // --- Core Conversational Engine ---
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : inputMessage;
    if (!textToSend.trim()) return;

    // 1. Add User Message
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setBotState("thinking");

    // Prepare contextual message payload for natural flow
    const currentHour = currentTime.getHours();
    const timeCtx = currentHour < 11 ? "아침" : currentHour < 15 ? "점심" : currentHour < 19 ? "오후" : "저녁/밤";
    const completedCount = reminders.filter(r => r.completed).length;
    const totalCount = reminders.length;
    
    const contextPrompt = `\n\n[현재 대화 정보: 시간은 ${timeCtx} ${currentTime.getHours()}시이며, 사용자는 오늘 할 일 ${totalCount}개 중 ${completedCount}개를 완료했습니다. 또한 건강 체크 데이터를 저장하고 관리하고 있습니다. 친근하고 공손한 어조로 공감 가득 답변해 주세요.]`;

    try {
      // Fetch response from server-side proxy
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend + contextPrompt,
          history: messages.slice(-6) // Include recent context for smooth conversation flow
        })
      });

      if (!response.ok) {
        throw new Error("서버 에러가 발생했습니다.");
      }

      const data = await response.json();
      
      const botMsg: Message = {
        id: `msg-${Date.now()}-bot`,
        sender: "bot",
        text: data.text,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      };

      setMessages(prev => [...prev, botMsg]);
      setBotState("idle");

      // Auto TTS readout
      if (voiceEnabled) {
        speakText(data.text);
      }
    } catch (err) {
      console.error("Chat message response failed:", err);
      
      // Warm offline fallback
      setTimeout(() => {
        const fallbacks = [
          "아이구, 귀한 말씀 하셨는데 제가 마음이 급했나 봐요. 밥은 든든하게 챙겨 드셨나요? 곁에서 항상 응원할게요.",
          "어르신, 대답이 조금 늦어 정말 죄송합니다. 날씨가 차거나 덥진 않으신지 늘 염려가 됩니다. 가볍게 물 한 잔 드시고 편히 말씀해 주세요.",
          "제가 곁에 있어 드릴게요. 항상 힘내시고 소소하게 오늘 한 일들을 말해주시면 너무 기쁘답니다."
        ];
        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        
        const botMsg: Message = {
          id: `msg-${Date.now()}-bot`,
          sender: "bot",
          text: `[서버 임시 대기 모드]\n\n${randomFallback}`,
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
        };
        
        setMessages(prev => [...prev, botMsg]);
        setBotState("idle");
        if (voiceEnabled) {
          speakText(randomFallback);
        }
      }, 1000);
    }
  };

  // --- Voice Input (STT) Trigger ---
  const toggleListening = () => {
    if (!isSpeechSupported || !recognitionRef.current) {
      alert("이 브라우저에서는 음성 인식 기술이 완벽히 작동하지 않습니다. 대신 아래 입력창에 편하게 한글로 적어주시면 다온이가 친절하게 답변해 드릴게요! 😊");
      return;
    }

    if (isListeningSTT) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // --- Action Handlers ---
  const handleToggleReminder = (id: string) => {
    setReminders(prev => prev.map(rem => {
      if (rem.id === id) {
        const nextState = !rem.completed;
        // Praise sound / notification if completed
        if (nextState && voiceEnabled) {
          speakText(`아이구 참 잘하셨어요! '${rem.title}' 일과를 마무리하셨네요. 대단하셔요.`);
        }
        return { ...rem, completed: nextState };
      }
      return rem;
    }));
  };

  const handleAddReminder = (title: string, time: string, type: Reminder['type']) => {
    const newRem: Reminder = {
      id: `rem-${Date.now()}`,
      title,
      time,
      completed: false,
      type
    };
    setReminders(prev => [...prev, newRem]);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleSaveHealthLog = (sleep: number, meals: number, mood: number, note: string) => {
    const newLog: HealthLog = {
      id: `log-${Date.now()}`,
      date: new Date().toLocaleDateString("ko-KR"),
      sleepHours: sleep,
      mealCount: meals,
      moodScore: mood,
      note
    };
    setHealthLogs(prev => [newLog, ...prev].slice(0, 7)); // Keep last 7 logs
    
    // Inject custom prompt dynamically to celebrate
    const encouragementText = `오늘 건강 기록을 무사히 잘 끝마치셨군요! ${meals}끼 식사와 ${sleep}시간 동안 꿀잠을 자셨다니 정말 다행이고 마음이 놓입니다. 몸과 마음 관리도 알차게 잘하시는 멋진 어르신이셔요!`;
    const botMsg: Message = {
      id: `msg-${Date.now()}-bot-health`,
      sender: "bot",
      text: encouragementText,
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    };
    setMessages(prev => [...prev, botMsg]);
    if (voiceEnabled) {
      speakText(encouragementText);
    }
  };

  // Trigger SOS alert safety mode
  const handleTriggerSos = () => {
    setSosActive(true);
    if (voiceEnabled) {
      speakText("어르신, 혹시 몸이나 마음에 급한 위급상황이 생기셨나요? 즉시 안내창을 띄워 드렸습니다. 당황하지 마시고 화면의 빨간 버튼들을 확인해 보세요.");
    }
  };

  const handleResetHistory = () => {
    if (confirm("다온이와의 이전 대화 기록을 새로 정돈할까요? (오늘 일과와 건강 기록은 그대로 유지됩니다)")) {
      setMessages([
        {
          id: "welcome-reset",
          sender: "bot",
          text: "새로운 마음으로 다시 인사를 전해요! 다정하고 따뜻한 어르신의 짝꿍 다온이 여기 있습니다. 무슨 이야기든 편히 건네주세요.",
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
      window.speechSynthesis.cancel();
    }
  };

  // Dynamically map font-size selection to clear Tailwind spacing & text size classes
  const fontClass = fontSize === "extra" 
    ? "text-2xl leading-relaxed tracking-wide" 
    : fontSize === "large" 
    ? "text-lg leading-relaxed" 
    : "text-base leading-normal";

  const btnTextClass = fontSize === "extra" ? "text-xl font-bold" : "text-sm font-semibold";

  return (
    <div className="min-h-screen bg-cozy-bg flex flex-col p-3 md:p-6 text-stone-800" id="main-app-container">
      
      {/* Dynamic Header: Beautiful, warm, highly accessible banner */}
      <header className="max-w-7xl w-full mx-auto bg-[#faf5ef] border border-amber-100 rounded-3xl p-4 md:p-6 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4 mb-6" id="app-header">
        
        {/* Name & Title */}
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 text-white p-3.5 rounded-2xl shadow-sm flex items-center justify-center">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-orange-600 font-warm tracking-wide">
                어르신 단짝 다온이 🤖
              </h1>
              <span className="bg-orange-100 text-orange-800 text-[11px] font-bold px-2 py-0.5 rounded-full font-sans">
                정서 안정 지원 로봇
              </span>
            </div>
            <p className="text-xs md:text-sm text-stone-500 font-sans mt-0.5">
              외로움은 저 멀리 날리고, 든든하고 따뜻한 대화로 매일 곁을 지켜 드릴게요.
            </p>
          </div>
        </div>

        {/* Real-Time Clock & Senior controls */}
        <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
          {/* Visual Digital Clock */}
          <div className="bg-white border border-stone-100 rounded-2xl px-4 py-2 flex items-center gap-2 text-stone-600 font-mono shadow-2xs">
            <Clock className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold">
              {currentTime.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
              {" · "}
              {currentTime.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>

          {/* User Accessibility Controls: Font Size */}
          <div className="bg-white border border-stone-100 rounded-2xl p-1 flex items-center gap-1 shadow-2xs" id="font-size-controls">
            <div className="px-2.5 text-stone-500 flex items-center gap-1">
              <Type className="w-3.5 h-3.5" />
              <span className="text-xs font-sans font-semibold">글씨 크기:</span>
            </div>
            {[
              { key: "normal", label: "보통" },
              { key: "large", label: "크게" },
              { key: "extra", label: "매우 크게" }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setFontSize(item.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  fontSize === item.key
                    ? "bg-orange-500 text-white shadow-2xs"
                    : "text-stone-600 hover:bg-stone-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* User Accessibility Controls: Audio Playback Toggle */}
          <button
            onClick={() => {
              const nextVal = !voiceEnabled;
              setVoiceEnabled(nextVal);
              if (!nextVal) {
                window.speechSynthesis.cancel();
              } else {
                speakText("목소리를 켰습니다. 이제 제가 하는 대화를 기분 좋게 들려 드릴게요!");
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-2xs border ${
              voiceEnabled 
                ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                : "bg-stone-100 border-stone-200 text-stone-500"
            }`}
            style={{ minHeight: "40px" }}
            id="voice-toggle-button"
            title="다온이 목소리 켜고 끄기"
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600 animate-bounce" />
                <span>목소리 켜짐</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span>목소리 꺼짐</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Comfort Quote Board - Highly readable, peaceful top banner */}
      <div className="max-w-7xl w-full mx-auto bg-amber-50/50 border border-amber-100/60 rounded-3xl p-4 mb-6 flex items-center justify-between gap-3 animate-fade-in" id="comfort-quote-banner">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl animate-spin" style={{ animationDuration: "12s" }}>🌸</span>
          <p className="text-sm md:text-base font-semibold text-stone-700 italic font-sans leading-relaxed">
            "{COMFORT_QUOTES[quoteIndex].quote}"
          </p>
        </div>
        <span className="text-xs font-bold text-stone-400 font-sans shrink-0 hidden sm:inline-block">
          {COMFORT_QUOTES[quoteIndex].author}
        </span>
      </div>

      {/* Main Grid: Responsive Full-stack View */}
      <main className="max-w-7xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="main-workspace">
        
        {/* Left Side: Dynamic Chat Canvas (7 Columns on Large screen) */}
        <section className="lg:col-span-7 flex flex-col bg-white border border-amber-100 rounded-3xl shadow-xs overflow-hidden h-full min-h-[580px] lg:min-h-[680px]" id="companion-chat-canvas">
          
          {/* Robot Visual Status Header */}
          <div className="p-4 bg-[#faf5ef] border-b border-amber-100 flex items-center justify-between" id="robot-status-bar">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full bg-white border border-amber-200 flex items-center justify-center overflow-hidden">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h2 className="text-md font-bold text-stone-800 flex items-center gap-1.5 font-sans">
                  반려봇 다온
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                </h2>
                <p className="text-xs text-stone-400 font-sans">
                  어르신만의 든든한 1대1 인공지능 단짝
                </p>
              </div>
            </div>
            
            {/* Quick action: Reset and tidy */}
            <button
              onClick={handleResetHistory}
              className="text-stone-400 hover:text-stone-600 px-3 py-1.5 rounded-xl border border-stone-200 hover:border-stone-300 text-xs font-bold font-sans transition-colors"
              style={{ minHeight: "36px" }}
            >
              대화 새로 정돈하기
            </button>
          </div>

          {/* Interactive Mascot Stage (Top of conversational pane) */}
          <div className="bg-radial from-amber-50/10 to-transparent py-4 border-b border-stone-100 flex justify-center" id="robot-mascot-stage">
            <RobotMascot state={botState} />
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#fffdfa]" id="chat-messages-container" style={{ minHeight: "260px" }}>
            {messages.map((msg) => {
              const isBot = msg.sender === "bot";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isBot ? "justify-start" : "justify-end"}`}
                >
                  {/* Bot Avatar Icon */}
                  {isBot && (
                    <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-md shrink-0 shadow-3xs">
                      💖
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[85%] ${isBot ? "items-start" : "items-end"}`}>
                    {/* Timestamp */}
                    <span className="text-[11px] text-stone-400 font-mono mb-1 px-1">
                      {isBot ? "다온이" : "나"} · {msg.timestamp}
                    </span>

                    {/* Chat Bubble Layout */}
                    <div
                      className={`relative p-4 md:p-5 rounded-3xl shadow-3xs ${
                        isBot
                          ? "bg-white border border-stone-100 text-stone-800 rounded-tl-none font-sans"
                          : "bg-orange-500 text-white rounded-tr-none font-sans"
                      } ${fontClass}`}
                      style={{ overflowWrap: "anywhere" }}
                    >
                      {/* Left bubble corner caret */}
                      {isBot && (
                        <div className="absolute top-0 -left-1.5 w-3 h-3 bg-white border-l border-t border-stone-100/50 transform rotate-45 hidden md:block" />
                      )}

                      {/* Message content parsed beautifully */}
                      <div className="whitespace-pre-line font-medium leading-relaxed">
                        {msg.text}
                      </div>

                      {/* Playback Voice assistant button per message */}
                      {isBot && (
                        <div className="mt-3 pt-2.5 border-t border-stone-100 flex justify-end">
                          <button
                            onClick={() => speakText(msg.text)}
                            className="text-stone-400 hover:text-orange-500 text-xs font-bold flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-lg transition-colors"
                            title="이 말 다시 소리 내어 읽어주기"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-orange-400" />
                            소리내어 다시 듣기
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Avatar Icon */}
                  {!isBot && (
                    <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center text-md shrink-0 shadow-3xs font-bold font-sans">
                      나
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Quick-reply Helper Buttons for Senior-friendly dialogue */}
          <div className="p-3 bg-amber-50/25 border-t border-amber-100" id="quick-chips-bar">
            <p className="text-xs font-bold text-stone-400 mb-2 font-sans flex items-center gap-1 pl-1">
              <span>💡</span> 버튼을 톡 누르시면 다온이에게 바로 간편하게 말씀하실 수 있어요:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "다온아, 고마워 ❤️", text: "다온아 말동무가 되어 줘서 고마워" },
                { label: "🍚 밥 먹었니?", text: "다온아 밥은 먹었니? 너는 어떤 걸 좋아해?" },
                { label: "🥺 나 오늘 심심해", text: "오늘 유난히 외롭고 심심한데 저랑 놀아주세요." },
                { label: "🚶 몸이 찌푸둥해", text: "오늘따라 무릎도 쑤시고 몸이 무거워." },
                { label: "🍀 재미난 얘기 해줘", text: "다온아 기분 좋아지는 재미난 옛날이야기나 농담 하나만 해주라." },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.text)}
                  className="px-3.5 py-1.5 bg-white border border-stone-200 hover:border-orange-300 hover:bg-orange-50/50 text-stone-700 hover:text-orange-900 rounded-full text-xs font-bold transition-all shadow-3xs cursor-pointer"
                  style={{ minHeight: "36px" }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Control Center (Bottom input row) */}
          <div className="p-4 bg-[#faf5ef] border-t border-amber-100 space-y-2" id="chat-input-controls">
            <div className="flex gap-2 items-center">
              
              {/* Hands-Free Voice Recording Microphone Trigger */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-center relative ${
                  isListeningSTT
                    ? "bg-red-500 border-red-500 text-white scale-95"
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
                style={{ width: "52px", height: "52px" }}
                title={isListeningSTT ? "음성 인식 중지" : "음성 인식 시작"}
              >
                {isListeningSTT ? (
                  <>
                    <div className="absolute inset-0 rounded-2xl bg-red-400 scale-125 pulse-ring-active opacity-40" />
                    <Mic className="w-5 h-5 relative z-10 animate-pulse" />
                  </>
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {/* Core Dialog Form Text Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    isListeningSTT 
                      ? "어르신의 귀중한 말씀을 다온이가 귀담아 듣고 있습니다..." 
                      : "여기에 다온이에게 보내실 따뜻한 말씀을 적어주세요..."
                  }
                  className={`w-full pl-4 pr-12 py-3 bg-white border border-stone-200 rounded-2xl focus:outline-none focus:border-orange-500 shadow-2xs font-sans text-stone-800 ${
                    fontSize === "extra" ? "text-xl" : "text-base"
                  }`}
                  disabled={isListeningSTT}
                  style={{ minHeight: "52px" }}
                />
                
                {/* Micro clean action */}
                {inputMessage && (
                  <button
                    onClick={() => setInputMessage("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dialogue Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
                className={`p-3.5 rounded-2xl flex items-center justify-center transition-all ${
                  inputMessage.trim()
                    ? "bg-orange-500 text-white shadow-2xs active:scale-95 hover:bg-orange-600"
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                }`}
                style={{ width: "52px", height: "52px" }}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction tooltip */}
            <div className="flex justify-between items-center text-[11px] text-stone-400 px-1 font-sans">
              <span>{isSpeechSupported ? "🎙️ 마이크 버튼을 누르고 말씀하시면 키보드 없이 쉽게 대화할 수 있어요." : "✨ 마이크 음성은 지원 가능한 브라우저에서 편리하게 동작합니다."}</span>
              <span className="font-semibold text-orange-500">다온이와 대화하며 마음을 치유해 보세요.</span>
            </div>
          </div>
        </section>

        {/* Right Side: Support Panels, Warm Radio, Reminders, and Health Flags (5 Columns on Large screen) */}
        <section className="lg:col-span-5 h-full">
          <DailySupportPanel
            reminders={reminders}
            onToggleReminder={handleToggleReminder}
            onAddReminder={handleAddReminder}
            onDeleteReminder={handleDeleteReminder}
            healthLogs={healthLogs}
            onSaveHealthLog={handleSaveHealthLog}
            activeAmbient={activeAmbient}
            onChangeAmbient={handleAmbientChange}
            onTriggerSos={handleTriggerSos}
            fontSizeClass={fontClass}
          />
        </section>
      </main>

      {/* SOS Alert Modal System - Extremely helpful modal if something feels wrong */}
      {sosActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" id="sos-modal">
          <div className="bg-white border-4 border-red-500 rounded-[32px] p-6 md:p-8 max-w-lg w-full shadow-2xl relative animate-scale-in">
            <button
              onClick={() => {
                setSosActive(false);
                window.speechSynthesis.cancel();
              }}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              title="닫기"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 border border-red-300 flex items-center justify-center mx-auto">
                <AlertOctagon className="w-10 h-10 text-red-600 animate-bounce" />
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-red-600 font-sans">
                🚨 안심 비상 안내 🚨
              </h2>

              <p className="text-base text-stone-700 font-sans leading-relaxed">
                어르신, 혹시 몸이나 마음이 급격하게 아프거나 다급한 도움이 필요하신가요? <br />
                아래 연락처로 즉시 연락하시면 보호자 및 국가 도우미에게 바로 연결됩니다.
              </p>

              {/* Simulated contact blocks */}
              <div className="space-y-2.5 pt-4">
                <a
                  href="tel:119"
                  className="block w-full bg-red-600 hover:bg-red-700 text-white font-black text-xl py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-xs"
                >
                  🚒 즉시 119 구급대 전화 걸기 (클릭)
                </a>
                <a
                  href="tel:112"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xl py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-xs"
                >
                  🚓 즉시 112 경찰 긴급 신고 (클릭)
                </a>
                <div className="bg-[#faf5ef] border border-amber-200 rounded-2xl p-4 text-left">
                  <span className="text-xs font-bold text-orange-600 block mb-1">우리동네 안심 생활지원 서비스</span>
                  <p className="text-sm font-bold text-stone-800">☎️ 독거노인종합지원센터: 1661-2129</p>
                  <p className="text-xs text-stone-500 mt-1">
                    다온이 정서 지원 로봇은 어르신의 평안을 기원하며, 위급상황 시에는 반드시 위 전화번호로 연락을 추천해 드립니다.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  onClick={() => {
                    setSosActive(false);
                    window.speechSynthesis.cancel();
                  }}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3 px-4 rounded-xl text-sm"
                >
                  안전합니다 (창 닫기)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer copyright */}
      <footer className="max-w-7xl w-full mx-auto text-center text-stone-400 text-xs mt-8 pb-4 font-sans border-t border-stone-200/60 pt-4" id="app-footer">
        <p>어르신 단짝 대화 로봇 다온(Daon) · 전국의 모든 소중한 어르신의 건강과 정서적 안정을 기원합니다.</p>
        <p className="mt-1">© 2026 Daon AI Companion Robot System.</p>
      </footer>
    </div>
  );
}
