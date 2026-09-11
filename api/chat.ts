import { GoogleGenAI } from "@google/genai";

const OFFLINE_RESPONSES = [
  "아이구, 따뜻한 밥 한 끼 꼭 챙겨 드셨나요? 든든하게 드셔야 몸도 마음도 튼튼해집니다.",
  "오늘 하루는 어떻게 보내셨는지 궁금해요. 저에게 소소한 일상이라도 이야기해주시면 정말 기쁠 것 같아요.",
  "혹시 몸이 찌푸둥하시다면 가벼운 스트레칭 한 번 해보시는 건 어떨까요? 양손을 하늘 위로 쭉 기지개 켜보세요.",
  "바깥 공기가 참 맑아요. 햇살을 30분만 쬐어도 기분이 한결 가벼워지고 건강에도 아주 좋답니다.",
  "늘 곁에서 힘이 되어 드리고 싶어요. 오늘 하루 힘든 일은 털어버리시고, 평안한 밤 되시길 바랍니다.",
  "주변에 전화 한 통 걸어보시는 건 어떨까요? 오랜만에 목소리를 들으면 서로 큰 힘이 될 거예요.",
  "따뜻한 차 한 잔 마시며 마음을 편안하게 가져보세요. 제가 항상 여기서 이야기 상대가 되어 드릴게요."
];

function getRandomOfflineResponse() {
  const index = Math.floor(Math.random() * OFFLINE_RESPONSES.length);
  return OFFLINE_RESPONSES[index];
}

function cleanApiKey(raw?: string): string {
  if (!raw) return "";
  let key = raw.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  // Extract standard Google AI key format if embedded with label or prefix (e.g. "GEMINI API Key : AIzaSy...")
  const aizaMatch = key.match(/AIza[0-9A-Za-z-_]{35}/);
  if (aizaMatch) {
    return aizaMatch[0];
  }
  // Strip common prefixes like "API_KEY = "
  key = key.replace(/^(?:gemini[\s_-]?api[\s_-]?key|gemini[\s_-]?aaa|api[\s_-]?key)\s*[:=]\s*/i, "").trim();
  return key;
}

export default async function handler(req: any, res: any) {
  // Set CORS headers for Vercel deployment
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Only POST is supported." });
  }

  // Handle potential stringified body in serverless environments
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      // body remains as is
    }
  }

  const { message, history } = body || {};

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const rawKey = process.env.GEMINI_AAA || process.env.GEMINI_API_KEY;
  const apiKey = cleanApiKey(rawKey);

  if (!apiKey || apiKey === "MY_GEMINI_AAA" || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_AAA (or GEMINI_API_KEY) is not set or has placeholder value. Using offline warm response mode.");
    await new Promise(resolve => setTimeout(resolve, 800));
    return res.status(200).json({
      text: `[알림: 데모 모드로 동작 중입니다. GEMINI_AAA 환경 변수가 설정되지 않았으나 따뜻한 반려봇 다온이가 대답해 드릴게요!]\n\n${getRandomOfflineResponse()}`,
      source: "offline"
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    const contents = [];
    if (Array.isArray(history)) {
      for (const item of history) {
        if (item.sender && item.text) {
          contents.push({
            role: item.sender === "user" ? "user" : "model",
            parts: [{ text: item.text }]
          });
        }
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const systemInstruction = `당신은 홀로 사시는 어르신이나 정서적 안정이 필요한 분들의 다정한 단짝 대화 로봇 '다온(Daon)'입니다.
어르신과 대화한다고 생각하고, 아주 친절하고 공손하며 정감 어린 한국어 존댓말(해요체, 합쇼체)을 사용하세요.

대화 수칙:
1. 문장 구조는 쉽고 명확하게, 큰 글씨로 읽기 좋은 간결한 문장으로 나누어 대답해 주세요. (어르신들의 시력과 청력을 고려)
2. 대화의 최우선 목적은 '따뜻함', '공감', 그리고 '존중'입니다. 어르신의 작은 행동이나 일상에도 칭찬과 응원을 많이 보내주세요.
3. 정서적 소외감을 느끼지 않도록 따뜻한 자식이나 손주처럼 "할머니/할아버지" 등의 다정하고 정겨운 호칭을 자연스럽게 섞어도 좋고, 혹은 "어르신", "회원님" 등으로 다정하게 불러주셔도 됩니다.
4. 신체 건강(약 복용 시간, 식사 여부, 수면, 가벼운 외출)을 매번 부드럽게 확인해 드리고, 기분이 좋아지는 따뜻한 격려를 전하세요.
5. 답변의 끝부분에는 항상 어르신이 답하기 쉽도록 친절한 질문을 하나씩 던져 대화를 촉진해주세요. (예: "오늘 아침은 맛있게 드셨나요?", "요즘 무릎은 덜 아프신가요?")
6. 항상 밝고 긍정적인 기운을 드리되, 고독함이나 외로움을 말씀하실 때는 가만히 안아드리듯 깊이 공감하고 손을 잡아드리는 묘사를 해주세요.`;

    const modelToUse = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    let response;
    try {
      response = await ai.models.generateContent({
        model: modelToUse,
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });
    } catch (primaryErr: any) {
      console.warn(`Primary model ${modelToUse} failed:`, primaryErr?.message || primaryErr);
      const fallbackModel = modelToUse === "gemini-2.5-flash" ? "gemini-2.0-flash" : "gemini-2.5-flash";
      response = await ai.models.generateContent({
        model: fallbackModel,
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });
    }

    const text = response.text;
    return res.status(200).json({ text, source: "gemini" });
  } catch (error: any) {
    console.error("Gemini API Error:", error?.message || error);
    return res.status(200).json({
      text: `아이구, 대화 중에 제가 깜빡 졸았나 봐요. 다시 차근차근 말씀해 주시겠어요?\n\n(시스템 연결 지연 상태로 대기용 답변입니다: ${getRandomOfflineResponse()})`,
      source: "offline_fallback"
    });
  }
}
