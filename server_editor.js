// @ts-check
// @ts-ignore
import { SERVER_EDIT_MODE, data } from "./data_model";

const template = document.createElement("template");

template.innerHTML = `
    <style>
    @media (prefers-color-scheme: dark) {
        :root {
            background-color: #0F0F0F;
            color: white;
        }
        a {
            color: aqua;
        }
    }
    @media (prefers-color-scheme: light) {
        :root {
            background-color: white;
            color: black;
        }
    }
    .server-editor {
        border-color:aqua;
        border-width: 1px;
        border-style: solid;
        border-radius: 3px;
        margin: 2px;
        padding: 2px;
    }
    </style>
    <div class="hidden server-editor">
        Name:<br>
        <input id="customServerName" name="customServerName" type="text"><br>
        Custom map link:<br>
        <input id="customServerUrl" name="customServerUrl" type="text"><br>
        Custom geojson file (<a id="customGeojsonUrl" target="_blank">download</a> from map website):<br>
        <input id="customGeojsonFileInput" name="customGeojsonFileInput" type="file"><br><br>
        <button id="saveCustomServer" type="button">Save</button>
        <button id="cancelCustomServer" type="button">Cancel</button>
    </div>
`;


function addServer(serverName) {
    let servers = data.getServerList();
    if (servers.indexOf(serverName) != -1) {
        return [false, "Server already exists"];
    }
    servers.push(serverName);
    data.setServerList(servers);
    return [true, servers];
}

function renameServer(oldServerName, newServerName) {
    const servers = data.getServerList();
    const oldTextIdx = servers.indexOf(oldServerName);
    if (oldTextIdx === -1) {
        return [false, "Couldn't find server!"];
    }
    servers[oldTextIdx] = newServerName;
    data.setServerList(servers);
    const serverInfo = data.getServerInfo(oldServerName);
    data.setServerInfo(newServerName, serverInfo);
    data.setServerInfo(oldServerName, null);
    return [true, servers];
}

export class ServerEditor extends HTMLElement {
    static observedAttributes = [ "data-name", "data-url" ];
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(template.content.cloneNode(true));

        this.customServerName = /** @type {HTMLInputElement} */ (shadowRoot.getElementById("customServerName"));
        this.customGeojsonFileInput = /** @type {HTMLInputElement} */ (shadowRoot.getElementById("customGeojsonFileInput"));
        this.customServerUrl = /** @type {HTMLInputElement} */ (shadowRoot.getElementById("customServerUrl"));
        this.saveCustomServer = /** @type {HTMLButtonElement} */ (shadowRoot.getElementById("saveCustomServer"));
        this.cancelCustomServer = /** @type {HTMLButtonElement} */ (shadowRoot.getElementById("cancelCustomServer"));

        const self = this;

        this.customGeojsonFileInput.onchange = function(e) {
            const file = this.customGeojsonFileInput.files[0];
            self.onFileSelect(file);
        }.bind(this);

        this.customServerUrl.onchange = function(e) {
            let url = this.customServerUrl.value;
            self.onUrlInput(url);
        }.bind(this);


        this.saveCustomServer.onclick = this.save.bind(this);

        this.cancelCustomServer.onclick = function(e) {
            this.dispatchEvent(
                new CustomEvent("edit-canceled", {})
            );
            data.setServerEditMode(SERVER_EDIT_MODE.NONE);
        }.bind(this);
    }

    onUrlInput(url) {
        if (url === "") {
            return;
        }
        if (url.indexOf("http://") != 0 && url.indexOf("https://") != 0) {
            url = "https://" + url;
        }
        try {
            url = (new URL(url)) + "data/geojson/translocators.geojson";
            // @ts-ignore
            this.shadowRoot.getElementById("customGeojsonUrl").setAttribute("href", url);
        } catch(e) {
            console.error(e);
        }
    }

    onFileSelect(file) {
        const reader = new FileReader();
        reader.onload = function() {
            data.geojsonFileStr = /** @type {string?} */ (reader.result);
        }
        reader.readAsText(file);
    }

    save() {
        if (!data.geojsonFileStr) {
            alert("Upload geojson file!");
            return;
        }
        if (data.getServerEditMode() === SERVER_EDIT_MODE.NEW) {
            let [ok, ret] = addServer(this.customServerName.value);
            if (!ok) {
                console.error(ret);
                return;
            }
        }
        if (data.getServerEditMode() === SERVER_EDIT_MODE.EDIT) {
            let [ok, ret] = renameServer(data.getCurrentServer(), this.customServerName.value);
            if (!ok) {
                console.error(ret);
                return
            }
            data.setCurrentServer(this.customServerName.value);
        }
        const infoObject = {
            geojson: data.geojsonFileStr,
            url: this.customServerUrl.value,
        };
        data.geojsonFileStr = null;
        data.setServerInfo(this.customServerName.value, infoObject);
        data.setServerEditMode(SERVER_EDIT_MODE.NONE);
        // @ts-ignore
        this.dispatchEvent(
            new CustomEvent("edit-finished", {
                detail: { name: this.customServerName.value, data: infoObject }
            })
        );
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch(name) {
            case "data-name":
                this.customServerName.value = newValue;
                break;
            case "data-url":
                this.customServerUrl.value = newValue;
                break;
            default:
                break;
        }
    }
}

customElements.define("server-editor", ServerEditor);
