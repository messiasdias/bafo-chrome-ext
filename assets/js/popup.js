const startStopBtnSetText = async (btn, started = false) => {
    if (started === true) {
        return btn.innerHTML = "Parar"
    }
    btn.innerHTML = "Iniciar"
};

const setDebugTextOpacity = (btn, debug = true) => {
    return (debug ? btn.classList.add('active') : btn.classList.remove('active'));
}

document.addEventListener("DOMContentLoaded", async function () {
    let storage = await chrome.storage.local.get();

    const sites = await fetch('sites.json').then(v => v.json());
    const list = document.querySelector("#tab-list");
    list.innerHTML = "";

    chrome.tabs.query({}, (tabs) => {
        sites?.forEach((site) => {
            let li = document.createElement("li");
            li.textContent = `${site}`;
            (tabs.find(tab => tab.url.includes(site)) && li.classList.add('active'))
            list.append(li, document.createElement("br"));
        });
    });

    const startStopBtn = document.querySelector('#start-stop-btn')
    startStopBtn.addEventListener("click", async () => {
        storage = await chrome.storage.local.get();
        await chrome.windows.getCurrent(window => {
            chrome.storage.local.set({
                loop: !storage.loop,
                windowId: window.id
            });
            startStopBtnSetText(startStopBtn, !storage.loop);
        });
    });

    const debugBtn = document.querySelector('#debug-btn')
    debugBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        storage = await chrome.storage.local.get();
        const debug = !storage.debug;
        setDebugTextOpacity(debugBtn, debug);
        chrome.storage.local.set({debug: debug});
    })
    
    startStopBtnSetText(startStopBtn, storage.loop);
    setDebugTextOpacity(debugBtn, storage.debug)
});