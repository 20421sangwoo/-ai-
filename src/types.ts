export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  hasAudio?: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  time: string;
  completed: boolean;
  type: 'medicine' | 'meal' | 'exercise' | 'general';
}

export interface HealthLog {
  id: string;
  date: string;
  sleepHours: number;
  mealCount: number;
  moodScore: number; // 1 to 5
  note: string;
}

export interface DailyComfortQuote {
  quote: string;
  author: string;
}
