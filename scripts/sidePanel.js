import * as utils from "./utils.js"
import * as tts from "./tts.js"
import EasySpeech from "./node_modules/easy-speech/dist/EasySpeech.js"
await EasySpeech.init() // required

const elements = {
	previewText: document.querySelector("#preview-text"),
	clearContents: document.querySelector("#clear-contents"),
	playPause: document.querySelector("#play-pause-toggle"),
	stopButton: document.querySelector("#stop"),
	voiceSelect: document.querySelector("select")

}
let voices = tts.populateVoiceList(elements.voiceSelect, EasySpeech.voices());
let selectedVoice = voices[0];



elements.playPause.addEventListener("click", () => {
	if (window.speechSynthesis.speaking) {
		if (elements.playPause.className === "play") {
			EasySpeech.resume();
		} else {
			EasySpeech.pause()
		}
	} else {
		startSpeak();
	}
});

elements.stopButton.addEventListener("click", () => {
	EasySpeech.cancel();
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


async function startSpeak() {
	let spokenText = elements.previewText.value;
	console.log(selectedVoice);
	let start = (event) => {
		console.log("start")
		utils.setButtonState(elements.playPause, "pause");
		elements.previewText.setAttribute("disabled", "disabled");
		elements.clearContents.setAttribute("disabled", "disabled");
	}
	let boundary = (event) => {
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
	let pause = (event) => {
		console.log("paused")
		utils.setButtonState(elements.playPause, "play");
	}
	let resume = (event) => {
		console.log("resumed")
		utils.setButtonState(elements.playPause, "pause");
	}

	let end = (event) => {
		console.log("error/ended")
		elements.playPause = utils.setButtonState(elements.playPause, "play");
		elements.previewText.removeAttribute("disabled");
		elements.clearContents.removeAttribute("disabled");
	}

	await EasySpeech.speak({
		text: spokenText,
		voice: selectedVoice, // optional, will use a default or fallback
		pitch: 1,
		rate: 1,
		volume: 1,
		// there are more events, see the API for supported events
		start: start,
		boundary: boundary,
		pause: pause,
		resume: resume,
		error: end,
		end: end
	})
}
