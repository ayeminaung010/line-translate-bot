import {
  messagingApi,
  TextMessage,
  validateSignature,
  WebhookEvent,
} from '@line/bot-sdk';
import { NextRequest, NextResponse } from 'next/server';

// --- 1. Configuration ---
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest',
  googleTranslateApiKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',
  translateTargetLanguageCode: process.env.TRANSLATE_TARGET_LANGUAGE_CODE || 'en',
  translateTargetLanguageName: process.env.TRANSLATE_TARGET_LANGUAGE_NAME || 'English',
};

const DAILY_LIMIT_MESSAGE = "⚠️ Daily translation limit reached. Please try again tomorrow!";
const GENERIC_ERROR_MESSAGE = "Sorry, an error occurred.";

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

// --- 2. Translation Function ---
// This new function calls the Gemini API to translate text.
async function translateText(text: string): Promise<string> {
  // For now, we'll translate any incoming text to English.
  const prompt = `Translate the following text into ${config.translateTargetLanguageName}. Provide only the translated text, without any additional explanations or context:\n\n"${text}"`;

  if (config.googleTranslateApiKey) {
    const translateUrl = `https://translation.googleapis.com/language/translate/v2?key=${config.googleTranslateApiKey}`;

    try {
      const response = await fetch(translateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          target: config.translateTargetLanguageCode,
          format: 'text',
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const errorInfo = payload?.error;
        const errorMessage: string = errorInfo?.message || response.statusText;
        const errorReason: string | undefined = errorInfo?.errors?.[0]?.reason;
        const reachedDailyLimit =
          response.status === 403 ||
          errorReason === 'dailyLimitExceeded' ||
          (errorMessage && errorMessage.toLowerCase().includes('daily limit exceeded'));

        if (reachedDailyLimit) {
          console.warn('Google Translate daily limit reached.', errorInfo);
          return DAILY_LIMIT_MESSAGE;
        }

        console.error('Google Translate API error:', errorInfo || {
          status: response.status,
          statusText: response.statusText,
          body: payload,
        });
        return GENERIC_ERROR_MESSAGE;
      }

      const translated = payload?.data?.translations?.[0]?.translatedText;

      if (translated) {
        return translated;
      }

      console.warn('Google Translate API returned no translation for input.', {
        value: text,
        payload,
      });
      return GENERIC_ERROR_MESSAGE;
    } catch (error) {
      console.error('Google Translate API call failed:', error);
      return GENERIC_ERROR_MESSAGE;
    }
  }

  if (!config.geminiApiKey) {
    console.error("Gemini API key is not configured.");
    return "Translation service is currently unavailable.";
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Gemini API responded with an error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const result = await response.json();
    const translated = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (translated) {
      return translated.trim();
    } else {
      return "Sorry, I couldn't translate that.";
    }
  } catch (error) {
    console.error("Translation API call failed:", error);
    return GENERIC_ERROR_MESSAGE;
  }
}


// --- 3. Main POST Handler (Webhook) ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-line-signature') || '';

    if (!validateSignature(body, config.channelSecret, signature)) {
      console.warn('Invalid signature received.');
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const events: WebhookEvent[] = JSON.parse(body).events;

    if (events && events.length > 0) {
      await Promise.all(events.map(handleEvent));
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Unknown error' }, { status: 500 });
  }
}

// --- 4. Event Handling Logic ---
// This function now calls the translation service.
const handleEvent = async (event: WebhookEvent): Promise<messagingApi.ReplyMessageResponse | undefined> => {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return;
  }

  const message: TextMessage = event.message;
  const replyToken = event.replyToken;

  console.log(`Received text: "${message.text}". Translating...`);

  // --- Call the new translateText function ---
  const translatedText = await translateText(message.text);

  const replyMessage: TextMessage = {
    type: 'text',
    text: translatedText,
  };

  try {
    const response = await client.replyMessage({
        replyToken: replyToken,
        messages: [replyMessage],
    });
    console.log(`Successfully sent translation: "${translatedText}"`);
    return response;
  } catch (err) {
    console.error('Failed to send reply message:', err);
  }
};
