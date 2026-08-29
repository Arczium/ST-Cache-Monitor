import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced, eventSource, event_types } from "../../../../script.js";

const extensionName = "ST-Cache-Monitor";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: true,
    alerts_enabled: true,
    history_size: 5,
    threshold: 50
};

// Array to store the recent cache hit percentages
let cacheHistory = [];
// Timer to prevent double-logging from ST's duplicate network requests
let lastLogTime = 0; 

async function initExtension() {
    // 1. Load Settings
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    const settings = Object.assign({}, defaultSettings, extension_settings[extensionName]);
    extension_settings[extensionName] = settings;

    // 2. Load UI
    const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
    $("#extensions_settings").append(settingsHtml);

    // 3. Bind UI Event Listeners (So sliders/checkboxes update variables immediately)
    $("#cachemon_enabled").on("change", function () {
        settings.enabled = $(this).is(":checked");
        saveSettingsDebounced();
    });
    
    $("#cachemon_alerts_enabled").on("change", function () {
        settings.alerts_enabled = $(this).is(":checked");
        saveSettingsDebounced();
    });
    
    $("#cachemon_history_size").on("input", function () {
        settings.history_size = parseInt($(this).val(), 10) || 5;
        saveSettingsDebounced();
    });
    
    $("#cachemon_threshold").on("input", function () {
        settings.threshold = parseInt($(this).val(), 10) || 50;
        saveSettingsDebounced();
    });

    // Set initial UI values based on saved settings
    $("#cachemon_enabled").prop("checked", settings.enabled);
    $("#cachemon_alerts_enabled").prop("checked", settings.alerts_enabled);
    $("#cachemon_history_size").val(settings.history_size);
    $("#cachemon_threshold").val(settings.threshold);

    console.log(`[Cache Monitor] Extension initialized. Listening to network traffic...`);

    // 4. Monkey Patch: Intercept browser network traffic
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        const url = args[0] instanceof Request ? args[0].url : args[0];
        
        // Only intercept local ST backend API calls
        if (typeof url === 'string' && url.includes('/api/')) {
            const clone = response.clone();
            clone.text().then(text => {
                if (text.includes('"prompt_tokens"') && (text.includes('"cached_tokens"') || text.includes('"cache_read_input_tokens"'))) {
                    
                    const promptMatch = text.match(/"prompt_tokens"\s*:\s*(\d+)/);
                    const cachedMatch = text.match(/"cached_tokens"\s*:\s*(\d+)/) || text.match(/"cache_read_input_tokens"\s*:\s*(\d+)/);

                    if (promptMatch && cachedMatch) {
                        const promptTokens = parseInt(promptMatch[1], 10);
                        const cachedTokens = parseInt(cachedMatch[1], 10);
                        
                        const now = Date.now();
                        if (now - lastLogTime < 2000) return;
                        lastLogTime = now;
                        
                        if (promptTokens > 0 && extension_settings[extensionName].enabled) {
                            const hitRate = (cachedTokens / promptTokens) * 100;
                            console.log(`[Cache Monitor] 🎯 Hit! Cache Rate: ${hitRate.toFixed(1)}%`);
                            
                            updateRollingAverage(hitRate);
                        }
                    }
                }
            }).catch(() => {});
        }
        return response;
    };
    // 5. Reset history on chat change
    eventSource.on(event_types.CHAT_CHANGED, () => {
        if (cacheHistory.length > 0) {
            cacheHistory = [];
            console.log(`[Cache Monitor] Chat changed. History reset.`);
        }
    });
}



// Function to calculate and manage the rolling average
function updateRollingAverage(newHitRate) {
    const settings = extension_settings[extensionName];
    
    cacheHistory.push(newHitRate);
    
    while (cacheHistory.length > settings.history_size) {
        cacheHistory.shift();
    }
    
    const sum = cacheHistory.reduce((total, current) => total + current, 0);
    const average = sum / cacheHistory.length;
    
    console.log(`[Cache Monitor] 📊 Rolling Average (${cacheHistory.length}/${settings.history_size} msgs): ${average.toFixed(1)}%`);
    
    // --- NOTIFICATION LOGIC ---
    // Only trigger if alerts are ON AND we have enough messages for a fair average
    if (settings.alerts_enabled && cacheHistory.length >= settings.history_size) {
        if (average < settings.threshold) {
            
            // Pop up the built-in SillyTavern toast notification
            toastr.warning(
                `Cache Hit Rate dropped to ${average.toFixed(1)}%<br><small>Threshold: ${settings.threshold}%</small>`,
                'Cache Monitor Alert',
                { timeOut: 5000, escapeHtml: false }
            );
            
            console.log(`[Cache Monitor] ⚠️ Alert triggered!`);
            // Reset the array so it waits X messages before alerting again
            cacheHistory = [];
            console.log(`[Cache Monitor] History reset to prevent alert spam.`);
        }
    }
}

jQuery(async () => {
    await initExtension();
});