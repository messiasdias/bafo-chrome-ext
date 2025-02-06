document.addEventListener("DOMContentLoaded", async function () {
    const sites = await fetch('sites.json').then(v => v.json());
    const list = document.getElementById("tab-list");
    list.innerHTML = "";

    chrome.tabs.query({}, (tabs) => {
        sites?.forEach((site) => {
            let li = document.createElement("li");
            li.textContent = `${site}`;
            (tabs.find(tab => tab.url.includes(site)) && li.classList.add('active'))
            list.append(li, document.createElement("br"));
        });
    });
});