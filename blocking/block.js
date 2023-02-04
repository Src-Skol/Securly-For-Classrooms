"use strict";
const ACTION_RESIZE = "resizeLocked";
const ACTION_GET_LOCK_TEXT = "getLockText";
const KEY_ACTION = "action";
const KEY_WINDOW_SIZE = "windowSize";

window.onload = function() {
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('t');
  if (type) {
    let blockString;
    let substring = "";
    if (type === "w") {
      blockString = "This site is not available during site lock";
    } else if (type === "o") {
      blockString = "This site has been blocked by the administrator";
    } else {
      blockString = "This site has been blocked by a teacher";
      substring = decodeURIComponent(atob(type));
    }
    document.getElementById("tpMsgBlocked").innerHTML = blockString;
    document.getElementById("tpMsgBlocklistName").innerHTML = substring;
  } else {
    chrome.runtime.sendMessage({
      [KEY_ACTION]: ACTION_GET_LOCK_TEXT
    }, function (response) {
      if (chrome.runtime.lastError) {
        console.log("Error while sending message to the extension: " + chrome.runtime.lastError.message);
      }
      if (response) {
        document.getElementById("tpMsgBlocked").innerHTML = response;
      }
      document.getElementById("tpMsgBlocklistName").innerHTML = "";
    });
  }
  window.addEventListener("resize", function () {
    if (screen.width > window.innerWidth) {
      chrome.runtime.sendMessage({
        [KEY_ACTION]: ACTION_RESIZE,
        [KEY_WINDOW_SIZE]: window.innerWidth + "x" +  window.innerHeight
      });
    }
  });

}