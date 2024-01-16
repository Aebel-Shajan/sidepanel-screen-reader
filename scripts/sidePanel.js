import * as utils from "./utils.js"
import * as tts from "./tts.js"
import EasySpeech from "./node_modules/easy-speech/dist/EasySpeech.js"
await EasySpeech.init() // required

const elements = {
	previewTextContainer: document.querySelector("#preview-text-container"),
	previewText: document.querySelector("#preview-text"),
	displayText: document.querySelector("#display-text"),
	clearContents: document.querySelector("#clear-contents"),
	playPause: document.querySelector("#play-pause-toggle"),
	stopButton: document.querySelector("#stop"),
	voiceSelect: document.querySelector("select")

}
let voices = tts.populateVoiceList(elements.voiceSelect, EasySpeech.voices());
let selectedVoice = voices[0];
let currentSentenceIndex = 0;
let state = "stopped"
let currentSpeech = null;

elements.clearContents.addEventListener("click", () => {
	elements.previewText.value = "";
})

elements.playPause.addEventListener("click", async () => {
	switch (state) {
		case "paused":
			resumeSpeak();
			break;
		case "playing":
			pauseSpeak();
			break;
		case "stopped":
			startSpeak(0);
			break;
		default:
			state = "stopped";
			break;
	}
});

elements.stopButton.addEventListener("click", async () => {
	await stopSpeak();
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


async function startSpeak(sentenceStartIndex) {
	function encodeHTML(str) {
		var tempDiv = document.createElement('div');
		tempDiv.textContent = str;
		return tempDiv.innerHTML;
	}
	let sentences = utils.splitTextIntoSentences(encodeHTML(elements.previewText.value), 20);
	try {
		if (sentences.length && sentenceStartIndex < sentences.length) {
			state = "playing";
			uiHandler()
			for (let sentenceIndex = sentenceStartIndex; sentenceIndex < sentences.length; sentenceIndex++) {
				currentSentenceIndex = sentenceIndex;
				const spokenSentence = sentences[sentenceIndex];
				showDisplayText(sentences, sentenceIndex);
				currentSpeech = await EasySpeech.speak({
					text: spokenSentence,
					voice: selectedVoice, // optional, will use a default or fallback
					pitch: 1,
					rate: 1,
					volume: 1,
				})

			}
			if (state !== "paused") {
				stopSpeak();
			}
		}
	} catch {

	}
}

async function pauseSpeak() {
	state = "paused"
	uiHandler()
	console.log("paused")
	await EasySpeech.cancel();
}
async function resumeSpeak() {
	state = "playing"
	uiHandler()
	console.log("resumed");
	await startSpeak(currentSentenceIndex);
}

async function stopSpeak() {
	state = "stopped"
	uiHandler()
	console.log("error/ended")
	currentSentenceIndex = 0;
	await EasySpeech.cancel();
}

function showDisplayText(sentences, sentenceIndex) {
	elements.displayText.innerHTML = "";
	for (let j = 0; j < sentences.length; j++) {
		let sentenceDiv = document.createElement("a");
		let className = "sentence-div ";
		sentenceDiv.innerHTML = sentences[j];
		if (sentenceIndex === j) {
			className += "current-sentence";
		}
		sentenceDiv.className = className;
		sentenceDiv.addEventListener("click", async () => {
			stopSpeak();
			await startSpeak(j);

		})
		elements.displayText.appendChild(sentenceDiv);
	}
}


function uiHandler() {
	switch (state) {
		case "playing":
			utils.setButtonState(elements.playPause, "pause");
			elements.clearContents.setAttribute("disabled", "disabled");
			elements.previewText.style.display = "none";
			elements.displayText.style.display = "unset";
			elements.previewTextContainer.style.backgroundColor = "#ffffff77"
			break;
		case "paused":
			utils.setButtonState(elements.playPause, "play");
			break;
		case "stopped":
		default:
			utils.setButtonState(elements.playPause, "play");
			elements.clearContents.removeAttribute("disabled");
			elements.previewText.style.display = "unset";
			elements.displayText.style.display = "none";
			elements.previewTextContainer.style.backgroundColor = "transparent"

			break;
	}
}