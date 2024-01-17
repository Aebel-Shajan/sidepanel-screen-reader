export function setButtonState(button, state) {
	button.className = state;
	switch (state) {
		case "play":
			button.textContent = "▶️";
			break
		case "pause":
			button.textContent = "⏸️";
			break
		case "open-settings":
			button.textContent = "⚙️";
			break
		case "close-settings":
			button.textContent = "❌"
			break
		default:
			button.textContent = state.charAt(0).toUpperCase() + state.slice(1);
			break;
	}
	return button
}

// tts functions
export function getWordPosition(str, charPos) {
	let startPos = 0;
	// Split the string into words
	const words = str.split(/ |\n/);
	// Iterate over the words
	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		const endPos = startPos + word.length;
		// Check if the charPos is within the current word
		if (startPos <= charPos && charPos <= endPos) {
			return { startPos, endPos };
		}
		// Move to the next word
		// Add 1 to account for the space after each word
		startPos = endPos + 1;
	}
	// If no word is found, return null
	return null;
}

export function cleanUpText(text) {
	if (text.length >= 30000) {
		text = text.slice(0, 30000) // max lenght that tts allows
	}
	return text
		// remove spaces before and after
		.trim()
		// remove spaces between new lines
		.replace(/ +\n/g, '\n')
		// condense multiple new lines into two
		.replace(/\n+/g, '\n\n')
		// add space to end of sentences
		.replace(/(?<=[A-Za-z0-9])\.(?=[A-Z])/g, '. ');
}

export function splitTextIntoSentences(text, maxWords = 20) {
	// Split the text into sentences, considering punctuation and new lines
	let sentences = text.match(/([^\.!\?\n]+[\.!\?\n,]+)|([^\.!\?\n]+$)/g) // fix commas for numbers


	// Function to split a sentence if it exceeds the max word count
	const splitLongSentence = (sentence) => {
			const words = sentence.split(/(?=\s+)/);
			const chunks = [];
			let currentChunk = [];

			words.forEach(word => {
					currentChunk.push(word);
					if (currentChunk.length >= maxWords) {
							chunks.push(currentChunk.join(''));
							currentChunk = [];
					}
			});

			if (currentChunk.length > 0) {
					chunks.push(currentChunk.join(''));
			}

			return chunks;
	};

	// Iterate over sentences and split them if necessary
	const splitSentences = sentences.flatMap(sentence => {
			const wordCount = sentence.split(/\s+/).length;
			return wordCount > maxWords ? splitLongSentence(sentence) : sentence;
	});

	return splitSentences;
}