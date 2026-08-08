import { AIProvider } from "./types";
import { AIRouter } from "./router";

export function getAIProvider(): AIProvider {
  return AIRouter.getInstance();
}
