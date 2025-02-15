const extractDomainFromUrl = async (url, debug = true) => {
    try {
        let domain = new URL(url).hostname, splits = domain.split('.');
        return (splits.length > 2) ? splits.slice(-2).join('.'): domain;
    } catch (e) {
        (debug && console.warn('Extract Domain From Url ', e))
        return null;
    }
};

const getSiteTab = async (callback = tab => tab) => {
    const storage = await chrome.storage.local.get();
    const sites = await fetch('/sites.json').then(v => v.json());
    chrome.tabs.query({}, async tabs => {
        const ftabs = await tabs?.filter(async tab => sites.includes(await extractDomainFromUrl(tab.url, storage.debug)))
        (ftabs[0]?.windowId && chrome.storage.local.set({ windowId: ftabs[0].windowId }));
        callback(ftabs, {sites, storage})
    });
};

const tabsOnActivated = actived => {
    getSiteTab((tabs, opts) => {
        tabs?.forEach(tab => {
            if (actived.openerTabId === tab.id) {
                chrome.tabs.remove(actived.id).catch((e) => {
                    (opts.storage.debug && console.warn(`Chrome tabs onActivated addListener `, e, actived.id))
                });
            }
        });
    });
};

const tabsOnCreated = created => {
    console.log('tabsOnCreated', created)
    getSiteTab((tabs, opts) => {
        console.log('tabs', tabs)
        tabs?.forEach(tab => {
            console.log('tabsOnCreated', created.openerTabId, tab.id, created.openerTabId === tab.id)
            if (created.openerTabId === tab.id) {
                chrome.tabs.remove(created.id).catch((e) => {
                    (opts.storage.debug && console.warn(`Chrome tabs onCreated addListener `, e, created.id))
                });
            }
        });
    });
};

const windowOnFocusChanged = async (windowId) => {
    const storage = await chrome.storage.local.get();
    if (
        windowId > 0 &&
        windowId != storage.windowId
    ) {
        try {
            chrome.windows.remove(windowId);
        } catch (e) {
            (storage.debug && console.warn(`Chrome windows onFocusChanged addListener error:`, e, windowId))
        }
    }
};

const initListeners = async () => {
    const storage = await chrome.storage.local.get();

    const hasListeners = [
        chrome.tabs.onCreated.hasListeners(),
        chrome.tabs.onActivated.hasListeners(),
        chrome.windows.onFocusChanged.hasListeners()
    ].some(v => v);

    if (storage.loop === true && !hasListeners) {
        chrome.tabs.onCreated.addListener(tabsOnCreated);
        chrome.tabs.onActivated.addListener(tabsOnActivated);
        chrome.windows.onFocusChanged.addListener(windowOnFocusChanged);
        return (storage.debug && console.debug('Starting listeners...'));
    }

    if (storage.loop === false && hasListeners) {
        chrome.tabs.onCreated.removeListener(tabsOnCreated);
        chrome.tabs.onActivated.removeListener(tabsOnActivated);
        chrome.windows.onFocusChanged.removeListener(windowOnFocusChanged);
        return (storage.debug && console.debug('Removing listeners...'));
    }
}


self.addEventListener("activate", async () => {
    ((await chrome.storage.local.get()).debug && console.log("Actived service-worker..."));

    chrome.alarms.create("loop", { periodInMinutes: (1 / 60) });

    chrome.alarms.onAlarm.addListener(async (alarm) => {
        if (alarm.name === "loop") {
            initListeners();
            ((await chrome.storage.local.get()).debug && console.log("Chrome alarms onAlarm addListener:", alarm.name));
        }
    });

    return self.clients.claim();
});