import * as utils from "./utils.js"
import * as tts from "./tts.js"
import EasySpeech from "./node_modules/easy-speech/dist/EasySpeech.js"
await EasySpeech.init() // required

// code is dog water i rushed thru it

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
	volumeInput: document.querySelector("#volume-input"),
	volumeValue: document.querySelector("#volume-value"),
	rateInput: document.querySelector("#rate-input"),
	rateValue: document.querySelector("#rate-value"),
	pitchInput: document.querySelector("#pitch-input"),
	pitchValue: document.querySelector("#pitch-value")
}
let voices = tts.populateVoiceList(elements.voiceSelect, EasySpeech.voices());
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

// connect to service worker and send settings info every 2 secs
let port = chrome.runtime.connect({ name: "sidepanel-screen-reader"});
setInterval(()=> {
	port.postMessage({settings:settings});
}, 2000);

// load storage and if it exists modify our own settings
let storage = await chrome.storage.local.get(["settings"]);
if (storage.settings) {
	settings = storage.settings;
	let voiceFound = false
	for (let i = 0; i < voices.length; i++) {
		if (voices[i].name === settings.voice) {
			elements.voiceSelect.selectedIndex = i;
			voiceFound = true;
			break;
		}
	}
	if (!voiceFound) {
		settings.voice = voices[0].name;
	}
	elements.volumeValue.innerText = settings.volume
	elements.volumeInput.value = settings.volume
	elements.rateValue.innerText = settings.rate
	elements.rateInput.value = settings.rate
	elements.pitchValue.innerText = settings.pitch
	elements.pitchInput.value = settings.pitch
}

// update settings preview text
elements.previewText.addEventListener("input", () => {
	settings.previewText = elements.previewText.value
})

// hide close settings
elements.settingsButton.addEventListener("click", () => {
	let buttonState = elements.settingsButton.className;
	switch (buttonState) {
		case "open-settings":
			elements.settingsDiv.style.height = "fit-content";
			utils.setButtonState(elements.settingsButton, "close-settings");
			break;
		case "close-settings":
			elements.settingsDiv.style.height = "0px";
			utils.setButtonState(elements.settingsButton, "open-settings");
			break;
	}
})


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


// update settings
elements.voiceSelect.addEventListener("change", () => {
	settings.voice = elements.voiceSelect.selectedOptions[0].getAttribute("data-name");

})

elements.volumeInput.addEventListener("input", () => {
	settings.volume = parseFloat(elements.volumeInput.value);
	elements.volumeValue.innerText = elements.volumeInput.value;
})
elements.rateInput.addEventListener("input", () => {
	settings.rate = parseFloat(elements.rateInput.value);
	elements.rateValue.innerText = elements.rateInput.value;
})
elements.pitchInput.addEventListener("input", () => {
	settings.pitch = parseFloat(elements.pitchInput.value);
	elements.pitchValue.innerText = elements.pitchInput.value;
})


// tts functions
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
				let voiceSetting = 	voices[0]
				for (let i = 0; i < voices.length; i++) {
					if (voices[i].name === settings.voice) {
						voiceSetting = voices[i];
						break;
					}
				}
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

