/**
 * Dopamine Gate - Gemini API Client
 * Handles AI decision-making for allow/block decisions
 * 
 * SECURITY NOTE: API key is stored in chrome.storage.sync
 * and never hardcoded in the source code.
 */

import type { ReflectionAnswers, AIDecision, GeminiRequest } from "./types.js";
import { getApiKey } from "./storage.js";

// ============================================
// Gemini API Configuration
// ============================================

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// System prompt for the AI productivity coach
const SYSTEM_PROMPT = `You are a productivity coach AI. 
Classify whether visiting this site is aligned with long-term goals.
Return strict JSON only, no markdown, no explanation.

Classification categories:
- productive: Genuinely helps with work/learning goals
- neutral: Neither helpful nor harmful
- procrastination: Avoiding important tasks
- emotional_escape: Using internet to avoid feelings/stress

Decision rules:
- If future_feeling is "Waste" → block
- If outcome is "Emptiness" → block
- If answers indicate procrastination or emotional escape → block
- Otherwise allow cautiously

Return ONLY this JSON format:
{
  "decision": "allow" or "block",
  "confidence": 0.0 to 1.0,
  "message": "Brief explanation in English",
  "classification": "productive" or "neutral" or "procrastination" or "emotional_escape"
}`;

// ============================================
// API Functions
// ============================================

/**
 * Call Gemini API to evaluate user's reflection answers
 * @param answers - User's answers to reflection questions
 * @returns AI decision with confidence and message
 */
export async function evaluateWithGemini(
    answers: ReflectionAnswers
): Promise<AIDecision> {
    try {
        const apiKey = await getApiKey();

        // Validate API key exists
        if (!apiKey) {
            return {
                decision: "block",
                confidence: 1,
                message: "API Key not configured. Please add it in the extension settings.",
            };
        }

        // Prepare request payload
        const geminiRequest: GeminiRequest = {
            reason: answers.reason,
            goal_target: answers.goalTarget,
            alternative_action: answers.alternativeAction,
            outcome: answers.outcome,
            need_type: answers.needType,
            future_feeling: answers.futureFeeling,
        };

        console.log(`[Dopamine Gate] Calling Gemini API (${GEMINI_API_URL.split('/').pop()})`);

        // Add AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for the fetch call

        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `${SYSTEM_PROMPT}\n\nUser answers:\n${JSON.stringify(geminiRequest, null, 2)}`,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.1, // Low temperature for consistent decisions
                    topP: 0.8,
                    maxOutputTokens: 256,
                },
            }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("[Dopamine Gate] Gemini API error:", errorData);

            if (response.status === 404) {
                return {
                    decision: "block",
                    confidence: 1,
                    message: `Model not found (404). Your region might not support gemini-2.5-flash yet.`,
                };
            }

            if (response.status === 400 || response.status === 403) {
                return {
                    decision: "block",
                    confidence: 1,
                    message: `Invalid API Key or Restricted Access (Status ${response.status}).`,
                };
            }

            return {
                decision: "block",
                confidence: 1,
                message: `AI Connection Error (Status ${response.status}). Please try again later.`,
            };
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            throw new Error("Empty response from Gemini");
        }

        // Safer JSON extraction: find first '{' and last '}'
        const firstBracket = textResponse.indexOf("{");
        const lastBracket = textResponse.lastIndexOf("}");

        if (firstBracket === -1 || lastBracket === -1) {
            throw new Error("No JSON object found in AI response");
        }

        const jsonString = textResponse.substring(firstBracket, lastBracket + 1);
        const aiDecision: AIDecision = JSON.parse(jsonString);

        if (!aiDecision.decision) {
            throw new Error("Invalid AI decision format");
        }

        return {
            decision: aiDecision.decision,
            confidence: aiDecision.confidence ?? 0.5,
            message: aiDecision.message ?? "Decision based on AI evaluation",
            classification: aiDecision.classification,
        };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error("[Dopamine Gate] Gemini API timeout");
            return {
                decision: "block",
                confidence: 1,
                message: "⏱️ Gemini API level timeout. Connection is too slow.",
            };
        }

        console.error("[Dopamine Gate] Gemini evaluation failed:", error);

        return {
            decision: "block",
            confidence: 1,
            message: `AI Error: ${error.message || "Connection failed"}. Access blocked for safety.`,
        };
    }
}

/**
 * Apply client-side decision rules before AI evaluation
 * These rules can block immediately without AI call
 * @param answers - User's reflection answers
 * @returns Decision if rule applies, null otherwise
 */
export function applyClientRules(answers: ReflectionAnswers): AIDecision | null {
    // Rule 1: If future feeling is waste → block
    if (answers.futureFeeling === "Waste") {
        return {
            decision: "block",
            confidence: 1,
            message: "You already identified this as a waste of time. Let's stop here! 🛑",
        };
    }

    // Rule 2: Outcome is emptiness → block
    if (answers.outcome === "Emptiness") {
        return {
            decision: "block",
            confidence: 0.9,
            message: "Don't let yourself feel empty after scrolling. Go do something meaningful! ✨",
        };
    }

    // No client rule applies, need AI evaluation
    return null;
}
