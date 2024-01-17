let settings = null;

chrome.sidePanel
	.setPanelBehavior({ openPanelOnActionClick: true })
	.catch((error) => console.error(error));

chrome.runtime.onConnect.addListener(function (port) {
	port.onMessage.addListener((message) => {
		settings = message.settings;
	})

	// save settings on panel close
	port.onDisconnect.addListener(() => {
		if (settings) {
			chrome.storage.local.set({settings: settings});
		}
	})
});

