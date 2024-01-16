import * as utils from "./utils.js";

export function populateVoiceList(voiceSelect, voices) {
	voices = voices.sort(function (a, b) {
		const aname = a.name.toUpperCase();
		const bname = b.name.toUpperCase();

		if (aname.includes("ENGLISH")) { // INGERLANSD LES GOOO
			return -1;
		} else if (bname.includes("ENGLISH")) {
			return +1;
		} else if (aname < bname) {
			return -1;
		} else if (aname == bname) {
			return 0;
		} else {
			return +1;
		}
	});
	const selectedIndex =
		voiceSelect.selectedIndex < 0 ? 0 : voiceSelect.selectedIndex;
	voiceSelect.innerHTML = "";

	for (let i = 0; i < voices.length; i++) {
		const option = document.createElement("option");
		option.textContent = `${voices[i].name} (${voices[i].lang})`;

		if (voices[i].default) {
			option.textContent += " -- DEFAULT";
		}

		option.setAttribute("data-lang", voices[i].lang);
		option.setAttribute("data-name", voices[i].name);
		voiceSelect.appendChild(option);
	}
	voiceSelect.selectedIndex = selectedIndex;
	return voices;
}