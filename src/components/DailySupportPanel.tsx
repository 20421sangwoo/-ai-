import { useState, FormEvent } from "react";
import { Reminder, HealthLog } from "../types";
import { 
  Heart, 
  Plus, 
  Trash2, 
  Music, 
  Activity, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Circle,
  Coffee,
  Moon,
  Smile,
  AlertCircle
} from "lucide-react";

interface DailySupportPanelProps {
  reminders: Reminder[];
  onToggleReminder: (id: string) => void;
  onAddReminder: (title: string, time: string, type: Reminder['type']) => void;
  onDeleteReminder: (id: string) => void;
  healthLogs: HealthLog[];
  onSaveHealthLog: (sleep: number, meals: number, mood: number, note: string) => void;
  activeAmbient: "none" | "sunlight" | "rain" | "fireplace";
  onChangeAmbient: (type: "none" | "sunlight" | "rain" | "fireplace") => void;
  onTriggerSos: () => void;
  fontSizeClass: string;
}

export default function DailySupportPanel({
  reminders,
  onToggleReminder,
  onAddReminder,
  onDeleteReminder,
  healthLogs,
  onSaveHealthLog,
  activeAmbient,
  onChangeAmbient,
  onTriggerSos,
  fontSizeClass
}: DailySupportPanelProps) {
  // Reminder input states
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("09:00");
  const [newType, setNewType] = useState<Reminder['type']>("medicine");

  // Health Log form states
  const [sleepHours, setSleepHours] = useState(7);
  const [mealCount, setMealCount] = useState(3);
  const [moodScore, setMoodScore] = useState(5);
  const [healthNote, setHealthNote] = useState("");

  const handleReminderSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddReminder(newTitle, newTime, newType);
    setNewTitle("");
  };

  const handleHealthSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSaveHealthLog(sleepHours, mealCount, moodScore, healthNote);
    setHealthNote("");
    // Give direct user feedback
    alert("오늘의 소중한 건강 기록이 안전하게 저장되었습니다. 다온이가 기억하고 대화에 활용해 드릴게요! 😊");
  };

  return (
    <div className="flex flex-col gap-6 w-full lg:max-w-md h-full" id="daily-support-panel">
      
      {/* 1. Warm Radio (따뜻한 라디오) */}
      <div className="bg-[#faf5ef] rounded-3xl p-5 border border-amber-100 shadow-xs" id="warm-radio-card">
        <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-3 font-sans">
          <Music className="w-5 h-5 text-orange-500" />
          마음 치유 라디오
        </h3>
        <p className="text-sm text-stone-500 mb-4 font-sans leading-relaxed">
          마음을 진정시켜 주는 아늑한 소리들을 들으며 휴식해 보세요. (언제든 켜고 끄실 수 있어요)
        </p>
        <div className="grid grid-cols-2 gap-2" id="ambient-sound-buttons">
          <button
            onClick={() => onChangeAmbient("sunlight")}
            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all ${
              activeAmbient === "sunlight"
                ? "bg-amber-100 border-amber-300 text-amber-800 font-bold scale-98"
                : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
            style={{ minHeight: "80px" }}
            id="ambient-sunlight"
          >
            <span className="text-2xl">☀️</span>
            <span className="text-xs font-semibold font-sans">따스한 햇살</span>
          </button>

          <button
            onClick={() => onChangeAmbient("rain")}
            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all ${
              activeAmbient === "rain"
                ? "bg-blue-100 border-blue-300 text-blue-800 font-bold scale-98"
                : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
            style={{ minHeight: "80px" }}
            id="ambient-rain"
          >
            <span className="text-2xl">🌧️</span>
            <span className="text-xs font-semibold font-sans">마음 평온 빗소리</span>
          </button>

          <button
            onClick={() => onChangeAmbient("fireplace")}
            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all ${
              activeAmbient === "fireplace"
                ? "bg-orange-100 border-orange-300 text-orange-800 font-bold scale-98"
                : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
            style={{ minHeight: "80px" }}
            id="ambient-fireplace"
          >
            <span className="text-2xl">🔥</span>
            <span className="text-xs font-semibold font-sans">아늑한 장작불</span>
          </button>

          <button
            onClick={() => onChangeAmbient("none")}
            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all ${
              activeAmbient === "none"
                ? "bg-stone-200 border-stone-300 text-stone-800 font-bold scale-98"
                : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
            style={{ minHeight: "80px" }}
            id="ambient-none"
          >
            <span className="text-xl">🔇</span>
            <span className="text-xs font-semibold font-sans">소리 끄기</span>
          </button>
        </div>
      </div>

      {/* 2. Reminders Tracker (일과 일정 관리) */}
      <div className="bg-[#faf5ef] rounded-3xl p-5 border border-amber-100 shadow-xs flex-1 flex flex-col min-h-[300px]" id="reminders-card">
        <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-3 font-sans">
          <Clock className="w-5 h-5 text-orange-500" />
          오늘 꼭 해야 할 일
        </h3>
        
        {/* Reminder Checklist */}
        <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[180px] pr-1 mb-4" id="reminders-list">
          {reminders.length === 0 ? (
            <div className="text-center py-6 text-stone-400 text-sm font-sans">
              오늘 예정된 일정이 없어요. 아래에서 새로 등록해 보세요!
            </div>
          ) : (
            reminders.map(rem => (
              <div
                key={rem.id}
                className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                  rem.completed 
                    ? "bg-stone-100/50 border-stone-200/50 opacity-60" 
                    : "bg-white border-amber-100 shadow-2xs hover:border-amber-200"
                }`}
              >
                <button
                  onClick={() => onToggleReminder(rem.id)}
                  className="flex items-center gap-3 text-left flex-1"
                  style={{ minHeight: "44px" }}
                  title="일정 완료 상태 전환"
                >
                  {rem.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 text-stone-300 shrink-0 hover:text-orange-400 transition-colors" />
                  )}
                  <div className="flex flex-col">
                    <span className={`font-semibold font-sans text-stone-800 ${rem.completed ? "line-through text-stone-400" : ""}`}>
                      {rem.title}
                    </span>
                    <span className="text-xs text-stone-500 flex items-center gap-1 font-mono mt-0.5">
                      {rem.type === "medicine" && "💊 약 복용"}
                      {rem.type === "meal" && "🍚 식사"}
                      {rem.type === "exercise" && "🚶 운동"}
                      {rem.type === "general" && "📋 일반"}
                      {" · "}
                      {rem.time}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => onDeleteReminder(rem.id)}
                  className="p-2.5 text-stone-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                  style={{ minWidth: "40px", minHeight: "40px" }}
                  title="일정 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Reminder Form */}
        <form onSubmit={handleReminderSubmit} className="space-y-2 pt-2 border-t border-stone-200/60" id="add-reminder-form">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="예: 영양제 챙겨 먹기, 동네 산책"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm font-sans"
              required
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="px-2 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm font-sans font-mono"
              required
            />
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as Reminder['type'])}
              className="px-2 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-sans text-stone-700"
            >
              <option value="medicine">💊 약 복용</option>
              <option value="meal">🍚 식사 챙기기</option>
              <option value="exercise">🚶 가벼운 운동</option>
              <option value="general">📋 소소한 약속</option>
            </select>
            <button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white py-1.5 px-3 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1 transition-colors"
              style={{ minHeight: "36px" }}
            >
              <Plus className="w-3.5 h-3.5" />
              일과 추가하기
            </button>
          </div>
        </form>
      </div>

      {/* 3. Health Signals (건강 체크 저널) */}
      <div className="bg-[#faf5ef] rounded-3xl p-5 border border-amber-100 shadow-xs" id="health-journal-card">
        <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-3 font-sans">
          <Activity className="w-5 h-5 text-orange-500" />
          오늘 하루 건강 신호등
        </h3>
        <form onSubmit={handleHealthSubmit} className="space-y-4" id="health-check-form">
          {/* Mood Check */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-stone-700 flex items-center gap-1 font-sans">
              <Smile className="w-4 h-4 text-orange-400" />
              오늘 몸과 마음의 에너지는 어떤가요?
            </label>
            <div className="flex justify-between gap-1">
              {[
                { score: 1, label: "아주 지침", emoji: "😢" },
                { score: 2, label: "조금 지침", emoji: "🙁" },
                { score: 3, label: "그저 그래요", emoji: "😐" },
                { score: 4, label: "개운해요", emoji: "🙂" },
                { score: 5, label: "에너지 가득!", emoji: "😊" }
              ].map(item => (
                <button
                  key={item.score}
                  type="button"
                  onClick={() => setMoodScore(item.score)}
                  className={`flex-1 py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    moodScore === item.score
                      ? "bg-orange-500 border-orange-500 text-white scale-98"
                      : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                  }`}
                  style={{ minHeight: "60px" }}
                  title={item.label}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className={`text-[10px] ${moodScore === item.score ? "text-orange-50" : "text-stone-400"} font-sans text-center leading-none`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Sleep Check */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1 font-sans">
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                수면 시간
              </label>
              <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1.5">
                <button
                  type="button"
                  onClick={() => setSleepHours(Math.max(0, sleepHours - 1))}
                  className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center font-bold font-sans active:bg-stone-200"
                >
                  -
                </button>
                <span className="flex-1 text-center font-bold text-sm font-sans text-stone-800">
                  {sleepHours}시간
                </span>
                <button
                  type="button"
                  onClick={() => setSleepHours(Math.min(24, sleepHours + 1))}
                  className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center font-bold font-sans active:bg-stone-200"
                >
                  +
                </button>
              </div>
            </div>

            {/* Meal Check */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1 font-sans">
                <Coffee className="w-3.5 h-3.5 text-emerald-500" />
                식사 횟수
              </label>
              <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1.5">
                <button
                  type="button"
                  onClick={() => setMealCount(Math.max(0, mealCount - 1))}
                  className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center font-bold font-sans active:bg-stone-200"
                >
                  -
                </button>
                <span className="flex-1 text-center font-bold text-sm font-sans text-stone-800">
                  {mealCount}끼
                </span>
                <button
                  type="button"
                  onClick={() => setMealCount(Math.min(5, mealCount + 1))}
                  className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center font-bold font-sans active:bg-stone-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Quick Note */}
          <div className="space-y-1.5">
            <input
              type="text"
              placeholder="예: 오늘은 무릎이 조금 쑤시네, 컨디션 최고!"
              value={healthNote}
              onChange={(e) => setHealthNote(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm font-sans"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-100 hover:bg-orange-200 active:bg-orange-300 text-orange-900 py-2.5 px-4 rounded-xl text-sm font-bold font-sans flex items-center justify-center gap-1.5 transition-all"
            style={{ minHeight: "44px" }}
          >
            <Heart className="w-4 h-4 text-orange-500" />
            기록 완료하고 저장하기
          </button>
        </form>
      </div>

      {/* 4. Safe SOS Button */}
      <button
        onClick={onTriggerSos}
        className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-3xl p-4 flex items-center justify-center gap-2 border-2 border-red-300 shadow-sm hover:shadow-md transition-all active:scale-99"
        style={{ minHeight: "56px" }}
        id="sos-button"
      >
        <ShieldAlert className="w-6 h-6 animate-pulse" />
        <span className="text-lg font-black font-sans tracking-wide">비상 안심 연락망 (SOS)</span>
      </button>
    </div>
  );
}
