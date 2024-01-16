function encodeHTML(str) {
	var tempDiv = document.createElement('div');
	tempDiv.textContent = str;
	return tempDiv.innerHTML;
}

function readyText(text) {
	return encodeHTML(text.replace(/\n$/g, '\n\n'))
}

export function setup(textareaContainer) {
	const textarea = textareaContainer.querySelector("textarea");
	const highlights = textareaContainer.querySelector(".highlights");
	const backdrop = textareaContainer.querySelector(".backdrop");
	
	textarea.addEventListener("input", () => {
		unhighlightText(textareaContainer);
	});
	
	textarea.addEventListener("scroll", () => {
		backdrop.scrollTop = textarea.scrollTop;
	});	
}


export function highlightText(textareaContainer, startIndex, endIndex) {
	const textarea = textareaContainer.querySelector("textarea");
	const highlights = textareaContainer.querySelector(".highlights");
	const backdrop = textareaContainer.querySelector(".backdrop");
	let text = textarea.value;
	if (startIndex >= endIndex || endIndex > text.length) {
		return
	}
	text = readyText(text);
	highlights.innerHTML = text.slice(0, startIndex) + '<mark>' + text.slice(startIndex, endIndex) + "</mark>" + text.slice(endIndex);
}

export function unhighlightText(textareaContainer) {
	const textarea = textareaContainer.querySelector("textarea");
	const highlights = textareaContainer.querySelector(".highlights");
	const backdrop = textareaContainer.querySelector(".backdrop");
	highlights.innerHTML = readyText(textarea.value);
	backdrop.scrollTop = textarea.scrollTop;
}