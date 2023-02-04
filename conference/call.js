"use strict";
var session = null;
var webComponent;

window.addEventListener("load", function () {

  webComponent = document.querySelector("openvidu-webcomponent");

  webComponent.addEventListener("onSessionCreated", (event) => {
    session = event.detail;

    session.on("sessionDisconnected", (event) => {
      console.log("Session disconnected");
      let external = false;
      if (event.reason === "sessionClosedByServer" ||
          event.reason === "forceDisconnectByServer") {
        external = true;
      }
      cleanSessionView();
      leaveSession(external);
    })

  });

  webComponent.addEventListener('onToolbarLeaveButtonClicked', (event) => {
    console.log("Leave button clicked");
  });

  sendMessage({action: "call"})
      .then((response) => {
        const tokens = response["token"];
        const studentName = response["studentName"];
        console.log("Received tokens for " + studentName);
        if (tokens) {
          joinSession(tokens, studentName);
        }
      })
      .catch((error) => {
        console.log("Failed to get session token from extension: " + error);
      })
});

function joinSession(tokens, studentName) {
  webComponent.style.display = 'block';

  webComponent.participantName = studentName;
  webComponent.prejoin = false;
  webComponent.streamDisplayParticipantName = true;
  webComponent.streamSettingsButton = false;
  webComponent.toolbarActivitiesPanelButton = false;
  webComponent.toolbarBackgroundEffectsButton = false;
  webComponent.toolbarChatPanelButton = false;
  webComponent.toolbarDisplayLogo = false;
  webComponent.toolbarDisplaySessionName = false;
  webComponent.toolbarFullscreenButton = true;
  webComponent.toolbarParticipantsPanelButton = false;
  webComponent.toolbarRecordingButton = false;
  webComponent.toolbarSettingsButton = false;

  // tokens = {webcam: token, screen: token}
  webComponent.tokens = tokens;

}

function leaveSession(external) {
  console.log("Leaving the session");
  if (session != null && !external) {
    session.off("sessionDisconnected");
    session.disconnect();
  }
  session = null;
  const message = {
    action: "conference",
    command: "disconnect",
    external: external
  };
  sendMessage(message)
      .catch(error => {
        console.log("Cannot send message='" + message + "' to extension. Error=" + error);
      });
}

function sendMessage(messageObject) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(messageObject, function (response) {
      if (!response && chrome.runtime.lastError != null) {
        reject(chrome.runtime.lastError.message);
      } else {
        resolve(response);
      }
    })
  });
}

window.onbeforeunload = () => {
  if (session) {
    leaveSession(false);
  }
}

function cleanSessionView() {
  webComponent.style.display = "none";
  document.getElementById("tpSessionOverMessage").style.display = "block";
}
