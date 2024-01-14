let sidePanelOpen = false

chrome.sidePanel
	.setPanelBehavior({ openPanelOnActionClick: true })
	.catch((error) => console.error(error));

// Stop tts when sidepanel is closed
chrome.runtime.onConnect.addListener(function (port) {
	if (port.name === 'sidepanel-screen-reader') {
		sidePanelOpen = true;
	}
});

if (!sidePanelOpen) {
	
}

