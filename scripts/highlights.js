export function setup(textareaContainer) {
	const textarea = textareaContainer.querySelector("textarea");
	const highlights = textareaContainer.querySelector(".highlights");
	const backdrop = textareaContainer.querySelector(".backdrop");
	
	textarea.addEventListener("input", () => {
		let text = textarea.value;
		highlights.innerHTML = text.replace(/\n$/g, '\n\n');
		backdrop.scrollTop = textarea.scrollTop;
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
	highlights.innerHTML = text.slice(0, startIndex) + '<mark>' + text.slice(startIndex, endIndex) + "</mark>" + text.slice(endIndex);
}