let settings = null;
let sidePanelOpen = false;
let runOnConnect = () => { };

chrome.sidePanel
	.setPanelBehavior({ openPanelOnActionClick: true })
	.catch((error) => console.error(error));

chrome.runtime.onConnect.addListener(function (port) {
	sidePanelOpen = true;
	runOnConnect();
	runOnConnect = () => { }; // reset so it doesnt fire again when sidepanel opened again
	port.onMessage.addListener((message) => {
		settings = message.settings;
	})

	// save settings on panel close
	port.onDisconnect.addListener(() => {
		if (settings) {
			chrome.storage.local.set({ settings: settings });
		}
		sidePanelOpen = false;
		runOnConnect = () => {}; // just in case
	})
});



// Add context menu for reading website
chrome.runtime.onInstalled.addListener(function () {
	chrome.contextMenus.create({
		title: "Read website",
		id: "read-website",
		contexts: ["page"]
	});
	chrome.contextMenus.create({
		title: "Read selection: %s",
		id: "read-selection",
		contexts: ["selection"]
	});

})
// 
chrome.contextMenus.onClicked.addListener(
	async (info, tab) => {
		switch (info.menuItemId) {
			case "read-website":
				await chrome.sidePanel.open({ windowId: tab.windowId });
				if (sidePanelOpen) {
					readWebsite(tab.id);
				} else {
					runOnConnect = () => readWebsite(tab.id);
				}
				break;
			case "read-selection":
				await chrome.sidePanel.open({ windowId: tab.windowId }); // grr
				if (sidePanelOpen) {
					readSelection(info.selectionText);
				} else {
					runOnConnect = () => readSelection(info.selectionText);
				}
				break;
			default:
				break;
		}
	}
)

function readSelection(selection) {
	chrome.runtime.sendMessage({ text: selection });
}

function readWebsite(tabId) {
	chrome.scripting.executeScript({
		target: { tabId: tabId },
		files: ["scripts/parseWebsite.bundle.js"]
	});
}