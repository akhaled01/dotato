import { createDeepSeek } from "@ai-sdk/deepseek";
import { env } from "@dotato/env";

const deepseek = createDeepSeek({ apiKey: env.DEEPSEEK_API_KEY });

export const chatModel = deepseek("deepseek-chat");
export const reasonerModel = deepseek("deepseek-reasoner");
