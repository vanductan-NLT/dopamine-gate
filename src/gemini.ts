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

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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
  "message": "Brief explanation in Vietnamese",
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
    const apiKey = await getApiKey();

    // Validate API key exists
    if (!apiKey) {
        return {
            decision: "block",
            confidence: 1,
            message: "API key chưa được cấu hình. Vui lòng thêm API key trong Settings.",
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

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
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

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Gemini API error:", errorData);

            // Handle specific error cases
            if (response.status === 400) {
                return {
                    decision: "block",
                    confidence: 1,
                    message: "API key không hợp lệ. Vui lòng kiểm tra lại trong Settings.",
                };
            }

            return {
                decision: "block",
                confidence: 1,
                message: "Lỗi kết nối với AI. Mặc định chặn để bảo vệ bạn.",
            };
        }

        const data = await response.json();

        // Extract text response from Gemini
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            throw new Error("Empty response from Gemini");
        }

        // Parse JSON from response (may have markdown code blocks)
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON found in response");
        }

        const aiDecision: AIDecision = JSON.parse(jsonMatch[0]);

        // Validate response structure
        if (!aiDecision.decision || !["allow", "block"].includes(aiDecision.decision)) {
            throw new Error("Invalid decision format");
        }

        return {
            decision: aiDecision.decision,
            confidence: aiDecision.confidence ?? 0.5,
            message: aiDecision.message ?? "Quyết định dựa trên AI",
            classification: aiDecision.classification,
        };
    } catch (error) {
        console.error("Gemini evaluation error:", error);

        // Fallback to blocking on error (safer default)
        return {
            decision: "block",
            confidence: 0.5,
            message: "Không thể xử lý phản hồi AI. Mặc định chặn để bảo vệ bạn.",
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
            message: "Chính bạn cũng thấy lướt tiếp là phí thời gian. Hãy dừng lại thôi! 🛑",
        };
    }

    // Rule 2: Outcome is emptiness → block
    if (answers.outcome === "Emptiness") {
        return {
            decision: "block",
            confidence: 0.9,
            message: "Đừng để bản thân rơi vào cảm giác trống rỗng sau khi lướt. Đi làm gì đó có ích hơn đi! ✨",
        };
    }

    // No client rule applies, need AI evaluation
    return null;
}
