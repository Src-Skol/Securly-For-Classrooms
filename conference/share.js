"use strict";
var OV;
var session = null;
var token;			// Token retrieved from OpenVidu Server
var statsTimer;

const KEY_COMMAND = "command";
const COMMAND_STOP_VIDEO_SESSION = "stopVideoConference";

window.addEventListener("load", function () {
  const fullScreenButton = document.getElementById("tpFullScreenButton");
  fullScreenButton.addEventListener("click", function () {
    document.getElementsByTagName("video")[0].requestFullscreen()
        .then(() => {
          console.log("Fullscreen requested");
        })
  });

  chrome.runtime.onMessage.addListener(function (message, sender, response) {
    console.log("Message: " + JSON.stringify(message));
    if (message[KEY_COMMAND] === COMMAND_STOP_VIDEO_SESSION && session != null) {
      leaveSession(true);
      response({status: "disconnected"})
    }
  });

  sendMessage({action: "conference"})
      .then((response) => {
        let token = response["token"];
        console.log("Received token=" + token);
        if (token) {
          joinSession(response["token"]);
        }
      })
      .catch((error) => {
        console.log("Failed to get session token from extension: " + error);
      })
});

function joinSession(token) {
  OV = new OpenVidu();
  session = OV.initSession();
  session.on("streamCreated", (event) => {
    console.log("Stream created");
    let subscriber = session.subscribe(event.stream, "tpVideoContainer");
    subscriber.on("videoElementCreated", (event) => {
      console.log("Video element created");
      document.getElementById("tpFullScreenButton").style.display = "block";
      // Add later data about screeh sharing session, received from the server
      // appendUserData(event.element, subscriber.stream.connection);
    });

    const rtcPeerConnection = event.stream.getRTCPeerConnection();
    if (typeof checkCodecs === "function") {
      checkCodecs(rtcPeerConnection);
      gatherStats(rtcPeerConnection);
    }
  });

  session.on("streamDestroyed", (event) => {
    console.log("Session event - stream destroyed");
    cleanSessionView();
  });

  session.on("sessionDisconnected", (event) => {
    let external = false;
    if (event.reason === "sessionClosedByServer" ||
        event.reason === "forceDisconnectByServer") {
      external = true;
    }
    cleanSessionView();
    leaveSession(external);
  })

  session.on("reconnecting", () => {
    const titleElem = document.getElementById("tpPopupTitle");
    titleElem.innerHTML = "Video connection lost. Reconnecting...";
    titleElem.classList.add("disconnect");
    if (document.fullscreenElement) {
      document.exitFullscreen()
          .then(() => {
            console.log("Closing full screen. Session tries to reconnect");
          });
    } else {
      console.log("Session tries to reconnect");
    }
  })
  session.on("reconnected", () => {
    const titleElem = document.getElementById("tpPopupTitle");
    titleElem.innerHTML =  "Classroom screen share session";
    titleElem.classList.remove("disconnect");
    console.log("Session reconnected");
  })

  session.connect(token, {clientData: "Test student"})
      .then(() => {
        console.warn("Session connected successfully");
      })
      .catch(error => {
        console.warn("There was an error connecting to the session: ", error.code, error.message);
      });
  return false;
}

function leaveSession(external) {
  console.log("Leaving the session");
  if (session != null && !external) {
    session.off("sessionDisconnected");
    session.disconnect();
  }
  if (statsTimer) {
    clearInterval(statsTimer);
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
  console.log("Clean session view");
  document.getElementById("tpFullScreenButton").style.display = "none";
  document.getElementById("tpSessionOverMessage").style.display = "block";
}
