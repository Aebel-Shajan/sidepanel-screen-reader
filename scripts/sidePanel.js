import * as utils from "./utils.js"
import * as tts from "./tts.js"


const elements = {
	previewText: document.querySelector("#preview-text"),
	clearContents: document.querySelector("#clear-contents"),
	playPause: document.querySelector("#play-pause-toggle"),
	stopButton: document.querySelector("#stop"),
	voiceSelect: document.querySelector("select")

}
let voices = [];
let selectedVoice = null;

window.speechSynthesis.onvoiceschanged = function () {
	voices = tts.populateVoiceList(elements.voiceSelect);
	selectedVoice = voices[0];
};

elements.playPause.addEventListener("click", () => {
	if (window.speechSynthesis.speaking) {
		if (elements.playPause.className === "play") {
			window.speechSynthesis.resume();
		} else {
			window.speechSynthesis.pause()
		}
	} else {
		startSpeak();
	}
});

elements.stopButton.addEventListener("click", () => {
	window.speechSynthesis.cancel();
});

elements.voiceSelect.addEventListener("change", () => {
	const selectedOption =
		elements.voiceSelect.selectedOptions[0].getAttribute("data-name");

	for (let i = 0; i < voices.length; i++) {
		if (voices[i].name === selectedOption) {
			selectedVoice = voices[i];
			break;
		}
	}
})


function startSpeak() {
	let utterance = new SpeechSynthesisUtterance(elements.previewText.value);
	// v these line has to be here 😭 or else chrome wont do it, i wanna kms this took me an hour to figure out
  console.log(utterance); //https://stackoverflow.com/questions/54861046/why-does-a-speechsynthesisutterance-sometimes-not-fire-an-end-event-in-chromiu
	window.speechSynthesis.cancel();
	//////////////////////////////////////////////////
	utterance.voice = selectedVoice;
	let spokenText = elements.previewText.value;
	utterance.onstart = (event) => {
		console.log("start")
		utils.setButtonState(elements.playPause, "pause");
		elements.previewText.setAttribute("disabled", "disabled");
		elements.clearContents.setAttribute("disabled", "disabled");
	}
	utterance.onboundary = (event) => {
		console.log("boundary");
		const pos = utils.getWordPosition(spokenText, event.charIndex);
		if (pos) {
			// Temporarily enable the textarea
			elements.previewText.removeAttribute("disabled");
			// move to start pos
			elements.previewText.selectionStart = elements.previewText.selectionEnd = pos.startPos;
			elements.previewText.blur();
			elements.previewText.focus();
			// select word
			elements.previewText.setSelectionRange(pos.startPos, pos.endPos);
			elements.previewText.focus();
			// Disable the textarea again
			elements.previewText.setAttribute("disabled", "disabled");
		}
	}
	utterance.onpause = (event) => {
		console.log("paused")
		utils.setButtonState(elements.playPause, "play");
	}
	utterance.onresume = (event) => {
		console.log("resumed")
		utils.setButtonState(elements.playPause, "pause");
	}

	utterance.onend = utterance.onerror = (event) => {
		console.log("error/ended")
		elements.playPause = utils.setButtonState(elements.playPause, "play");
		elements.previewText.removeAttribute("disabled");
		elements.clearContents.removeAttribute("disabled");
	}
	if (elements.previewText.value.length < 1000) {
		window.speechSynthesis.speak(utterance);
	}
}
