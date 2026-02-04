/**
 * Dopamine Gate - TypeScript Type Definitions
 * Shared interfaces for the extension
 */

// ============================================
// Storage Types
// ============================================

/** User settings stored in chrome.storage.sync */
export interface StorageData {
    blocklist: string[];
    apiKey: string;
    logs: LogEntry[];
}

/** Single log entry for decisions */
export interface LogEntry {
    timestamp: number;
    domain: string;
    answers: ReflectionAnswers;
    aiDecision: AIDecision;
}

// ============================================
// Reflection Form Types
// ============================================

/** Goal alignment options */
export type GoalAlignment = "Yes" | "No" | "Unsure";

/** Time budget options */
export type TimeBudget = "2 min" | "5 min" | "10 min" | "Unlimited";

/** Mentor approval options */
export type MentorApproval = "Yes" | "No";

/** User's answers to reflection questions */
export interface ReflectionAnswers {
    reason: string;
    goalTarget: string;
    alternativeAction: string;
    outcome: "Knowledge" | "Real Entertainment" | "Emptiness";
    needType: "Information" | "Dopamine";
    futureFeeling: "Good" | "Waste";
}

// ============================================
// AI Decision Types
// ============================================

/** Classification of user intent by AI */
export type IntentClassification =
    | "productive"
    | "neutral"
    | "procrastination"
    | "emotional_escape";

/** AI decision response */
export interface AIDecision {
    decision: "allow" | "block";
    confidence: number;
    message: string;
    classification?: IntentClassification;
}

/** Request payload sent to Gemini */
export interface GeminiRequest {
    reason: string;
    goal_target: string;
    alternative_action: string;
    outcome: string;
    need_type: string;
    future_feeling: string;
}

// ============================================
// Message Types (Background <-> Content Script)
// ============================================

/** Messages sent between background and content scripts */
export interface ExtensionMessage {
    type: "CLOSE_TAB" | "CHECK_BLOCKED" | "GET_SETTINGS";
    payload?: unknown;
}

/** Response from background script */
export interface ExtensionResponse {
    success: boolean;
    data?: unknown;
    error?: string;
}
