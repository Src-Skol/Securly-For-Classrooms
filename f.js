function getChromeTabs(tabOptions) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(tabOptions, function (tabs) {
      chrome.runtime.lastError &&
        console.log(
          "Cannot get chrome tabs: " + chrome.runtime.lastError.message,
        ),
        resolve(tabs);
    });
  });
}
function getWindows() {
  return new Promise((resolve) => {
    chrome.windows.getAll({ populate: !0 }, (windows) => {
      resolve(windows);
    });
  });
}
async function getWindow(windowId) {
  return new Promise((resolve, reject) => {
    chrome.windows.get(windowId, (window) => {
      chrome.runtime.lastError
        ? reject(chrome.runtime.lastError.message)
        : resolve(window);
    });
  });
}
function getFocusedWindow() {
  return new Promise((resolve) => {
    chrome.windows.getLastFocused(null, function (window) {
      resolve(window);
    });
  });
}
function createWindow(urls) {
  return new Promise((resolve) => {
    const data = { focused: !0, state: "normal", type: "normal" };
    urls && (data.url = urls),
      chrome.windows.create(data, (window) => {
        resolve(window);
      });
  });
}
async function updateWindowFullscreen(windowId) {
  const updateInfo = { focused: !0, state: "fullscreen" };
  try {
    await updateWindow(windowId, updateInfo);
  } catch (error) {
    console.log(
      "Error while update to fullscreen: " + chrome.runtime.lastError.message,
    );
  }
}
async function updateWindow(windowId, updateInfo) {
  return new Promise((resolve, reject) => {
    chrome.windows.update(windowId, updateInfo, function (window) {
      chrome.runtime.lastError
        ? reject(chrome.runtime.lastError.message)
        : resolve();
    });
  });
}
async function getTab(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.get(tabId, function (tab) {
      chrome.runtime.lastError && reject(chrome.runtime.lastError.message),
        resolve(tab);
    });
  });
}
function openNewTab(createProperties) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create(createProperties, function (tab) {
      chrome.runtime.lastError
        ? reject(chrome.runtime.lastError.message)
        : resolve(tab);
    });
  });
}
function closeTab(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.remove(tabId, function () {
      chrome.runtime.lastError &&
        console.log("Error closing tab: " + chrome.runtime.lastError.message),
        resolve();
    });
  });
}
async function focusTab(tabId) {
  const tab = await getTab(tabId);
  if (tab)
    try {
      const window = await getWindow(tab.windowId);
      await updateWindow(window.id, { focused: !0 }),
        await updateTab(tabId, { active: !0 });
    } catch (error) {
      console.log("Error focusing tab: " + error);
    }
  else console.log("Not found tab with id=" + tabId);
}
function captureVisibleTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(function (screenshotUrl) {
      chrome.runtime.lastError && reject(chrome.runtime.lastError.message),
        void 0 === screenshotUrl && reject("No screenshot captured"),
        resolve(screenshotUrl);
    });
  });
}
async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, function (items) {
      chrome.runtime.lastError &&
        (console.log(
          "Error loading config from storage: " +
            chrome.runtime.lastError.message,
        ),
        resolve(new Config({}))),
        resolve(new Config(items));
    });
  });
}
async function getStoredUrls() {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_URLS, (urls) => {
      chrome.runtime.lastError
        ? (console.log("Failed to load urls from local storage"), resolve())
        : resolve(urls[STORAGE_URLS]);
    });
  });
}
async function getEmail() {
  return "function" == typeof getSubstitutedEmail
    ? Promise.resolve(getSubstitutedEmail())
    : IS_EXTENSION && chrome.identity
    ? new Promise((resolve) => {
        const prepare = function (email) {
          return email && email.trim().length > 0 ? email : null;
        };
        chrome.declarativeNetRequest
          ? chrome.identity.getProfileUserInfo(
              { accountStatus: "ANY" },
              function (userInfo) {
                resolve(prepare(userInfo.email));
              },
            )
          : chrome.identity.getProfileUserInfo(function (userInfo) {
              resolve(prepare(userInfo.email));
            });
      })
    : Promise.resolve(null);
}
async function getDirectoryDeviceId() {
  return new Promise((resolve, reject) => {
    chrome.enterprise && chrome.enterprise.deviceAttributes
      ? chrome.enterprise.deviceAttributes.getDirectoryDeviceId(
          function (deviceId) {
            console.log("Start with requested directory device ID=" + deviceId),
              resolve(deviceId);
          },
        )
      : resolve(null);
  });
}
function clearAllAlarms() {
  return new Promise((resolve) => {
    chrome.alarms.clearAll((wasCleared) => {
      wasCleared
        ? console.log("All alarms cleared")
        : (console.log("Alarms not cleared"),
          chrome.runtime.lastError &&
            console.log(
              "Alarms clear error: " + chrome.runtime.lastError.message,
            )),
        resolve();
    });
  });
}
async function sendCommandToTab(tabId, command) {
  try {
    await sendMessageToTab(tabId, command);
  } catch (error) {
    const m = "Could not establish connection. Receiving end does not exist";
    if (-1 === error.indexOf(m)) throw error;
    await injectScript(tabId), await sendMessageToTab(tabId, command);
  }
}
function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, async function (response) {
      chrome.runtime.lastError
        ? reject(chrome.runtime.lastError.message)
        : resolve();
    });
  });
}
function injectScript(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(
      tabId,
      { file: "teacherTools.js", allFrames: !1, runAt: "document_start" },
      function (result) {
        chrome.runtime.lastError
          ? (console.log("Failed to inject scripts"),
            reject(chrome.runtime.lastError.message))
          : resolve();
      },
    );
  });
}
function updateTab(tabId, properties) {
  return "number" != typeof tabId
    ? Promise.resolve()
    : new Promise((resolve, reject) => {
        chrome.tabs.update(tabId, properties, function () {
          chrome.runtime.lastError
            ? reject(chrome.runtime.lastError.message)
            : resolve();
        });
      });
}
function openLockWindow() {
  return new Promise((resolve, reject) => {
    chrome.windows.create(
      {
        state: "fullscreen",
        type: "popup",
        focused: !0,
        url: "blocking/block.html",
      },
      function (window) {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError.message)
          : resolve(window.id);
      },
    );
  });
}
function removeLockWindow(windowId) {
  return new Promise((resolve, reject) => {
    chrome.windows.remove(windowId, function () {
      chrome.runtime.lastError
        ? reject(chrome.runtime.lastError.message)
        : resolve();
    });
  });
}
async function getLocation() {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = position.coords,
          location = {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            accuracy: coordinates.accuracy,
          };
        console.log(
          "Lat: " +
            coordinates.latitude.toFixed(4) +
            " Lon: " +
            coordinates.longitude.toFixed(4),
        ),
          resolve(location);
      },
      (error) => {
        console.log("Error: " + error.code + " " + error.message);
        const location = { error: error.message };
        resolve(location);
      },
      { maximumAge: 6e5, timeout: 2e4 },
    );
  });
}
class Config {
  constructor(config) {
    (this.items = config),
      (this._defaultBlockMessage = "Your device is blocked"),
      (this.directoryDeviceId = null),
      (this._pingCount = 0),
      (this.isLoggedIn = !1),
      (this.announce = null),
      (this.sessionId = null),
      (this.studentId = null),
      (this.studentName = null),
      (this.canRaiseHand = !1),
      (this.isHandRaised = !1),
      (this.tabListenersAdded = !1),
      (this.chatMessages = []),
      (this.hasUnreadChatMessages = !1),
      (this.forceOpenChat = !1),
      (this.canStartChat = !1),
      (this.playChatAlert = !1),
      (this.closeTabsTimeout = null),
      (this.lockedToCourseWorkResources = !1),
      (this.maxOpenTabs = 0),
      (this.activeTab = null),
      (this.userEmail = null),
      (this.teacherId = null),
      (this.teacherName = null),
      (this.conferenceId = null),
      (this.conferenceToken = null),
      (this.conferenceTabId = null),
      (this.blockWindowId = 0),
      (this.maximizeFocusedWindow = !1),
      (this.loginErrorReason = null),
      (this.shareScreenHandler = null),
      (this.capturedScreen = null),
      config[STORAGE_SERVER_URL] ||
        (this.items[STORAGE_SERVER_URL] = HTTP_PROTOCOL + "://" + SERVER),
      config[STORAGE_SCREEN_BLOCK_MESSAGE] ||
        (this.items[STORAGE_SCREEN_BLOCK_MESSAGE] = this._defaultBlockMessage),
      config[STORAGE_BLOCKED_MODE_TYPE] ||
        (this.items[STORAGE_BLOCKED_MODE_TYPE] = PARAM_MODE_NONE),
      config[STORAGE_NOTIFICATION_INTERVAL] ||
        (this.items[STORAGE_NOTIFICATION_INTERVAL] = 0),
      config[STORAGE_IS_SCREEN_CAPTURE_ALLOWED] ||
        (this.items[STORAGE_IS_SCREEN_CAPTURE_ALLOWED] = !1),
      config[STORAGE_IS_CONTACT_ADMIN_ALLOWED] ||
        (this.items[STORAGE_IS_CONTACT_ADMIN_ALLOWED] = !1),
      config[STORAGE_CHROMEBOOK] || (this.items[STORAGE_CHROMEBOOK] = !1),
      config[STORAGE_UPDATE_CHECK_DATE] ||
        (this.items[STORAGE_UPDATE_CHECK_DATE] = new Date(
          "01 Jan 1970 00:00:00 GMT",
        ).getTime());
  }
  get serverUrl() {
    return this.items[STORAGE_SERVER_URL];
  }
  saveServerUrl(serverUrl) {
    return this.store(STORAGE_SERVER_URL, serverUrl);
  }
  get blocklist() {
    return this.items[STORAGE_BLOCKLIST];
  }
  saveBlocklist(blocklist) {
    return this.store(STORAGE_BLOCKLIST, blocklist).then(() =>
      this.store(STORAGE_WHITELIST, null),
    );
  }
  get customBlocklist() {
    return this.items[STORAGE_CUSTOM_BLOCKLIST];
  }
  get customBlocklistName() {
    return this.items[STORAGE_CUSTOM_BLOCKLIST_NAME];
  }
  saveCustomBlocklist(customBlocklist, customBlocklistName) {
    return this.store(STORAGE_CUSTOM_BLOCKLIST, customBlocklist).then(() =>
      this.store(STORAGE_CUSTOM_BLOCKLIST_NAME, customBlocklistName),
    );
  }
  get blockedModeType() {
    return this.items[STORAGE_BLOCKED_MODE_TYPE];
  }
  saveBlockedModeType(modeType) {
    return this.store(STORAGE_BLOCKED_MODE_TYPE, modeType);
  }
  get blockedText() {
    return this.items[STORAGE_SCREEN_BLOCK_MESSAGE]
      ? this.items[STORAGE_SCREEN_BLOCK_MESSAGE]
      : this._defaultBlockMessage;
  }
  get deviceName() {
    return this.items[STORAGE_DEVICE_NAME];
  }
  saveDeviceName(deviceName) {
    return this.store(STORAGE_DEVICE_NAME, deviceName);
  }
  get deviceUdid() {
    return this.items[STORAGE_UDID];
  }
  saveDeviceUdid(deviceUdid) {
    return this.store(STORAGE_UDID, deviceUdid);
  }
  get isChromeBook() {
    return this.items[STORAGE_CHROMEBOOK];
  }
  saveIsChromeBook(isChromeBook) {
    return this.store(STORAGE_CHROMEBOOK, isChromeBook);
  }
  get isChatActive() {
    return this.chatMessages.length > 0;
  }
  get isClassSessionActive() {
    return null != this.sessionId;
  }
  get isContactAdminAllowed() {
    return this.items[STORAGE_IS_CONTACT_ADMIN_ALLOWED];
  }
  get isScreenLocked() {
    return this.items[STORAGE_BLOCKED_MODE_TYPE] === PARAM_MODE_BLOCK;
  }
  get isScreenCaptureAllowed() {
    return this.items[STORAGE_IS_SCREEN_CAPTURE_ALLOWED];
  }
  get isSiteLocked() {
    return !!this.items[STORAGE_WHITELIST];
  }
  get notificationInterval() {
    return this.items[STORAGE_NOTIFICATION_INTERVAL];
  }
  get orgName() {
    return this.items[STORAGE_ORG_NAME];
  }
  get pingCount() {
    return this._pingCount++;
  }
  get updateCheckDate() {
    return new Date(parseInt(this.items[STORAGE_UPDATE_CHECK_DATE]));
  }
  async saveUpdateCheckDate(date) {
    return this.store(STORAGE_UPDATE_CHECK_DATE, date.getTime());
  }
  get whitelist() {
    return this.items[STORAGE_WHITELIST];
  }
  async saveWhitelist(whitelist) {
    return this.store(STORAGE_WHITELIST, whitelist);
  }
  async clearWhitelist() {
    return (
      (this.lockedToCourseWorkResources = !1),
      this.store(STORAGE_WHITELIST, null)
    );
  }
  async saveBlockedInfo(
    blockedMessage,
    modeType,
    notificationInterval,
    allowCaptureScreen,
    allowContactAdmin,
  ) {
    let savedItems = {};
    blockedMessage
      ? ((savedItems[STORAGE_SCREEN_BLOCK_MESSAGE] = blockedMessage),
        (this.items[STORAGE_SCREEN_BLOCK_MESSAGE] = blockedMessage))
      : ((savedItems[STORAGE_SCREEN_BLOCK_MESSAGE] = this._defaultBlockMessage),
        (this.items[STORAGE_SCREEN_BLOCK_MESSAGE] = this._defaultBlockMessage)),
      modeType &&
        ((savedItems[STORAGE_BLOCKED_MODE_TYPE] = modeType),
        (this.items[STORAGE_BLOCKED_MODE_TYPE] = modeType));
    let diagString =
      "Stored screen block modeType: " +
      modeType +
      ", message: " +
      blockedMessage;
    return (
      void 0 !== allowCaptureScreen &&
        ((savedItems[STORAGE_IS_SCREEN_CAPTURE_ALLOWED] = allowCaptureScreen),
        (this.items[STORAGE_IS_SCREEN_CAPTURE_ALLOWED] = allowCaptureScreen),
        (diagString += ", capture screen: " + allowCaptureScreen)),
      void 0 !== allowContactAdmin &&
        ((savedItems[STORAGE_IS_CONTACT_ADMIN_ALLOWED] = allowContactAdmin),
        (this.items[STORAGE_IS_CONTACT_ADMIN_ALLOWED] = allowContactAdmin),
        (diagString += ", allow contact admin: " + allowContactAdmin)),
      (diagString += ", notification interval: "),
      void 0 !== allowCaptureScreen &&
        notificationInterval !== LOC_PARAM_DONT_CHANGE &&
        ((savedItems[STORAGE_NOTIFICATION_INTERVAL] = notificationInterval),
        (this.items[STORAGE_NOTIFICATION_INTERVAL] = notificationInterval),
        (diagString += notificationInterval)),
      console.log(diagString),
      this.bulkStore(savedItems)
    );
  }
  async saveDeviceInfo(
    orgName,
    deviceName,
    lostModeType,
    lostModeMessage,
    notificationInterval,
    allowContactAdmin,
    allowScreenCapture,
  ) {
    let savedItems = {};
    return (
      (savedItems[STORAGE_ORG_NAME] = orgName),
      (this.items[STORAGE_ORG_NAME] = orgName),
      (savedItems[STORAGE_DEVICE_NAME] = deviceName),
      (this.items[STORAGE_DEVICE_NAME] = deviceName),
      (savedItems[STORAGE_BLOCKED_MODE_TYPE] = lostModeType),
      (this.items[STORAGE_BLOCKED_MODE_TYPE] = lostModeType),
      (savedItems[STORAGE_SCREEN_BLOCK_MESSAGE] = lostModeMessage),
      (this.items[STORAGE_SCREEN_BLOCK_MESSAGE] = lostModeMessage),
      (savedItems[STORAGE_NOTIFICATION_INTERVAL] = notificationInterval),
      (this.items[STORAGE_NOTIFICATION_INTERVAL] = notificationInterval),
      (savedItems[STORAGE_IS_CONTACT_ADMIN_ALLOWED] = allowContactAdmin),
      (this.items[STORAGE_IS_CONTACT_ADMIN_ALLOWED] = allowContactAdmin),
      (savedItems[STORAGE_IS_SCREEN_CAPTURE_ALLOWED] = allowScreenCapture),
      (this.items[STORAGE_IS_SCREEN_CAPTURE_ALLOWED] = allowScreenCapture),
      this.bulkStore(savedItems)
    );
  }
  store(key, value) {
    return value
      ? ((this.items[key] = value),
        new Promise((resolve) => {
          chrome.storage.local.set({ [key]: value }, function () {
            chrome.runtime.lastError
              ? console.log(
                  "Failed to save object " +
                    JSON.stringify(value) +
                    " for key '" +
                    key +
                    "'. Error is: " +
                    chrome.runtime.lastError.message,
                )
              : console.log(
                  "Stored " + JSON.stringify(value) + " for key: " + key,
                ),
              resolve();
          });
        }))
      : (delete this.items[key],
        new Promise((resolve) => {
          chrome.storage.local.remove([key], function () {
            chrome.runtime.lastError
              ? console.log(
                  "Failed to remove key '" +
                    key +
                    "'. Error is: " +
                    chrome.runtime.lastError.message,
                )
              : console.log("Key '" + key + "' removed"),
              resolve();
          });
        }));
  }
  bulkStore(object) {
    return new Promise((resolve) => {
      chrome.storage.local.set(object, function () {
        chrome.runtime.lastError
          ? console.log(
              "Failed to bulk save '" +
                JSON.stringify(object) +
                "'. Error is: " +
                chrome.runtime.lastError.message,
            )
          : console.log("Items " + JSON.stringify(object) + " saved"),
          resolve();
      });
    });
  }
  bulkDelete(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, function () {
        chrome.runtime.lastError
          ? console.log(
              "Failed to remove keys " +
                keys +
                " Error is: " +
                chrome.runtime.lastError.message,
            )
          : console.log("Keys " + keys + " removed"),
          resolve();
      });
    });
  }
}
const st = async function () {
  if (
    (chrome.alarms.clearAll(),
    "function" == typeof setTitle && setTitle(),
    IS_EXTENSION
      ? ((iconManager = new IconManager()),
        iconManager.noActiveClassIcon(),
        (config = await getConfig()))
      : (config = new Config({})),
    (router = new Router(config.serverUrl)),
    (config.userEmail = await getEmail()),
    IS_KIOSK &&
      (requestBlockScreen(
        config.blockedText,
        config.blockedModeType,
        config.notificationInterval,
        config.isScreenCaptureAllowed,
        config.isContactAdminAllowed,
      ),
      updateVersion()),
    IS_EXTENSION)
  ) {
    const storedUrls = await getStoredUrls();
    console.log("INIT URL STORAGE WITH URLS=" + JSON.stringify(storedUrls)),
      (urlStorage = new UrlStorage(storedUrls));
  }
  await obtainDirectoryDeviceId(), await loginToServer();
};
async function obtainDirectoryDeviceId() {
  const directoryDeviceId = await getDirectoryDeviceId();
  directoryDeviceId
    ? ((config.directoryDeviceId = directoryDeviceId),
      await config.saveIsChromeBook(!0))
    : "function" == typeof substituteDeviceId && substituteDeviceId();
}
const stp = function () {
  console.log("Stopping the app"), chrome.alarms.clearAll();
};
chrome.runtime.onSuspend.addListener(function () {
  console.log("App suspended");
});
class Router {
  constructor(url) {
    (this.url = url), console.log("Router initialized for " + this.url);
  }
  static getAck(message) {
    return message ? { seq: message.seq, response: message.requestType } : {};
  }
  updateUrl(newUrl) {
    (this.url = newUrl), console.log("Router url updated=" + this.url);
  }
  async sendCommand(message) {
    Object.assign(message, {
      version: VERSION,
      udid: config.deviceUdid,
      command: "ack",
    });
    try {
      return (
        console.log("Sending command=" + JSON.stringify(message)),
        await this.send(message, FIRE_PATH),
        !0
      );
    } catch (error) {
      return (
        console.log(
          "Failed to send command: " +
            JSON.stringify(message) +
            ".  Error=" +
            error,
        ),
        !1
      );
    }
  }
  async readCommands(messageAck) {
    return (
      Object.assign(messageAck, {
        version: VERSION,
        udid: config.deviceUdid,
        command: "ack",
      }),
      console.log("Sending ack=" + JSON.stringify(messageAck)),
      await this.send(messageAck, POLLING_PATH)
    );
  }
  async send(message, path) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      (xhr.timeout = HTTP_REQUEST_TIMEOUT),
        xhr.upload.addEventListener("error", function (event) {
          reject("XHR: Error in request upload");
        }),
        (xhr.ontimeout = function () {
          reject("XHR: Request timeout");
        }),
        xhr.open("POST", this.url + path),
        xhr.setRequestHeader(HEADER_REG_CODE, message.udid),
        xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8"),
        (xhr.onreadystatechange = async function () {
          if (this.readyState === XMLHttpRequest.DONE)
            if (0 === this.status) reject("Status 0");
            else if (200 === this.status)
              if (this.responseText && this.responseText.length > 0)
                try {
                  const response = JSON.parse(this.responseText);
                  resolve(response);
                } catch (error) {
                  let respText =
                    this.responseText.length > 200
                      ? this.responseText.substr(0, 200) + "..."
                      : this.responseText;
                  reject("XHR: Received incorrect response=" + respText);
                }
              else resolve();
            else
              this.status === HTTP_PRECONDITION_FAILED
                ? resolve({ requestType: REQUEST_UPGRADE })
                : reject(
                    "XHR: Server responded with http status=" + this.status,
                  );
        }),
        xhr.send(JSON.stringify(message));
    });
  }
}
async function processResponse(response) {
  if (!response) return Promise.resolve();
  console.log("Process server commands: " + JSON.stringify(response));
  let commands = response.commands,
    isMultiCommand = !0;
  if (!commands || 0 === commands.length) {
    if (!response.requestType) return Promise.resolve();
    isMultiCommand = !1;
  }
  try {
    if (isMultiCommand) {
      return {
        responses: await commands.reduce(async (previous, current) => {
          const previousResult = await previous,
            currentResult = await processCommand(current);
          return [...previousResult, currentResult];
        }, Promise.resolve([])),
      };
    }
    return await processCommand(response);
  } catch (error) {
    if (shouldRethrow(error)) throw error;
    console.log("Error while processResponse=" + error);
  }
}
async function processCommand(command) {
  const action = actionFunctions[command.requestType];
  let actionResult = null;
  return (
    void 0 !== action
      ? (actionResult = await action(command).catch((error) => {
          if (shouldRethrow(error)) throw error;
          console.log(
            "Failed to process action for '" +
              command.requestType +
              "': " +
              error,
          );
        }))
      : console.log("Got unknown message: " + command.requestType),
    actionResult || Router.getAck(command)
  );
}
async function pollServer() {
  console.log("Long polling started"),
    chrome.alarms.create(ALARM_SEND_URLS, { periodInMinutes: 1 });
  let errorCounter = 0,
    message = null;
  for (;;) {
    try {
      message || (message = Router.getAck()),
        (message = await processResponse(await router.readCommands(message))),
        (errorCounter = 0);
    } catch (error) {
      if (hasText(error, ERROR_DEVICE_NOT_FOUND)) break;
      if (hasText(error, ERROR_CANNOT_UPDATE_EXTENSION)) {
        console.log(error), processExtensionUpgradeError();
        break;
      }
      if ((errorCounter += 1) >= 3) {
        chrome.alarms.create(ALARM_RESTART_POLLING, { delayInMinutes: 1 }),
          console.log("Schedule server polling restart due to error=" + error);
        break;
      }
      console.log("Error #" + errorCounter + " while polling=" + error);
    }
    if (!config.isLoggedIn) {
      chrome.alarms.create(ALARM_REPEAT_LOGIN, { delayInMinutes: 1 }),
        console.log("Not logged in. Repeat login in 1 minute");
      break;
    }
  }
  console.log("Long polling stopped"), chrome.alarms.clear(ALARM_SEND_URLS);
}
function alarmProcessing(alarm) {
  switch ((console.log("Fired alarm " + alarm.name), alarm.name)) {
    case ALARM_SHOW_WARNING:
      config.isScreenLocked ||
        requestBlockScreen(
          config.blockedText,
          config.blockedModeType,
          LOC_PARAM_DONT_CHANGE,
          config.isScreenCaptureAllowed,
          config.isContactAdminAllowed,
        );
      break;
    case ALARM_REPEAT_LOGIN:
      loginToServer();
      break;
    case ALARM_SEND_PING:
      "undefined" != typeof lg && sendPing();
      break;
    case ALARM_SEND_URLS:
      sendLoggedUrls();
      break;
    case ALARM_RESTART_APP:
      chrome.runtime.reload();
      break;
    case ALARM_RESTART_POLLING:
      chrome.alarms.clear(ALARM_RESTART_POLLING), pollServer();
      break;
    case ALARM_WINDOWS_AGENT_CONNECT:
      chrome.alarms.clear(ALARM_WINDOWS_AGENT_CONNECT),
        nativeAgent.connect(nativeAgentMessageListener),
        nativeAgent.isConnected && nativeAgent.handshake();
      break;
    default:
      console.log("Cannot process alarm");
  }
}
function shouldRethrow(error) {
  const rethrowableErrors = [
    ERROR_DEVICE_NOT_FOUND,
    ERROR_CANNOT_UPDATE_EXTENSION,
  ];
  for (const sample of rethrowableErrors) if (hasText(error, sample)) return !0;
  return !1;
}
function sendPing() {
  const xhr = new XMLHttpRequest(),
    msg = "Ping " + config.pingCount,
    serverUrl = config.serverUrl + "/agent/chrome/debug";
  xhr.open("POST", serverUrl),
    xhr.setRequestHeader(HEADER_REG_CODE, config.deviceUdid),
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
  const message = {
    udid: config.deviceUdid,
    logString: msg,
    logNum: lg.logCount,
    logSource: "extension",
  };
  xhr.send(JSON.stringify(message)), (lg.logCount += 1);
}
async function sendLoggedUrls() {
  if (!urlStorage.hasUrls()) return;
  if (sendLoggedUrls.isSending) return;
  sendLoggedUrls.isSending = !0;
  const activeSession = config.sessionId;
  if (activeSession) {
    const tabs = await getChromeTabs({ active: !0, lastFocusedWindow: !0 });
    let domain,
      tabId = 0;
    if (tabs.length > 0) {
      const tab = tabs[0];
      void 0 !== tab.id &&
        tab.id !== chrome.tabs.TAB_ID_NONE &&
        (tabId = tab.id);
      const url = tab.url;
      void 0 !== url && (domain = parseDomain(url));
    }
    tabId > 0 &&
      domain &&
      urlStorage.saveUrl(activeSession, new Url(domain, tabs[0].title));
  }
  const message = { udid: config.deviceUdid, urls: urlStorage.getUrls() };
  try {
    await sendUrlHttpRequest(message),
      console.log("Urls sent successfully"),
      urlStorage.purge(),
      (sendLoggedUrls.isSending = !1);
  } catch (error) {
    (sendLoggedUrls.isSending = !1),
      console.log("Error while sending urls: " + error);
  }
}
async function sendUrlHttpRequest(message) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest(),
      errMsg = "Failed to send urls to the server: ";
    (xhr.timeout = HTTP_REQUEST_TIMEOUT),
      xhr.upload.addEventListener("error", function (event) {
        reject(errMsg);
      }),
      (xhr.ontimeout = function () {
        reject(errMsg + "Request timeout");
      }),
      (xhr.onreadystatechange = function () {
        this.readyState === XMLHttpRequest.DONE &&
          (200 === this.status
            ? resolve()
            : (0 === this.status || this.status >= 400) &&
              reject("Failed to send urls to the server: " + this.status));
      });
    const serverUrl = config.serverUrl + "/agent/chrome/url";
    xhr.open("POST", serverUrl),
      xhr.setRequestHeader(HEADER_REG_CODE, config.deviceUdid),
      xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8"),
      xhr.send(JSON.stringify(message));
  });
}
async function loginToServer(showErrorPage) {
  console.log("Initiate login at " + new Date()), await clearAllAlarms();
  try {
    if (
      (await processResponse(await getOrgUrlIfNeeded()),
      await processResponse(await sendAuthenticateIfNeeded()),
      !(await sendLogin()))
    )
      return (
        console.log("Failed to login. Repeat in 1 minute"),
        void chrome.alarms.create(ALARM_REPEAT_LOGIN, { periodInMinutes: 1 })
      );
    IS_EXTENSION &&
      (chrome.browserAction.onClicked.removeListener(loginToServer),
      chrome.runtime.onMessage.removeListener(pageMessageListener)),
      "undefined" != typeof lg && (lg.logCount = 0),
      (config.pingCount = 0),
      (config.loginErrorReason = null),
      pollServer();
  } catch (error) {
    hasText(error, ERROR_DEVICE_NOT_FOUND)
      ? (console.log("Failed to authenticate: " + error),
        console.log("Logout and login again to connect"),
        showErrorPage &&
          config.loginErrorReason &&
          config.loginErrorReason !== REASON_WINDOWS_NOT_ALLOWED &&
          (await showNotFoundScreen()))
      : hasText(error, ERROR_CANNOT_UPDATE_EXTENSION)
      ? (console.log(error), processExtensionUpgradeError())
      : (console.log("Failed to login: " + error),
        chrome.alarms.create(ALARM_REPEAT_LOGIN, { periodInMinutes: 1 }));
  }
}
function loginFromButton() {
  loginToServer(!0);
}
async function showNotFoundScreen() {
  const notFoundUrl = chrome.extension.getURL("notfound.html");
  try {
    await openNewTab({ url: notFoundUrl });
  } catch (error) {
    console.log("Cannot open not found page due to error: " + error);
  }
}
function getOrgUrlIfNeeded() {
  const requestServerUrl = config.serverUrl === HTTP_PROTOCOL + "://" + SERVER,
    deviceId = config.directoryDeviceId;
  if (
    (console.log(
      "Request server url=" +
        requestServerUrl +
        " config.serverUrl=" +
        config.serverUrl +
        " udid=" +
        deviceId,
    ),
    !requestServerUrl)
  )
    return Promise.resolve();
  const message = {
    command: COMMAND_GET_ORG_URL,
    udid: deviceId,
    kiosk: IS_KIOSK,
    userEmail: IS_KIOSK ? "kiosk" : config.userEmail,
    version: VERSION,
    userAgent: navigator.userAgent,
  };
  return (
    console.log("Get org url message=" + JSON.stringify(message)),
    router.send(message, POLLING_PATH)
  );
}
async function sendAuthenticateIfNeeded() {
  if (config.deviceUdid) return Promise.resolve();
  const message = {
    command: COMMAND_AUTHENTICATE,
    userEmail: config.userEmail,
    kiosk: IS_KIOSK,
    version: VERSION,
    userAgent: navigator.userAgent,
  };
  return (
    config.directoryDeviceId
      ? (message.udid = config.directoryDeviceId)
      : (message.byod = !0),
    console.log("Send AUTHENTICATE=" + JSON.stringify(message)),
    router.send(message, POLLING_PATH)
  );
}
function sendLogin() {
  const isWebLocked = void 0 !== config.whitelist,
    userAgent = navigator.userAgent,
    message = {
      response: COMMAND_LOGIN,
      kiosk: IS_KIOSK,
      userEmail: IS_KIOSK ? "kiosk" : config.userEmail,
      isClassSessionActive: config.isClassSessionActive,
      isScreenLocked: config.isScreenLocked,
      isWebLocked: isWebLocked,
      userAgent: userAgent,
    };
  return router.sendCommand(message);
}
function sendAppList(appList, userId) {
  return router.sendCommand({
    response: COMMAND_APP_LIST,
    appList: appList,
    userId: userId,
  });
}
function sm(textMessage) {
  const message = { response: COMMAND_SEND_MESSAGE, text: textMessage };
  router.sendCommand(message);
}
async function sendScreenshot(dataUri, message) {
  const maxWidth = void 0 !== message.maxWidth ? message.maxWidth : 0,
    maxHeight = void 0 !== message.maxHeight ? message.maxHeight : 0,
    blob = await resizeImage(dataUri, maxWidth, maxHeight);
  let serverUrl = buildServerUrlForScreenshot(message.url);
  void 0 !== message.tabUrl &&
    (serverUrl += "&tabUrl=" + encodeURIComponent(message.tabUrl)),
    void 0 !== message.tabTitle &&
      (serverUrl += "&tabTitle=" + encodeURIComponent(message.tabTitle)),
    performSendScreenshotRequest(serverUrl, blob);
}
async function performSendScreenshotRequest(serverUrl, blob) {
  return new Promise((resolve) => {
    let xhr = new XMLHttpRequest();
    (xhr.timeout = HTTP_REQUEST_TIMEOUT),
      xhr.upload.addEventListener("error", function (event) {
        console.log("Failed to upload screenshot to url=" + serverUrl);
      }),
      (xhr.ontimeout = function () {
        console.log("Timeout while uploading screenshot to url=" + serverUrl);
      }),
      xhr.open("POST", serverUrl),
      xhr.setRequestHeader(HEADER_REG_CODE, config.deviceUdid),
      xhr.setRequestHeader("Content-Type", "image/jpg"),
      (xhr.onreadystatechange = function () {
        this.readyState === XMLHttpRequest.DONE &&
          (this.status >= 200 && this.status < 400
            ? console.log("Screenshot send complete to url=" + serverUrl)
            : console.log(
                "Status=" +
                  this.status +
                  ". Failed to upload screenshot to url=" +
                  serverUrl,
              ),
          resolve(204 !== this.status));
      }),
      xhr.send(blob);
  });
}
function buildServerUrlForScreenshot(urlPath) {
  let serverUrl = config.serverUrl + urlPath;
  return (
    -1 !== serverUrl.indexOf("uid=")
      ? (serverUrl += "&udid=" + config.deviceUdid)
      : (serverUrl += "?udid=" + config.deviceUdid),
    config.userEmail &&
      (serverUrl += "&userEmail=" + encodeURIComponent(config.userEmail)),
    serverUrl
  );
}
function requestVideoConferenceToken(conferenceId) {
  const requestTokenMessage = {
    response: COMMAND_REQUEST_CONFERENCE_TOKEN,
    conferenceId: conferenceId,
  };
  return router.sendCommand(requestTokenMessage);
}
function resizeImage(dataUri, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
    if (0 === maxWidth && 0 === maxHeight)
      console.log("Image will not be resized"), resolve(dataUri);
    else {
      let img = document.createElement("img");
      (img.onload = function (event) {
        const width = img.width,
          height = img.height,
          widthFactor = Math.min(maxWidth / width, 1),
          heightFactor = Math.min(maxHeight / height, 1);
        let scaleFactor;
        1 ===
          (scaleFactor =
            0 !== widthFactor && 0 !== heightFactor
              ? widthFactor < heightFactor
                ? widthFactor
                : heightFactor
              : 0 !== widthFactor
              ? widthFactor
              : heightFactor) &&
          (console.log("Image will not be resized"), resolve(dataUri)),
          resolve(steppedResize(img, scaleFactor));
      }),
        (img.src = dataUri);
    }
  })
    .then((result) => fetch(result))
    .then((res) => res.blob());
}
function steppedResize(img, scaleFactor) {
  const nOfsteps = Math.ceil(Math.log(1 / scaleFactor) / Math.log(2));
  let tCanvas = document.createElement("canvas"),
    tCtx = tCanvas.getContext("2d");
  (tCtx.imageSmoothingEnabled = !0), (tCtx.imageSmoothingQuality = "high");
  let cur = { width: img.width, height: img.height };
  for (let i = 1; i <= nOfsteps; i++) {
    const currentScaleFactor = scaleFactor + (1 - scaleFactor) / (2 * i),
      scaledWidth = Math.floor(img.width * currentScaleFactor),
      scaledHeight = Math.floor(img.height * currentScaleFactor);
    1 === i
      ? ((tCanvas.width = scaledWidth),
        (tCanvas.height = scaledHeight),
        tCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight))
      : tCtx.drawImage(
          tCanvas,
          0,
          0,
          cur.width,
          cur.height,
          0,
          0,
          scaledWidth,
          scaledHeight,
        ),
      (cur = { width: scaledWidth, height: scaledHeight });
  }
  let canvas = document.createElement("canvas");
  (canvas.width = Math.floor(img.width * scaleFactor)),
    (canvas.height = Math.floor(img.height * scaleFactor));
  let ctx = canvas.getContext("2d");
  return (
    (ctx.imageSmoothingEnabled = !0),
    (ctx.imageSmoothingQuality = "high"),
    ctx.drawImage(
      tCanvas,
      0,
      0,
      cur.width,
      cur.height,
      0,
      0,
      canvas.width,
      canvas.height,
    ),
    canvas.toDataURL("image/jpeg")
  );
}
function hasText(error, text) {
  return "string" == typeof error && error.toLowerCase().includes(text);
}
chrome.alarms.onAlarm.addListener(alarmProcessing);
class Url {
  constructor(domain, tabTitle, isBlocked) {
    (this.domain = domain),
      (this.tabTitle = tabTitle),
      (this.isBlocked = !!isBlocked),
      (this.timestamp = Date.now());
  }
}
class UrlStorage {
  constructor(urls) {
    (this.urls = "object" == typeof urls ? urls : {}),
      (this.lastVisitedUrl = null);
  }
  saveUrl(sessionId, url) {
    sessionId || (sessionId = "blocked");
    let sessionUrls = this.urls[sessionId];
    if (
      (sessionUrls ||
        ((sessionUrls = []), (this.urls[sessionId] = sessionUrls)),
      !this.isLast(url))
    )
      if (
        ((this.lastVisitedUrl = url),
        url.domain.length < 1e3 && (!url.tabTitle || url.tabTitle.length < 255))
      )
        sessionUrls.push(url);
      else {
        const shortUrl = new Url(
          url.domain.substr(0, 1e3),
          url.tabTitle ? url.tabTitle.substr(0, 255) : null,
          url.isBlocked,
        );
        sessionUrls.push(shortUrl);
      }
    chrome.storage.local.set({ [STORAGE_URLS]: this.urls }, () => {
      chrome.runtime.lastError &&
        console.log(
          "Failed to save urls to local storage. Error is: " +
            chrome.runtime.lastError.message,
        );
    });
  }
  isLast(url) {
    return (
      this.lastVisitedUrl instanceof Url &&
      this.lastVisitedUrl.domain === url.domain
    );
  }
  hasUrls() {
    return Object.keys(this.urls).length > 0;
  }
  getUrls() {
    return this.urls;
  }
  purge() {
    (this.urls = {}),
      (this.lastVisitedUrl = null),
      chrome.storage.local.remove(STORAGE_URLS, () => {
        chrome.runtime.lastError
          ? console.log(
              "Failed to clear urls from local storage: " +
                chrome.runtime.lastError.message,
            )
          : getStoredUrls().then((urls) => {
              void 0 !== urls
                ? console.log("Failed to clear urls from local storage")
                : console.log("Urls cleared from local storage");
            });
      });
  }
}
chrome.runtime.onUpdateAvailable.addListener(function (details) {
  IS_EXTENSION &&
    (console.log(
      "Extension update available, will reload. Current version=" + VERSION,
    ),
    chrome.runtime.reload());
});
class IconManager {
  constructor() {
    (this.active = !1), (this.sharesScreen = !1);
  }
  isActive() {
    return this.active;
  }
  activeClassIcon() {
    chrome.browserAction.setIcon({ path: "logo16.png" }, function () {
      iconManager.active = !0;
    });
  }
  noActiveClassIcon() {
    chrome.browserAction.setIcon({ path: "logo16mono.png" }, function () {
      iconManager.active = !1;
    });
  }
  raiseHandIcon() {
    chrome.browserAction.setIcon({ path: "hand.png" });
  }
  shareScreenIcon() {
    chrome.browserAction.setIcon({ path: "logo16share.png" }, function () {
      iconManager.sharesScreen = !0;
    });
  }
  noShareScreenIcon() {
    let path = this.active ? "logo16.png" : "logo16mono.png";
    chrome.browserAction.setIcon({ path: path }, function () {
      iconManager.sharesScreen = !1;
    });
  }
  clearRaiseHandIcon() {
    this.sharesScreen
      ? this.shareScreenIcon()
      : this.active
      ? this.activeClassIcon()
      : this.noActiveClassIcon();
  }
  static markNotAuthorized() {
    chrome.browserAction.setBadgeText({ text: "!" }),
      chrome.browserAction.setBadgeBackgroundColor({ color: "#F00" });
  }
  static clearBadge() {
    chrome.browserAction.setBadgeText({ text: "" });
  }
}
function updateTabListeners() {
  const listenersShouldBeAdded = config.isClassSessionActive;
  !config.tabListenersAdded && listenersShouldBeAdded
    ? (chrome.tabs.onActivated.addListener(tabListenerOnActivate),
      chrome.tabs.onCreated.addListener(tabListenerOnCreate),
      chrome.tabs.onUpdated.addListener(tabListenerOnUpdate),
      (config.tabListenersAdded = !0))
    : config.tabListenersAdded &&
      !listenersShouldBeAdded &&
      (chrome.tabs.onActivated.removeListener(tabListenerOnActivate),
      chrome.tabs.onCreated.removeListener(tabListenerOnCreate),
      chrome.tabs.onUpdated.removeListener(tabListenerOnUpdate),
      (config.tabListenersAdded = !1));
}
function updateIdleListeners(idleTimeout) {
  idleTimeout > 0
    ? (chrome.idle.setDetectionInterval(60 * idleTimeout),
      chrome.idle.onStateChanged.addListener(idleStateListener))
    : chrome.idle.onStateChanged.removeListener(idleStateListener);
}
function idleStateListener(idleState) {
  const message = {
    response: COMMAND_IDLE_STATUS_CHANGE,
    isIdle: "active" !== idleState,
  };
  router.sendCommand(message);
}
async function updateLockStatus(clearTabsCloseWarning) {
  const isSiteLocked = config.isSiteLocked,
    isScreenLocked = config.isScreenLocked,
    tabs = await getChromeTabs({});
  for (const tab of tabs)
    if (!isSiteLocked || void 0 === tab.url || !isDomainExcluded(tab.url))
      try {
        await sendLockStatusToTab(tab, "onApply", clearTabsCloseWarning),
          await updateTab(tab.id, { muted: isScreenLocked });
      } catch (error) {
        console.log("Error updating lock status: " + error);
      }
}
function updateWindowListeners() {
  if (config.isClassSessionActive) {
    const needFocusListener =
        (config.isScreenLocked || config.maximizeFocusedWindow) &&
        !chrome.windows.onFocusChanged.hasListener(windowFocusChangeListener),
      needBoundsListener =
        config.maximizeFocusedWindow &&
        !chrome.windows.onBoundsChanged.hasListener(windowBoundsChangeListener),
      needRemoveListener =
        config.isScreenLocked &&
        !chrome.windows.onRemoved.hasListener(windowRemoveListener);
    needFocusListener &&
      chrome.windows.onFocusChanged.addListener(windowFocusChangeListener),
      needBoundsListener &&
        (chrome.windows.onBoundsChanged.addListener(windowBoundsChangeListener),
        chrome.windows.onCreated.addListener(windowBoundsChangeListener)),
      needRemoveListener &&
        chrome.windows.onRemoved.addListener(windowRemoveListener);
  } else
    chrome.windows.onFocusChanged.removeListener(windowFocusChangeListener),
      chrome.windows.onRemoved.removeListener(windowRemoveListener),
      chrome.windows.onBoundsChanged.removeListener(windowBoundsChangeListener),
      chrome.windows.onCreated.removeListener(windowBoundsChangeListener);
}
async function windowFocusChangeListener(param) {
  if (
    !config.maximizeFocusedWindow ||
    config.isScreenLocked ||
    "number" != typeof param ||
    param === chrome.windows.WINDOW_ID_NONE ||
    param === config.blockWindowId
  ) {
    if (config.isScreenLocked && config.isChromeBook) {
      if (!config.blockWindowId) {
        const focusedWindow = await getFocusedWindow();
        if (!focusedWindow) return;
        config.blockWindowId = focusedWindow.id;
      }
      (void 0 !== param &&
        ("number" != typeof param ||
          (param !== chrome.windows.WINDOW_ID_NONE &&
            param === config.blockWindowId))) ||
        (await updateWindowFullscreen(config.blockWindowId));
    }
  } else await updateWindow(param, { state: "maximized" });
}
async function windowRemoveListener(param) {
  config.isScreenLocked &&
    config.blockWindowId === param &&
    setTimeout(async () => {
      try {
        (config.blockWindowId = await openLockWindow()),
          await updateWindowFullscreen(config.blockWindowId);
      } catch (error) {
        console.log("Cannot make window fullscreen: " + error);
      }
    }, 1e3);
}
async function windowBoundsChangeListener(window) {
  if ("normal" === window.type && window.id !== config.blockWindowId)
    try {
      await updateWindow(window.id, { state: "maximized" });
    } catch (error) {
      console.log("Cannot maximize window: " + error);
    }
}
function nativeAgentMessageListener(message) {
  const action = message.action;
  switch (action) {
    case AGENT_CLOSE_APP:
      const response = {
        response: REQUEST_CLOSE_APP,
        app: message.app,
        userId: message.userId,
        isClosed: !0,
      };
      message.isClosed ||
        ((response.isClosed = !1), (response.error = message.error)),
        router.sendCommand(response);
      break;
    case AGENT_HANDSHAKE:
      "undefined" != typeof lg && nativeAgent.updateLogging(lg.logEnabled);
      const version = message.version;
      console.log("Native agent communication established. Version=" + version),
        router.sendCommand({
          response: COMMAND_WINDOWS_AGENT_INFO,
          agentVersion: version,
        }),
        setTitle(TITLE_CLASS_SESSION, version);
      break;
    case AGENT_GET_APPS:
      sendAppList(message.appList, message.userId);
      break;
    default:
      console.log("Native agent sent unknown command=" + action);
  }
}
async function updateChatStatus(chatMessage) {
  const tabs = await getChromeTabs({});
  for (const tab of tabs)
    try {
      await sendChatStatusToTab(tab, "onApply", chatMessage);
    } catch (error) {
      console.log(
        "Catched update chat state error for tab=" +
          tab.id +
          " '" +
          tab.url +
          "': " +
          error,
      );
    }
}
async function checkMaxTabs(tab) {
  if (config.maxOpenTabs > 0) {
    return (await getChromeTabs({})).length > config.maxOpenTabs
      ? (void 0 !== tab.id
          ? await closeTab(tab.id)
          : console.log("Cannot close tab, no tab.id"),
        Promise.resolve(!1))
      : Promise.resolve(!0);
  }
  return Promise.resolve(!0);
}
function tabListenerOnActivate(activeTabInfo) {
  const activeTabId = activeTabInfo.tabId;
  if (null != config.activeTabId) {
    if (config.activeTabId !== activeTabId && config.isChatActive) {
      const messageToClose = {
        command: "chatStatus",
        chat: !0,
        forceCloseChat: !0,
      };
      if (
        (sendCommandToTab(config.activeTabId, messageToClose)
          .then(() => {
            console.log(
              "Command to close chat in tabId=" +
                config.activeTabId +
                " sent. New active tabId=" +
                activeTabId,
            ),
              (config.activeTabId = activeTabId);
          })
          .catch((error) => {
            console.log(
              "Error=" +
                error +
                ". Command to close chat in tabId=" +
                config.activeTabId +
                " NOT sent. New active tabId=" +
                activeTabId,
            );
          }),
        config.hasUnreadChatMessages && config.forceOpenChat)
      ) {
        sendCommandToTab(activeTabId, {
          command: "chatStatus",
          chat: !0,
          forceOpenChat: !0,
        })
          .then(() => {
            console.log(
              "Command to open chat in tabId=" + activeTabId + " sent.",
            );
          })
          .catch((error) => {
            console.log(
              "Error= " +
                error +
                ". Command to open chat in tabId=" +
                activeTabId +
                " NOT sent.",
            );
          });
      }
    }
  } else config.activeTabId = activeTabId;
}
function tabListenerOnCreate(tab) {
  (null !== config.conferenceId && "loading" === tab.status) ||
    (tab.url && isOwnPageUrl(tab.url)) ||
    checkMaxTabs(tab)
      .then((shallContinue) =>
        shallContinue
          ? sendChatStatusToTab(tab, "onCreate")
          : Promise.reject("Tabs limit exceeded"),
      )
      .catch((error) => {
        console.log(
          "Catched on tab create listener error: " + JSON.stringify(error),
        );
      });
}
function tabListenerOnUpdate(tabId, changeInfo, tab) {
  if ("complete" === changeInfo.status) {
    if (
      null !== config.conferenceId &&
      (void 0 === tab.url || isOwnPageUrl(tab.url))
    )
      return;
    checkMaxTabs(tab)
      .then(() => sendChatStatusToTab(tab, "onUpdate"))
      .then(() => {
        if (config.isScreenLocked) return sendLockStatusToTab(tab, "onUpdate");
      })
      .catch((error) => {
        console.log(
          "Catched on tab update listener error: " + JSON.stringify(error),
        );
      });
  }
}
async function sendLockStatusToTab(tab, messageType, clearTabsCloseWarning) {
  if (void 0 === tab.status || void 0 === tab.url) return Promise.resolve();
  if ("number" == typeof tab.id) {
    if (
      !isAllowed(
        tab.url,
        ["https?:\\/\\/chrome\\.google\\.com\\/webstore\\/?.*?"],
        !1,
      ) &&
      (config.isScreenLocked || config.isSiteLocked || null !== config.announce)
    )
      return await closeTab(tab.id), Promise.resolve();
    const showWarning =
        (null !== config.closeTabsTimeout && !clearTabsCloseWarning) || null,
      tabLockMessage = {
        command: "lockStatus",
        announce: config.announce,
        announceTitle:
          "Announcement from" +
          (config.teacherName ? ": " + config.teacherName : " your teacher"),
        lock: config.isSiteLocked
          ? "This site is not available during site lock"
          : config.isScreenLocked
          ? config.blockedText
          : null,
        tabsCloseWarning: showWarning,
        messageType: messageType,
      };
    try {
      await sendCommandToTab(tab.id, tabLockMessage);
    } catch (error) {
      -1 !== error.indexOf("chrome://")
        ? await closeTab(tab.id)
        : console.log(
            "Lock not sent to tab '" +
              tab.id +
              " {status:" +
              tab.status +
              ", discarded:" +
              tab.discarded +
              "} " +
              tab.title +
              "'. Error: " +
              error,
          );
    }
  }
}
async function sendChatStatusToTab(tab, messageType, chatMessage) {
  return void 0 === tab.status || void 0 === tab.url
    ? Promise.resolve()
    : new Promise(async (resolve, reject) => {
        if ("number" == typeof tab.id) {
          const tabChatMessage = {
            command: "chatStatus",
            messageType: messageType,
          };
          config.isChatActive
            ? ((tabChatMessage.chat = !0),
              chatMessage
                ? (tabChatMessage.chatMessage = chatMessage)
                : config.hasUnreadChatMessages &&
                  (tabChatMessage.chatMessage =
                    config.chatMessages[config.chatMessages.length - 1]),
              tabChatMessage.chatMessage &&
                tab.highlighted &&
                config.forceOpenChat &&
                (tabChatMessage.forceOpenChat = !0))
            : (tabChatMessage.chat = !1),
            console.log(
              "Send chat status message=" +
                JSON.stringify(tabChatMessage) +
                " tabId=" +
                tab.id +
                " '" +
                tab.url +
                "'",
            );
          try {
            await sendCommandToTab(tab.id, tabChatMessage), resolve();
          } catch (error) {
            reject("Failed to send chat status:" + error);
          }
        }
      });
}
function isDomainExcluded(url) {
  return !!config.whitelist && isAllowed(url, config.whitelist, !0);
}
function openSites(urls) {
  let p = Promise.resolve();
  return (
    urls.forEach((url) => {
      p = p.then(() => openNewTab({ url: url, active: !0 }));
    }),
    p.catch((error) => {
      console.log("Error while open sites: " + error);
    }),
    p
  );
}
async function closeTabs(openedTabs, keepBlankTabOpen) {
  if (!openedTabs || 0 === openedTabs.length) return Promise.resolve();
  const tabIds = openedTabs.map((tab) => tab.id);
  return keepBlankTabOpen && (await openNewTab({})), closeTab(tabIds);
}
async function warnAboutTabsClose(seconds) {
  let tabs = await getChromeTabs({});
  const tabCloseWarnMessage = {
    command: "tabCloseWarning",
    delaySeconds: seconds,
  };
  for (const tab of tabs) {
    if (void 0 === tab.status || void 0 === tab.url) return;
    if ("number" == typeof tab.id)
      try {
        await sendCommandToTab(tab.id, tabCloseWarnMessage);
      } catch (error) {
        console.log("Error while apply tabs close warning: " + error);
      }
  }
}
async function siteLock(urls, shouldCloseTabs, notOpenTabs = !1) {
  try {
    let openedTabs;
    if (
      (await updateLockStatus(),
      shouldCloseTabs && (openedTabs = await getChromeTabs({})),
      !notOpenTabs)
    ) {
      const windows = await getWindows();
      windows && 0 !== windows.length
        ? await openSites(urls)
        : await createWindow(urls);
    }
    shouldCloseTabs && (await closeTabs(openedTabs, notOpenTabs));
  } catch (error) {
    console.log("Error while site lock: " + JSON.stringify(error));
  }
}
async function closeSharedScreenTab() {
  const pattern = config.serverUrl + "/chrome/screenshare*",
    tabs = await getChromeTabs({ url: pattern });
  for (const tab of tabs) tab.id && (await closeTab(tab.id));
}
function updateIconAndTitle(isSessionActive, hasWindowsAgent) {
  iconManager || (iconManager = new IconManager()),
    isSessionActive
      ? (iconManager.activeClassIcon(), setTitle(TITLE_CLASS_SESSION))
      : (iconManager.noActiveClassIcon(), setTitle());
}
function setTitle(message, windowsAgentVersion) {
  const titleDetails = {};
  if (void 0 !== message) {
    let title = message + "\n";
    void 0 !== windowsAgentVersion &&
      (title += "Windows agent " + windowsAgentVersion + "\n"),
      (titleDetails.title = title + VERSION);
  } else titleDetails.title = VERSION;
  chrome.browserAction.setTitle(titleDetails);
}
function processExtensionUpgradeError() {
  chrome.alarms.create(ALARM_RESTART_APP, { delayInMinutes: 5 }),
    console.log("Schedule app restart in 5 minutes");
}
function updatePopup(isSessionActive) {
  const popup = isSessionActive ? "popup.html" : "";
  chrome.browserAction.setPopup({ popup: popup }, () => {
    console.log("Popup set to " + (isSessionActive ? popup : "none"));
  });
}
function clearTeacherMessage() {
  const message = createAnnouncementResponse(!0);
  (config.announce = null),
    (config.teacherId = null),
    updateTabListeners(),
    updateLockStatus().then(router.sendCommand(message));
}
function createAnnouncementResponse(isRead) {
  return {
    response: REQUEST_TEACHER_MESSAGE,
    isConfirmed: isRead,
    teacherId: config.teacherId,
  };
}
function updateMessageListener(isSessionActive) {
  isSessionActive
    ? (chrome.runtime.onMessage.addListener(pageMessageListener),
      console.log("MESSAGE LISTENER ADDED"))
    : (chrome.runtime.onMessage.removeListener(pageMessageListener),
      console.log("MESSAGE LISTENER REMOVED"));
}
function pageMessageListener(request, sender, response) {
  switch (
    (console.log(
      "Got message from tab=" +
        JSON.stringify(sender.tab) +
        " Message=" +
        JSON.stringify(request),
    ),
    request.action)
  ) {
    case "popup":
      return processPopupMessages(request, sender, response);
    case "notfound":
      processNotFoundPageMessages(request, sender, response);
      break;
    case "teacherMessage":
      clearTeacherMessage();
      break;
    case "clearTabsCloseWarning":
      updateTabListeners(),
        updateLockStatus(!0),
        console.log("Tabs close warning cleared by student"),
        response();
      break;
    case "respondToShareScreen":
      processShareScreenResponse(request);
      break;
    case "respondToVideoCall":
      processVideoCallResponse(request);
      break;
    case "chat":
      return processChatMessages(request, sender, response);
    case "conference":
      processConferenceMessages(request, sender, response);
      break;
    case "resizeLocked":
      windowFocusChangeListener();
      break;
    case "getLockText":
      config.isScreenLocked ? response(config.blockedText) : response(null);
      break;
    case "call":
      response({
        token: config.conferenceToken,
        studentName: config.studentName,
      });
      break;
    default:
      console.log(
        "Received incorrect message in pageMessageListener=" +
          JSON.stringify(request),
      );
  }
}
function processShareScreenResponse(request) {
  updateLockStatus();
  const isConfirmed = request.isConfirmed,
    message = {
      response: REQUEST_SHARE_SCREEN,
      userId: request.userId,
      lock: request.lock,
      isConfirmed: isConfirmed,
    };
  if ((router.sendCommand(message), isConfirmed)) {
    const deviceId = request.deviceId,
      shareScreenUrl =
        config.serverUrl + "/agent/sharescreen/upload?did=" + deviceId;
    (config.shareScreenHandler = setInterval(
      shareScreen,
      4e3,
      shareScreenUrl,
      1024,
    )),
      iconManager.shareScreenIcon();
  }
}
function processVideoCallResponse(request) {
  updateLockStatus();
  const isConfirmed = request.isConfirmed,
    message = {
      response: COMMAND_VIDEO_CALL,
      userId: request.userId,
      isConfirmed: isConfirmed,
    };
  router.sendCommand(message);
}
async function shareScreen(shareScreenUrl, maxWH) {
  let isRequestedFromAgent = !1;
  if (
    (nativeAgent.isConnected &&
      (isRequestedFromAgent = nativeAgent.requestScreenshot(
        shareScreenUrl,
        maxWH,
        maxWH,
      )),
    isRequestedFromAgent)
  )
    console.log("Screenshot requested from native agent");
  else {
    try {
      config.capturedScreen = await captureVisibleTab();
    } catch (error) {
      return void console.log("Cannot capture visible tab: " + error);
    }
    performSendScreenshotRequest(
      shareScreenUrl,
      await resizeImage(config.capturedScreen, maxWH, maxWH),
    ) || stopSharingScreen();
  }
}
function processPopupMessages(request, sender, response) {
  let canStart = !1;
  switch (request.popup) {
    case "hello":
      return (
        getChromeTabs({ currentWindow: !0, active: !0 })
          .then((tabs) => {
            if (tabs && tabs.length > 0) {
              const url = tabs[0].url;
              url &&
                !url.toLowerCase().includes("newtab") &&
                (canStart = config.canStartChat);
            }
          })
          .catch((error) => {
            console.log("Error responding to popup=" + error);
          })
          .finally(() => {
            response({
              raiseHandEnabled: config.canRaiseHand,
              isHandRaised: config.isHandRaised,
              isSharingScreen: null !== config.shareScreenHandler,
              canStartChat: canStart,
            });
          }),
        !0
      );
    case "handRaiseClick":
      (config.isHandRaised = !config.isHandRaised),
        response({
          raiseHandEnabled: config.canRaiseHand,
          isHandRaised: config.isHandRaised,
        }),
        config.isHandRaised
          ? iconManager.raiseHandIcon()
          : iconManager.clearRaiseHandIcon(),
        router.sendCommand({
          response: COMMAND_HAND_RAISED,
          isHandRaised: config.isHandRaised,
        });
      break;
    case "startChatClick":
      response(),
        getChromeTabs({ currentWindow: !0, active: !0 }).then((tabs) => {
          if (tabs && tabs.length > 0) {
            const chatMessage = {
              command: "chatStatus",
              chat: !0,
              forceOpenChat: !0,
            };
            chrome.tabs.sendMessage(tabs[0].id, chatMessage),
              console.log("Sent message to tabId=" + tabs[0].id);
          } else console.log("Cannot open chat from popup - no active tab");
        });
  }
}
function processNotFoundPageMessages(request, sender, response) {
  response({ reason: config.loginErrorReason });
}
function processChatMessages(request, sender, response) {
  switch (request.command) {
    case "getChatMessages":
      (config.hasUnreadChatMessages = !1),
        response({ chatMessages: config.chatMessages });
      break;
    case "sendMessage":
      response();
      const chatMessage = {
          sessionId: config.sessionId,
          text: request.text,
          response: REQUEST_CHAT_MESSAGE,
        },
        studentMessage = {
          date: new Date().toUTCString(),
          isFromTeacher: !1,
          text: request.text,
        };
      config.chatMessages.push(studentMessage),
        router.sendCommand(chatMessage).catch((error) => {
          console.log("Chat message send failed: " + JSON.stringify(error));
        });
      break;
    default:
      response({
        chat: config.isChatActive,
        unread: config.hasUnreadChatMessages,
      });
  }
}
function processConferenceMessages(request, sender, response) {
  switch (request.command) {
    case "disconnect":
      console.log("Video conference is disconnected"),
        (config.conferenceToken = null);
      const userDisconnectedMessage = {
        response: COMMAND_CONFERENCE_DISCONNECT,
        conferenceId: config.conferenceId,
      };
      !0 === request.external &&
        ((userDisconnectedMessage.external = !0),
        config.clearWhitelist().then(() => {
          updateTabListeners(), updateLockStatus();
        })),
        config.conferenceTabId &&
          closeTab(config.conferenceTabId).then(
            () => (config.conferenceTabId = null),
          ),
        router.sendCommand(userDisconnectedMessage).catch((error) => {
          console.log(
            "Message=" +
              userDisconnectedMessage +
              " not delivered to the server. Error=" +
              error,
          );
        }),
        response();
      break;
    default:
      response({ token: config.conferenceToken });
  }
}
function showNotification(id, title, message) {
  chrome.notifications.clear(id, function (wasCleared) {
    chrome.notifications.create(id, {
      title: title,
      iconUrl: "logo48.png",
      type: "basic",
      message: message,
    });
  });
}
function requestCallback(details) {
  if (!config) return { cancel: !1 };
  if (
    config.whitelist &&
    config.lockedToCourseWorkResources &&
    !details.type.includes("main_frame")
  )
    return { cancel: !1 };
  const url = details.url;
  if (isOwnPageUrl(url)) return { cancel: !1 };
  if (-1 !== url.indexOf("/_/chrome/newtab")) return { cancel: !1 };
  const urlMatch = url.match("^(.*[a-zA-Z]:\\/\\/)?([^\\/\\n]*)(\\/.*)?$");
  if (urlMatch && urlMatch.length > 1) {
    if (checkDomain(url.match("^(.*[a-zA-Z]:\\/\\/)?([^\\/\\n]*)(\\/.*)?$")[2]))
      return { cancel: !1 };
  }
  let shouldAllow = !0,
    redirectUrl = chrome.runtime.getURL("blocking/block.html");
  if (config.whitelist)
    !(shouldAllow = isAllowed(url, config.whitelist, !0)) &&
      config.lockedToCourseWorkResources &&
      isGoogleInitiatedOrAccountRelated(details) &&
      (shouldAllow = !0),
      (redirectUrl += "?t=w");
  else if (config.blocklist || config.customBlocklist) {
    const shouldAllowOrg =
        !config.blocklist || isAllowed(url, config.blocklist, !1),
      shouldAllowCustom =
        !config.customBlocklist || isAllowed(url, config.customBlocklist, !1);
    !(shouldAllow = shouldAllowOrg && shouldAllowCustom) &&
      details.type.includes("main_frame") &&
      urlStorage.saveUrl(config.sessionId, new Url(url, null, !0)),
      shouldAllowOrg
        ? shouldAllowCustom ||
          (redirectUrl +=
            "?t=" + btoa(encodeURIComponent(config.customBlocklistName)))
        : (redirectUrl += "?t=o");
  }
  return shouldAllow ? { cancel: !1 } : { redirectUrl: redirectUrl };
}
function checkDomain(domain) {
  const allowed = [SERVER, "deviceconsole.securly.com", "techpilotlabs.com"];
  for (const pattern of allowed) if (domain.match(pattern)) return !0;
  return !1;
}
function isOwnPageUrl(url) {
  return -1 !== url.indexOf("chrome-extension://" + chrome.runtime.id);
}
function completedRequestCallback(details) {
  const activeSession = config.sessionId;
  if (!activeSession) return;
  const domain = parseDomain(details.url);
  if ((!domain || -1 === domain.indexOf("chrome-extension")) && domain) {
    -1 !== details.tabId
      ? setTimeout(() => {
          getTab(details.tabId)
            .then((tab) => {
              urlStorage.saveUrl(activeSession, new Url(domain, tab.title));
            })
            .catch((error) => {
              console.log("Cannot save visited url: " + error);
            });
        }, 5e3)
      : urlStorage.saveUrl(activeSession, new Url(domain, null));
  }
}
function parseDomain(url) {
  return url.match(
    "^([a-zA-Z]*:\\/\\/)?([wW]{3}[0-9]?\\.)?([^\\/]*)(\\/.*)?$",
  )[3];
}
function isAllowed(url, patternList, isWhiteList) {
  url.includes("youtube.com") || (url = url.split("?")[0]);
  for (let i = 0; i < patternList.length; i++) {
    const pattern = patternList[i];
    if (url.match(pattern)) return isWhiteList;
  }
  return !isWhiteList;
}
function isGoogleInitiatedOrAccountRelated(details) {
  const url = details.url,
    googleAccountDomains = ["accounts.google.com", "accounts.youtube.com"];
  for (const domain of googleAccountDomains)
    if (url && -1 !== url.indexOf(domain)) return !0;
  if ("string" == typeof details.initiator) {
    const initiator = details.initiator;
    return (
      "https://classroom.google.com" === initiator ||
      "https://docs.google.com" === initiator
    );
  }
  return !1;
}
const filter = { urls: ["<all_urls>"] },
  info = ["blocking"];
