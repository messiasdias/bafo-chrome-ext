document.addEventListener("DOMContentLoaded", async function () {
    const sites = await fetch('sites.json').then(v => v.json());
    const list = document.getElementById("tab-list");
    list.innerHTML = "";
    chrome.tabs.query({}, (tabs) => {
        sites?.forEach((site) => {
            let tabActive = tabs.find(tab => tab.url.includes(site))
            let li = document.createElement("li");
            if(tabActive){li.classList.add('active');}
            li.textContent = `${site}`;
            list.append(li, document.createElement("br"));
        });
    });
});