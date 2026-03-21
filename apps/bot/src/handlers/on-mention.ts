import { createGitHubAdapter } from "@chat-adapter/github";
import { createRedisState } from "@chat-adapter/state-redis";
import { Chat } from "chat";

const bot = new Chat({
  userName: "dotato",
  adapters: {
    github: createGitHubAdapter(),
  },
  state: createRedisState(),
});

bot.onNewMention(async (thread, message) => {
  await thread.post("Hello from GitHub!");
});