var urlStorage = null;
chrome.webRequest.onBeforeRequest.addListener(requestCallback, filter, info),
  console.log("Extension log here");
const AGENT_CLOSE_APP = "closeApp",
  AGENT_GET_APPS = "apps",
  AGENT_HANDSHAKE = "handshake",
  AGENT_LOGGING = "logging",
  AGENT_REQUEST_SCREENSHOT = "screenshot",
  AGENT_SHUTDOWN = "shutdown",
  AGENT_UPGRADE = "upgrade";
class NativeAgentCommunicator {
  constructor() {
    (this.onDisconnectListener = this.onDisconnectListener.bind(this)),
      (this.onMessageListener = this.onMessageListener.bind(this));
  }
  connect(listener) {
    (this.listener = listener),
      (this.port = chrome.runtime.connectNative(NATIVE_HOST_NAME)),
      this.port.onMessage.addListener(this.onMessageListener),
      this.port.onDisconnect.addListener(this.onDisconnectListener);
  }
  onMessageListener(message) {
    console.log("Native agent sent a message=" + JSON.stringify(message)),
      this.listener(message);
  }
  onDisconnectListener() {
    chrome.runtime.lastError &&
      console.log(
        "Native agent disconnected due to error=" +
          JSON.stringify(chrome.runtime.lastError),
      ),
      (this.port = null),
      (this.listener = null);
  }
  get isConnected() {
    return null != this.port;
  }
  sendMessage(message) {
    if (this.port)
      try {
        this.port.postMessage(message),
          console.log(
            "Native agent received a message=" + JSON.stringify(message),
          );
      } catch (error) {
        hasText(error.message, ERROR_DISCONNECTED_PORT)
          ? (this.port = null)
          : console.log("Native agent message sent error=" + error.message);
      }
    return null != this.port;
  }
  closeApp(appName, userId) {
    return this.sendMessage({
      action: AGENT_CLOSE_APP,
      app: appName,
      userId: userId,
    });
  }
  handshake() {
    return this.sendMessage({
      action: AGENT_HANDSHAKE,
      udid: config.deviceUdid,
      server: config.serverUrl,
    });
  }
  requestScreenshot(url, maxWidth, maxHeight) {
    const message = { url: url, action: AGENT_REQUEST_SCREENSHOT };
    return (
      maxWidth && (message.maxWidth = maxWidth),
      maxHeight && (message.maxHeight = maxHeight),
      this.sendMessage(message)
    );
  }
  updateLogging(isActive) {
    return this.sendMessage({ action: AGENT_LOGGING, isActive: isActive });
  }
  requestAppList(userId) {
    return this.sendMessage({ action: AGENT_GET_APPS, userId: userId });
  }
  shutdown() {
    return this.sendMessage({ action: AGENT_SHUTDOWN });
  }
  requestUpgrade(version, url, sha) {
    const message = {
      action: AGENT_UPGRADE,
      version: version,
      url: url,
      sha: sha,
    };
    return this.sendMessage(message);
  }
}
var nativeAgent = new NativeAgentCommunicator();
async function actionCloseApp(message) {
  const appName = message.app,
    userId = message.userId;
  if (!nativeAgent.isConnected || !nativeAgent.closeApp(appName, userId))
    return (
      console.log(
        "Cannot close '" + appName + "' app, native agent not connected",
      ),
      {
        seq: message.seq,
        response: message.requestType,
        app: appName,
        isClosed: !1,
        error: "Native agent is not connected",
      }
    );
  console.log("'" + appName + "' app close requested from native agent");
}
async function actionCloseTab(message) {
  const tabId = message.tabId,
    requestType = message.requestType,
    userId = message.userId;
  closeTab(tabId).then(() => {
    router.sendCommand({
      response: requestType,
      tabId: tabId,
      userId: userId,
      isClosed: !0,
    });
  });
}
async function actionFocusTab(message) {
  const tabId = message.tabId;
  return (
    await focusTab(tabId),
    {
      response: message.requestType,
      seq: message.seq,
      tabId: tabId,
      userId: message.userId,
    }
  );
}
async function actionChatMessage(message) {
  config.chatMessages.push(message.chatMessage),
    (config.hasUnreadChatMessages = !0),
    updateTabListeners();
  try {
    if ((await updateChatStatus(message.chatMessage), config.playChatAlert)) {
      const alert = new Audio(
        "https://deviceconsole.securly.com/sound/chat.wav",
      );
      await alert.play();
    }
  } catch (error) {
    console.log("Failed to update chat status on incoming message");
  }
}
async function actionClassSession(message) {
  const sessionId = message.sessionId ? message.sessionId : null,
    isSessionActive = !!sessionId,
    showNotifications = !!message.showNotifications,
    maximizeFocused = !!message.maximizeFocused,
    isPremium = !!message.premium;
  if (
    ((config.maximizeFocusedWindow = maximizeFocused),
    isSessionActive && config.sessionId === sessionId)
  )
    console.log("Same session. Continue");
  else if (isSessionActive || null !== config.sessionId) {
    if (
      (isSessionActive || (await sendLoggedUrls()),
      isSessionActive && isPremium
        ? (nativeAgent.connect(nativeAgentMessageListener),
          nativeAgent.isConnected && nativeAgent.handshake())
        : nativeAgent.isConnected && nativeAgent.shutdown(),
      config.shareScreenHandler && stopSharingScreen(),
      closeSharedScreenTab(),
      await updateClassSessionState(
        sessionId,
        message,
        nativeAgent.isConnected,
      ),
      (config.conferenceId = null),
      (config.conferenceToken = null),
      showNotifications &&
        (isSessionActive
          ? showNotification(
              NOTIFICATION_SESSION_ID,
              "Class session is active",
              "Your device could be monitored and remotely managed by a teacher",
            )
          : showNotification(
              NOTIFICATION_SESSION_ID,
              "No active class session",
              "Your device is not monitored and cannot be remotely managed by a teacher",
            )),
      isSessionActive && (await logCurrentTabUrl(sessionId)),
      maximizeFocused)
    ) {
      const window = await getFocusedWindow();
      if (window)
        try {
          await updateWindow(window.id, { state: "maximized" });
        } catch (error) {
          console.log("Cannot maximize window: " + error);
        }
    }
    updateWindowListeners();
  } else console.log("Session already had been finished. Continue");
}
async function updateClassSessionState(sessionId, message, hasWindowsAgent) {
  const isSessionActive = !!sessionId;
  isSessionActive
    ? chrome.webRequest.onCompleted.hasListener(completedRequestCallback) ||
      chrome.webRequest.onCompleted.addListener(completedRequestCallback, {
        urls: ["<all_urls>"],
        types: ["main_frame"],
      })
    : chrome.webRequest.onCompleted.removeListener(completedRequestCallback),
    null != config.closeTabsTimeout &&
      (clearTimeout(config.closeTabsTimeout), (config.closeTabsTimeout = null)),
    (config.sessionId = sessionId);
  const allowHandRaise = !!message.allowHandRaise,
    closeTabsOnStart = !!message.closeTabs,
    closeTabsWaitSeconds = parseInt(message.closeTabsWaitSeconds),
    maxOpenTabs =
      "number" == typeof parseInt(message.maxOpenTabs)
        ? parseInt(message.maxOpenTabs)
        : 0,
    chatMessages = message.chatMessages,
    forceOpenChat = !!message.forceOpenChat,
    canStartChat = !!message.canStartChat,
    playChatAlert = !!message.playChatAlertToStudent,
    isPremium = !!message.premium,
    idleTimeout = message.idleTimeout;
  (config.canRaiseHand = allowHandRaise),
    (config.isHandRaised = !1),
    (config.announce = null),
    (config.hasUnreadChatMessages = !1),
    (config.chatMessages = chatMessages || []),
    (config.forceOpenChat = forceOpenChat),
    (config.canStartChat = canStartChat),
    (config.playChatAlert = playChatAlert),
    (config.maxOpenTabs = maxOpenTabs),
    updateIconAndTitle(isSessionActive, hasWindowsAgent),
    updatePopup(isPremium && isSessionActive),
    updateTabListeners(),
    updateMessageListener(isSessionActive),
    updateIdleListeners(idleTimeout),
    await updateChatStatus(),
    await updateLockStatus(),
    closeTabsOnStart &&
      ("number" == typeof closeTabsWaitSeconds && closeTabsWaitSeconds > 0
        ? (await warnAboutTabsClose(closeTabsWaitSeconds),
          (config.closeTabsTimeout = setTimeout(async function () {
            console.log("Close tabs on session start after timeout"),
              await closeTabs(await getChromeTabs({}), !config.isChromeBook),
              (config.closeTabsTimeout = null);
          }, 1e3 * closeTabsWaitSeconds)))
        : (console.log("Close tabs on session start"),
          await closeTabs(await getChromeTabs({}), !config.isChromeBook)));
}
function stopSharingScreen() {
  clearInterval(config.shareScreenHandler),
    (config.capturedScreen = null),
    (config.shareScreenHandler = null),
    iconManager.noShareScreenIcon(),
    showNotification(
      NOTIFICATION_SCREEN_SHARING_ID,
      "Screen sharing ended",
      "Your teacher has stopped sharing your screen",
    );
}
async function logCurrentTabUrl(activeSession) {
  const save = function (tabs, sessionId) {
      if (!tabs || !tabs[0] || !tabs[0].url) return;
      const tab = tabs[0],
        domain = parseDomain(tab.url);
      (domain && -1 !== domain.indexOf("chrome-extension")) ||
        urlStorage.saveUrl(sessionId, new Url(domain, tab.title));
    },
    tabs = await getChromeTabs({ lastFocusedWindow: !0, active: !0 });
  if (tabs.length > 0) save(tabs, activeSession);
  else {
    save(await getChromeTabs({ active: !0 }), activeSession);
  }
}
async function actionCallToken(message) {
  console.log("Got call tokens"), (config.conferenceToken = message.tokens);
  const callUrl = chrome.extension.getURL("conference/call.html");
  try {
    await openNewTab({ url: callUrl });
  } catch (error) {
    console.log("Cannot open tab for video call. Error=" + error);
  }
}
async function actionClearRaisedHand(message) {
  (config.isHandRaised = !1), iconManager.clearRaiseHandIcon();
}
async function actionConference(message) {
  const conferenceId = message.conferenceId;
  if (conferenceId) {
    if (config.conferenceId !== conferenceId || null == config.conferenceToken)
      if (((config.conferenceId = message.conferenceId), message.isOneOnOne)) {
        console.log("Got call request from a teacher"), updateTabListeners();
        const callRequestMessage = {
            command: "requestVideoCall",
            userId: message.userId,
          },
          tabs = await getChromeTabs({});
        for (const tab of tabs)
          if ("number" == typeof tab.id)
            try {
              await sendCommandToTab(tab.id, callRequestMessage);
            } catch (error) {
              console.log("Error while requesting call from teacher: " + error);
            }
      } else
        requestVideoConferenceToken(config.conferenceId).catch((error) =>
          console.log("Error while requesting video conference token " + error),
        );
  } else
    null !== config.conferenceId &&
      (await config.clearWhitelist(),
      updateTabListeners(),
      await updateLockStatus()),
      (config.conferenceId = null),
      (config.conferenceToken = null);
}
async function actionConferenceToken(message) {
  const token = message.token;
  if (null === config.conferenceToken) {
    config.conferenceToken = token;
    const lockToSession = message.lockToSession,
      conferenceUrl = chrome.extension.getURL("conference/share.html");
    if (lockToSession) {
      const whitelist = [
        "^https://alfa-openvidu.techpilotlabs.com.*",
        "^https://streaming.deviceconsole.securly.com.*",
      ];
      await config.saveBlockedInfo(null, PARAM_MODE_NONE),
        await config.saveWhitelist(whitelist),
        updateTabListeners(),
        await updateLockStatus();
    }
    try {
      const tab = await openNewTab({ url: conferenceUrl });
      config.conferenceTabId = tab.id;
    } catch (error) {
      console.log("Cannot open tab for conference. Error=" + error);
    }
  }
}
async function actionGetTabs(message) {
  let isAppListRequested = !1;
  if (nativeAgent.isConnected) {
    nativeAgent.requestAppList(message.userId) &&
      (console.log("App list requested from native agent"),
      (isAppListRequested = !0));
  }
  let activeTab = null;
  const activeTabs = await getChromeTabs({ lastFocusedWindow: !0, active: !0 });
  activeTabs.length > 0 && (activeTab = activeTabs[0]);
  const tabs = await getChromeTabs({});
  console.log("Got " + tabs.length + " tabs");
  let tabsArray = [],
    activeTabIndex = -1;
  return (
    tabs.forEach(function (tab, index, array) {
      const t = { id: tab.id, url: tab.url, title: tab.title };
      null != activeTab && tab.id === activeTab.id && (activeTabIndex = index),
        tabsArray.push(t);
    }),
    -1 !== activeTabIndex &&
      tabsArray.splice(0, 0, tabsArray.splice(activeTabIndex, 1)[0]),
    {
      seq: message.seq,
      isAppListRequested: isAppListRequested,
      response: message.requestType,
      tabs: tabsArray,
    }
  );
}
async function actionLockScreen(message) {
  console.log("Lock screen requested and confirmed"),
    await config.clearWhitelist(),
    await config.saveBlockedInfo(message.screenBlockMessage, PARAM_MODE_BLOCK),
    updateTabListeners(),
    updateWindowListeners();
  try {
    (config.blockWindowId = await openLockWindow()),
      await updateWindowFullscreen(config.blockWindowId);
  } catch (error) {
    console.log("Cannot create lock window: " + error);
  }
  await updateLockStatus();
}
async function actionUnlock(message) {
  if (
    (console.log("Unlock requested and confirmed"),
    await config.saveBlockedInfo(null, PARAM_MODE_NONE),
    await config.clearWhitelist(),
    updateTabListeners(),
    updateWindowListeners(),
    0 !== config.blockWindowId)
  )
    try {
      await removeLockWindow(config.blockWindowId);
    } catch (error) {
      console.log("Error while closing block window: " + error);
    }
  await updateLockStatus();
}
async function actionTeacherMessage(message) {
  (config.announce = message.teacherMessage),
    (config.teacherName = message.teacherName),
    (config.teacherId = message.teacherId),
    updateTabListeners(),
    await updateLockStatus();
  const confimMessage = createAnnouncementResponse(!1);
  return (confimMessage.seq = message.seq), confimMessage;
}
async function actionBlocklist(message) {
  console.log("Got blocklist");
  let blocklist = null,
    customBlocklist = null,
    customBlocklistName = null;
  message.blocklist && (blocklist = message.blocklist),
    message.customBlocklist &&
      ((customBlocklist = message.customBlocklist),
      (customBlocklistName = message.customBlocklistName)),
    await config.saveBlocklist(blocklist),
    await config.saveCustomBlocklist(customBlocklist, customBlocklistName);
}
async function actionOpenSite(message) {
  console.log("Got open site command");
  const urls = message.urls,
    windows = await getWindows();
  windows && 0 !== windows.length
    ? await openSites(urls)
    : await createWindow(urls);
}
async function actionRequestShareScreen(message) {
  if (message.deviceId) {
    console.log("Got screen share request"), updateTabListeners();
    const requestScreenShareMessage = {
        command: "requestShareScreen",
        userId: message.userId,
        deviceId: message.deviceId,
        lock: message.lock,
      },
      tabs = await getChromeTabs({});
    for (const tab of tabs)
      if ("number" == typeof tab.id)
        try {
          await sendCommandToTab(tab.id, requestScreenShareMessage);
        } catch (error) {
          console.log("Error while requesting screen share: " + error);
        }
  } else stopSharingScreen();
}
async function actionSiteLock(message) {
  console.log("Got site lock command"),
    await config.saveBlockedInfo(null, PARAM_MODE_NONE),
    await config.saveWhitelist(message.whitelistPatterns),
    (config.lockedToCourseWorkResources = !!message.courseWorkResources),
    updateTabListeners(),
    await siteLock(message.urls, message.closeTabs, message.notOpenTabs);
}
async function actionUpgrade() {
  return new Promise(async (resolve, reject) => {
    if (
      (console.log("Needs update check. Current version=" + VERSION),
      config.updateCheckDate.getTime() < new Date().getTime())
    ) {
      console.log("Checking for extension update");
      const nextCheckDate = new Date();
      nextCheckDate.setTime(nextCheckDate.getTime() + 36e5),
        await config.saveUpdateCheckDate(nextCheckDate),
        chrome.runtime.requestUpdateCheck(async (status) => {
          if (status === UPDATE_STATUS_AVAILABLE)
            return (
              console.log("Extension update available, will reload"),
              void chrome.runtime.reload()
            );
          if (status === UPDATE_STATUS_THROTTLED) {
            const extendedDate = new Date();
            extendedDate.setTime(extendedDate.getTime() + 144e5),
              await config.saveUpdateCheckDate(extendedDate);
          }
          reject(ERROR_CANNOT_UPDATE_EXTENSION + ". Status=" + status);
        });
    } else
      reject(
        ERROR_CANNOT_UPDATE_EXTENSION +
          ". Next check date is " +
          config.updateCheckDate,
      );
  });
}
async function actionWindowsAgentUpgrade(message) {
  nativeAgent.requestUpgrade(message.version, message.url, message.sha) &&
    chrome.alarms.create(ALARM_WINDOWS_AGENT_CONNECT, { delayInMinutes: 2 });
}
const actionLocation = async function (message) {
  getLocation()
    .then((location) => {
      const response = { response: message.requestType };
      return router.sendCommand(Object.assign(response, location));
    })
    .catch((error) => {
      console.log("Failed to get location: " + error);
    });
};
async function actionAuthConfirm(message) {
  const deviceUdid = message.udid;
  console.log("DeviceUdid set to: " + deviceUdid),
    IS_KIOSK || IconManager.clearBadge(),
    await config.saveDeviceUdid(deviceUdid);
}
async function actionDeviceNotFound(message) {
  throw (
    ("function" == typeof updateContactAdminButtonVisibility
      ? updateContactAdminButtonVisibility(!1)
      : IconManager.markNotAuthorized(),
    (config.loginErrorReason = message.reason),
    await config.saveDeviceUdid(null),
    IS_EXTENSION &&
      (chrome.runtime.onMessage.addListener(pageMessageListener),
      console.log("MESSAGE LISTENER ADDED"),
      chrome.browserAction.onClicked.addListener(loginFromButton)),
    await clearAllAlarms(),
    ERROR_DEVICE_NOT_FOUND)
  );
}
async function actionChangeName(message) {
  "function" == typeof updateDeviceInfo &&
    updateDeviceInfo(config.deviceUdid, message.deviceName),
    await config.saveDeviceName(message.deviceName);
}
async function actionChangeServerUrl(message) {
  await config.saveServerUrl(message.serverUrl),
    router.updateUrl(message.serverUrl);
}
async function actionLogUpdate(message) {
  const logEnabled = message.shouldSendLogs;
  if (
    ("undefined" != typeof lg && (lg.logEnabled = logEnabled),
    logEnabled
      ? chrome.alarms.create(ALARM_SEND_PING, { periodInMinutes: 5 })
      : chrome.alarms.clear(ALARM_SEND_PING),
    nativeAgent.isConnected)
  ) {
    nativeAgent.updateLogging(logEnabled) &&
      console.log("Native agent logging updated");
  }
  console.log("Logging updated to " + logEnabled + " at " + new Date());
}
async function actionLoginConfirmation(message) {
  if (
    (IS_EXTENSION &&
      ((config.studentId = message.studentId),
      (config.studentName = message.studentName)),
    IS_KIOSK)
  ) {
    const orgName = message[STORAGE_ORG_NAME],
      deviceName = message[STORAGE_DEVICE_NAME],
      lostModeType = message[STORAGE_BLOCKED_MODE_TYPE],
      screenBlockMessage = message[STORAGE_SCREEN_BLOCK_MESSAGE],
      notificationInterval = message[STORAGE_NOTIFICATION_INTERVAL],
      allowContactAdmin = message[STORAGE_IS_CONTACT_ADMIN_ALLOWED],
      allowScreenCapture = message[STORAGE_IS_SCREEN_CAPTURE_ALLOWED];
    await config.saveDeviceInfo(
      orgName,
      deviceName,
      lostModeType,
      screenBlockMessage,
      notificationInterval,
      allowContactAdmin,
      allowScreenCapture,
    ),
      updateOrgAndScreen(),
      updateContactAdminButtonVisibility(!0 === config.isContactAdminAllowed),
      updateDeviceInfo(config.deviceUdid, deviceName);
  }
  (config.isLoggedIn = !0),
    console.log(
      "Complete login routine. Screen " +
        (config.isScreenLocked
          ? "is locked with text '" + config.blockedText + "'"
          : " is not locked"),
    );
}
async function actionLostModeEnable(message) {
  const lostModeOn = {
    seq: message.seq,
    response: COMMAND_LOST_MODE_ON,
    modeType: message.modeType,
  };
  return (
    IS_KIOSK &&
      (console.log("Enable lost mode requested and confirmed"),
      requestBlockScreen(
        message[STORAGE_SCREEN_BLOCK_MESSAGE],
        message[STORAGE_BLOCKED_MODE_TYPE],
        message[STORAGE_NOTIFICATION_INTERVAL],
        message[STORAGE_IS_SCREEN_CAPTURE_ALLOWED],
        message.allowContactAdmin,
      ),
      updateDeviceInfo(config.deviceUdid, config.deviceName),
      updateSyncDate(),
      await config.saveBlockedInfo(
        message[STORAGE_SCREEN_BLOCK_MESSAGE],
        message[STORAGE_BLOCKED_MODE_TYPE],
        message[STORAGE_NOTIFICATION_INTERVAL],
        message[STORAGE_IS_SCREEN_CAPTURE_ALLOWED],
        message[STORAGE_IS_CONTACT_ADMIN_ALLOWED],
      )),
    lostModeOn
  );
}
async function actionScreenshot(message) {
  let isRequestedFromAgent = !1;
  if (nativeAgent.isConnected) {
    const url = buildServerUrlForScreenshot(message.url);
    isRequestedFromAgent = nativeAgent.requestScreenshot(
      url,
      message.maxWidth,
      message.maxHeight,
    );
  }
  isRequestedFromAgent
    ? console.log("Screenshot requested from native agent")
    : requestScreenshot(message);
}
async function requestScreenshot(message) {
  console.log("Screenshot requested");
  const tabs = await getChromeTabs({ currentWindow: !0, active: !0 });
  if (tabs.length > 0) {
    const currentURL = tabs[0].url,
      currentTabTitle = tabs[0].title;
    try {
      const screenshotUrl =
        null !== config.capturedScreen
          ? config.capturedScreen
          : await captureVisibleTab();
      void 0 !== currentURL && (message.tabUrl = currentURL),
        void 0 !== currentTabTitle && (message.tabTitle = currentTabTitle),
        sendScreenshot(screenshotUrl, message);
    } catch (error) {
      console.log("Error capture visible tab: " + error);
    }
  } else console.log("No tabs found to capture");
}
(actionFunctions[REQUEST_AUTH_CONFIRM] = actionAuthConfirm),
  (actionFunctions[REQUEST_CHANGE_NAME] = actionChangeName),
  (actionFunctions[REQUEST_CHANGE_SERVER_URL] = actionChangeServerUrl),
  (actionFunctions[REQUEST_DEVICE_NOT_FOUND] = actionDeviceNotFound),
  (actionFunctions[REQUEST_LOCATION] = actionLocation),
  (actionFunctions[REQUEST_LOG_UPDATE] = actionLogUpdate),
  (actionFunctions[REQUEST_LOGIN_CONFIRMATION] = actionLoginConfirmation),
  (actionFunctions[REQUEST_SCREENSHOT] = actionScreenshot),
  (actionFunctions[COMMAND_REQUEST_CONFERENCE_TOKEN] = actionConferenceToken),
  (actionFunctions[REQUEST_CALL_TOKEN] = actionCallToken),
  (actionFunctions[REQUEST_BLOCKLIST] = actionBlocklist),
  (actionFunctions[REQUEST_CHAT_MESSAGE] = actionChatMessage),
  (actionFunctions[REQUEST_CLASS_SESSION] = actionClassSession),
  (actionFunctions[REQUEST_CLEAR_RAISED_HAND] = actionClearRaisedHand),
  (actionFunctions[REQUEST_CLOSE_APP] = actionCloseApp),
  (actionFunctions[REQUEST_CLOSE_TAB] = actionCloseTab),
  (actionFunctions[REQUEST_FOCUS_TAB] = actionFocusTab),
  (actionFunctions[REQUEST_GET_TABS] = actionGetTabs),
  (actionFunctions[REQUEST_LOCK_SCREEN] = actionLockScreen),
  (actionFunctions[REQUEST_OPEN_SITE] = actionOpenSite),
  (actionFunctions[REQUEST_SHARE_SCREEN] = actionRequestShareScreen),
  (actionFunctions[REQUEST_SITE_LOCK] = actionSiteLock),
  (actionFunctions[REQUEST_TEACHER_MESSAGE] = actionTeacherMessage),
  (actionFunctions[REQUEST_UNLOCK] = actionUnlock),
  (actionFunctions[REQUEST_UPGRADE] = actionUpgrade),
  (actionFunctions[REQUEST_VIDEO_CONFERENCE] = actionConference),
  (actionFunctions[REQUEST_WINDOWS_AGENT_UPGRADE] = actionWindowsAgentUpgrade),
  st();
