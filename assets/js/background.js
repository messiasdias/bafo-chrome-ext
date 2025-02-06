// sw.js:
self.addEventListener('install', async event => {
    const sites = await fetch('/sites.json').then(v => v.json());
    
    chrome.action.openPopup();

    const extractDomainFromUrl = (url) => {
        var result = ""
        var match
        if (match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im)) {
            result = match[1]
            if (match = result.match(/^[^\.]+\.(.+\..+)$/)) {
                result = match[0] || match[1]
            }
        }
        return result
    }

    const getSiteTab = (callback = (tab) => tab) => {
        chrome.tabs.query({}, tabs => {
            callback(tabs?.filter(tab => sites.includes(extractDomainFromUrl(tab.url))))
        })
    }

    chrome.tabs.onCreated.addListener(created => {
        getSiteTab((tabs) => {
            tabs?.forEach(tab => {
                if (created.openerTabId === tab.id) {
                    console.log("created --> getSiteTab", created.openerTabId === tab.id)
                    chrome.tabs.remove(created.id)
                }
            });
        });
    });

    chrome.tabs.onActivated.addListener(actived => {
        getSiteTab((tabs) => {
            tabs?.forEach(tab => {
                if (actived.openerTabId === tab.id) {
                    console.log("actived --> getSiteTab", actived.openerTabId === tab.id)
                    chrome.tabs.remove(actived.id)
                }
            });
        });
    })
});