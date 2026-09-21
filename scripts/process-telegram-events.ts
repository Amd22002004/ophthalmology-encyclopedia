import "dotenv/config";
import { parseTelegramBotConfig } from "../src/lib/events/telegram";
import { runTelegramWorker } from "../src/lib/events/telegram-worker";

async function main() {
  const result = await runTelegramWorker(parseTelegramBotConfig());
  console.log(JSON.stringify(result));
}

main().catch(() => {
  console.error("Telegram worker failed");
  process.exitCode = 1;
});
