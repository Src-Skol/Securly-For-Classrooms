"use strict";
function e(e) {
  if (
    (chrome.runtime.lastError &&
      console.log(
        "Error while sending message=" + chrome.runtime.lastError.message,
      ),
    !e)
  )
    return void window.close();
  const n = e.raiseHandEnabled,
    a = e.isHandRaised,
    i = e.canStartChat,
    s = e.isSharingScreen;
  var d;
  console.log(
    "Hand Raise " +
      (n ? "allowed" : "not allowed") +
      ". Hand " +
      (a ? "is raised" : "isn't raised") +
      " Student " +
      (i ? "can" : "cannot") +
      " start a chat",
  ),
    (function (e) {
      e
        ? (document
            .getElementById("handRaiseButtonContainer")
            .setAttribute("class", "btn-container"),
          (document.getElementById("handRaiseAlert").style.display = "none"))
        : (document
            .getElementById("handRaiseButtonContainer")
            .setAttribute("class", "btn-container disabled"),
          (document.getElementById("handRaiseAlert").style.display = "block"));
      document.getElementById("tpRaiseHandButton").innerHTML = "Raise hand";
    })(n),
    void 0 !== i &&
      (function (e) {
        e
          ? document
              .getElementById("chatButtonContainer")
              .setAttribute("class", "btn-container")
          : document
              .getElementById("chatButtonContainer")
              .setAttribute("class", "btn-container disabled");
      })(i),
    t(!0 === n && a),
    (d = s),
    (document.getElementById("screenShareStatus").style.display = d
      ? "block"
      : "none");
}
function t(e) {
  if (e)
    document.getElementById("tpRaiseHandButton").innerHTML =
      "Cancel hand raise";
  else {
    let e = "btn-container";
    document
      .getElementById("handRaiseButtonContainer")
      .className.split(" ")
      .indexOf("disabled") >= 0 && (e += " disabled"),
      document
        .getElementById("handRaiseButtonContainer")
        .setAttribute("class", e),
      (document.getElementById("tpRaiseHandButton").innerHTML = "Raise hand");
  }
}
window.addEventListener("load", function () {
  const t = document.getElementById("handRaiseButtonContainer").childNodes[1];
  t.addEventListener("click", function () {
    t.parentElement.className.split(" ").indexOf("disabled") >= 0 ||
      chrome.runtime.sendMessage(
        { action: "popup", popup: "handRaiseClick" },
        e,
      );
  });
  const n = document.getElementById("chatButtonContainer").childNodes[1];
  n.addEventListener("click", function () {
    n.parentElement.className.split(" ").indexOf("disabled") >= 0 ||
      chrome.runtime.sendMessage(
        { action: "popup", popup: "startChatClick" },
        e,
      );
  }),
    chrome.runtime.sendMessage({ action: "popup", popup: "hello" }, e);
});
