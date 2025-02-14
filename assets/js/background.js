const extractDomainFromUrl = (url) => {
    try {
        let dominio = new URL(url).hostname, partes = dominio.split('.');
        if (partes.length > 2) {
            return partes.slice(-2).join('.');
        }
        return dominio;
    } catch (e) {
        return null;
    }
};

const getSiteTab = async (callback = (tab) => tab) => {
    const sites = await fetch('/sites.json').then(v => v.json());
    chrome.tabs.query({}, async tabs => {
        const ftabs = await tabs?.filter(tab => sites.includes(extractDomainFromUrl(tab.url)))
        if (ftabs[0]?.windowId) {
            chrome.storage.local.set({ windowId: ftabs[0].windowId })
        }
        callback(ftabs)
    });
};

const initListeners = async () => {
    const storage = await chrome.storage.local.get();

    if (storage.loop === false) {
        chrome.tabs.onCreated.removeListener();
        chrome.tabs.onActivated.removeListener();
        chrome.windows.onFocusChanged.removeListener();
        return console.debug('Removing listeners...');
    }

    if (storage.loop === true) {
        chrome.tabs.onCreated.addListener(created => {
            getSiteTab((tabs) => {
                tabs?.forEach(tab => {
                    if (created.openerTabId === tab.id) {
                        try {
                            chrome.tabs.remove(created.id);
                        } catch (e) {
                            console.warn(e)
                        }
                    }
                });
            });
        });

        chrome.tabs.onActivated.addListener(actived => {
            getSiteTab((tabs) => {
                tabs?.forEach(tab => {
                    if (actived.openerTabId === tab.id) {
                        try {
                            chrome.tabs.remove(actived.id);
                        } catch (e) {
                            console.warn(e)
                        }
                    }
                });
            });
        });

        chrome.windows.onFocusChanged.addListener(async (windowId) => {
            const storage = await chrome.storage.local.get();
            if (
                windowId > 0 &&
                windowId != storage.windowId
            ) {
                chrome.windows.remove(windowId)
            }
        })

        console.debug('Starting listeners...');
    }
}

self.addEventListener('install', async event => {
    console.debug('Installing service-worker...');
    initListeners();
    chrome.action.openPopup();
    chrome.storage.local.onChanged.addListener(initListeners);
});