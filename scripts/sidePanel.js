import * as utils from "./utils.js"
import EasySpeech from "./node_modules/easy-speech/dist/EasySpeech.js"
await EasySpeech.init() // required

// variables
const elements = {
	previewTextContainer: document.querySelector("#preview-text-container"),
	previewText: document.querySelector("#preview-text"),
	displayText: document.querySelector("#display-text"),
	clearContents: document.querySelector("#clear-contents"),
	settingsButton: document.querySelector("#settings-toggle"),
	playPause: document.querySelector("#play-pause-toggle"),
	stopButton: document.querySelector("#stop"),
	settingsDiv: document.querySelector("#settings"),
	voiceSelect: document.querySelector("select"),
	resetSettings: document.querySelector("#reset-settings"),
	volumeInput: document.querySelector("#volume-input"),
	volumeValue: document.querySelector("#volume-value"),
	rateInput: document.querySelector("#rate-input"),
	rateValue: document.querySelector("#rate-value"),
	pitchInput: document.querySelector("#pitch-input"),
	pitchValue: document.querySelector("#pitch-value")
}
let voices = utils.sortVoices(EasySpeech.voices());
utils.populateVoiceSelect(elements.voiceSelect, voices);
let settings = {
	previewText: "",
	voice: voices[0].name,
	volume: 1,
	rate: 1,
	pitch: 1
}
let currentSentenceIndex = 0;
let state = "stopped";
let currentSpeech = null;
uiHandler()

// connect to service worker and send settings info every 2 secs
let port = await chrome.runtime.connect({ name: "sidepanel-screen-reader" });
setInterval(() => {
	port.postMessage({ settings: settings });
	console.log("settings sent", settings)
}, 2000);

// Start speaking when it recieves a message.
chrome.runtime.onMessage.addListener(
	(message, sender, sendResponse) => {
		try {
			setPreviewText(utils.cleanUpText(message.text));
			startSpeak(0);
		} catch {
			setPreviewText("Try refreshing the page and trying again. 😔");
			startSpeak(0);
		}
	}
)

// load storage and if it exists modify our own settings
let storage = await chrome.storage.local.get(["settings"]);
if (storage.settings) {
	setVoice(storage.settings.voice);
	setPreviewText(storage.settings.previewText);
	setVolume(storage.settings.volume);
	setPitch(storage.settings.pitch);
	setRate(storage.settings.rate);
}

// hide close settings
elements.settingsButton.addEventListener("click", () => {
	let buttonState = elements.settingsButton.className;
	switch (buttonState) {
		case "open-settings":
			elements.settingsDiv.style.display = "unset";
			utils.setButtonState(elements.settingsButton, "close-settings");
			break;
		case "close-settings":
			elements.settingsDiv.style.display = "none";
			utils.setButtonState(elements.settingsButton, "open-settings");
			break;
	}
})

// play pause event handler
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


// update settings
elements.resetSettings.addEventListener("click", () => {
	setPreviewText(elements.previewText.value);
	setVoice(voices[0].name);
	setVolume(1);
	setRate(1);
	setPitch(1);
})
elements.previewText.addEventListener("input", () => setPreviewText(elements.previewText.value))
elements.clearContents.addEventListener("click", () => setPreviewText(""))
elements.voiceSelect.addEventListener("change", () => setVoice(voices[elements.voiceSelect.selectedIndex].name))
elements.volumeInput.addEventListener("input", () => setVolume(elements.volumeInput.value))
elements.rateInput.addEventListener("input", () => setRate(elements.rateInput.value))
elements.pitchInput.addEventListener("input", () => setPitch(elements.pitchInput.value))

function setVoice(voiceName) {
	const voiceIndex = voices.findIndex(voice => voice.name === voiceName);
	if (voiceIndex === -1) { voiceIndex = 0; }
	settings.voice = voices[voiceIndex].name;
	elements.voiceSelect.selectedIndex = voiceIndex;
}
function setPreviewText(previewText) {
	settings.previewText = previewText;
	elements.previewText.value = previewText;
}
function setVolume(volume) {
	volume = parseFloat(volume);
	settings.volume = volume;
	elements.volumeValue.innerText = volume;
	elements.volumeInput.value = volume;
}
function setRate(rate) {
	rate = parseFloat(rate);
	settings.rate = rate;
	elements.rateValue.innerText = rate;
	elements.rateInput.value = rate;
}
function setPitch(pitch) {
	pitch = parseFloat(pitch);
	settings.pitch = pitch;
	elements.pitchValue.innerText = pitch;
	elements.pitchInput.value = pitch;
}


// tts functions
async function startSpeak(sentenceStartIndex) {
	function encodeHTML(str) {
		var tempDiv = document.createElement('div');
		tempDiv.textContent = str;
		return tempDiv.innerHTML;
	}
	let sentences = utils.splitTextIntoSentences(encodeHTML(elements.previewText.value), 30);
	try {
		if (sentences.length && sentenceStartIndex < sentences.length) {
			state = "playing";
			uiHandler()
			for (let sentenceIndex = sentenceStartIndex; sentenceIndex < sentences.length; sentenceIndex++) {
				currentSentenceIndex = sentenceIndex;
				const spokenSentence = sentences[sentenceIndex];
				let voiceSetting = voices.find(voice => voice.name === settings.voice) || voices[0];
				console.log(voiceSetting);
				showDisplayText(sentences, sentenceIndex);
				currentSpeech = await EasySpeech.speak({
					text: spokenSentence,
					voice: voiceSetting,
					pitch: settings.pitch,
					rate: settings.rate,
					volume: settings.volume
				})
			}
			if (state !== "paused") {
				stopSpeak();
			}
		}
	} catch (e) {
		console.log(e)
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

function uiHandler() {
	switch (state) {
		case "playing":
			utils.setButtonState(elements.playPause, "pause");
			elements.clearContents.setAttribute("disabled", "disabled");
			elements.stopButton.removeAttribute("disabled");
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
			elements.stopButton.setAttribute("disabled", "disabled");
			elements.previewText.style.display = "unset";
			elements.displayText.style.display = "none";
			elements.previewTextContainer.style.backgroundColor = "transparent"
			break;
	}
}

// tts ui
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
		if (sentenceIndex === j) {
			sentenceDiv.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}
}

