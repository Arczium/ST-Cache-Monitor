# ST-Cache-Monitor

A lightweight SillyTavern extension that monitors your prompt cache hit rate in real-time and warns you when caching efficiency drops.

## 📖 Why this exists
I originally built this extension to monitor and test my other project, [ST-Message-Chunker](https://github.com/Arczium/ST-Message-Chunker). 

During testing, I noticed a frustrating issue: API providers often deliver vastly different cache hit rates depending on the time of day and server load. Sometimes, caching stops working efficiently altogether. 

Instead of constantly checking provider dashboards (like OpenRouter's activity page), this extension brings the data directly to you. It helps you debug, test providers, and lets you know exactly when you might want to switch to a different API or model because of poor cache performance.

## ✨ Features

*   **Deep Console Logging (F12):** Tracks exact prompt tokens, cached tokens, and hit percentages directly in your browser console. Perfect for debugging context handling or stress-testing API providers.
*   **Smart Toast Warnings:** Fully customizable popup alerts in the SillyTavern UI. If your rolling average cache hit rate drops below your defined threshold, you get notified instantly.
*   **Intelligent Averages:** You can set a "Message History Size". The extension calculates a rolling average over X messages, ensuring you don't get false alarms when starting a fresh chat (which naturally has 0% cache).
*   **Broad Compatibility:** Automatically detects cache stats from both OpenAI/OpenRouter standards (`cached_tokens`) and Anthropic standards (`cache_read_input_tokens`).

## 🛠️ Installation

You can install this directly through the SillyTavern interface:

1. Open SillyTavern and navigate to the **Extensions** menu (the block icon).
2. Click on **Install Extension**.
3. Paste the repository link: [https://github.com/Arczium/ST-Cache-Monitor](https://github.com/Arczium/ST-Cache-Monitor) and click install.
4. Refresh SillyTavern and configure the settings in the Extensions menu..

## ⚙️ Settings / Configuration

Once installed, you can find the settings under the Extensions menu:

*   **Enable Cache Monitoring:** Master switch to turn the tracking on or off.
*   **Show Warning Notifications:** Toggles the UI toast popups.
*   **Message History Size:** How many recent messages to include in the rolling average. (e.g., Setting this to `5` means it averages the last 5 generations before warning you).
*   **Warning Threshold (%):** If the rolling average falls below this percentage, a warning popup will appear.

---
*Created by Arczium*