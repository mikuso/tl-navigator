// @ts-check
const defaultServerName = "TOPS";
const defaultServerUrl = "https://map.tops.vintagestory.at";

export const SERVER_EDIT_MODE = {
    NONE: 0,
    EDIT: 1,
    NEW: 2,
};

const SERVER_EDIT_MODE_ARR = [
    SERVER_EDIT_MODE.NONE,
    SERVER_EDIT_MODE.EDIT,
    SERVER_EDIT_MODE.NEW,
];

const internal = {
    /** @type {string?} */
    currentServer: null,
    serverEditMode: SERVER_EDIT_MODE.NONE,
    /** @type {Array<string>?} */
    serverList: null,
    currentServerGeojson: null,
    path: null,
}

const CURRENT_SCHEMA_VERSION = "1-26.11.24";
const pathSubscribers = [];
const errorSubscribers = [];

export const data = {
    /** @type {string?} */
    geojsonFileStr: null,

    /**
     * @returns {string}
     */
    getCurrentServer() {
        if (!internal.currentServer) {
            internal.currentServer = localStorage.getItem("currentServer");
        }
        if (!internal.currentServer) {
            localStorage.setItem("currentServer", defaultServerName);
            internal.currentServer = defaultServerName;
        }
        return internal.currentServer;
    },
    /**
     * @param {string} value
     */
    setCurrentServer(value) {
        localStorage.setItem("currentServer", value);
        internal.currentServer = value;
    },

    getServerEditMode() {
        return internal.serverEditMode;
    },
    /**
     * @param {number} value
     */
    setServerEditMode(value) {
        if (SERVER_EDIT_MODE_ARR.indexOf(value) === -1) {
            throw TypeError(`serverEditMode must be one of ${JSON.stringify(SERVER_EDIT_MODE)}`);
        }
        internal.serverEditMode = value;
    },

    setServerList(servers) {
        internal.serverList = Array.from(servers);
        localStorage.setItem("serverList", JSON.stringify(internal.serverList));
    },
    /** @returns {Array<string>} */
    getServerList() {
        if (!internal.serverList) {
            const serverListStr = localStorage.getItem("serverList");
            if (serverListStr) {
                internal.serverList = JSON.parse(serverListStr);
            }
        }
        if (!internal.serverList) {
            internal.serverList = [ defaultServerName ];
        }
        return Array.from(internal.serverList);
    },

    /**
     * @typedef {Object} ServerInfo
     * @property {string|null} geojson
     * @property {string|URL|null} url
     */

    /**
     * @param {string} name
     * @returns {ServerInfo?}
     */
    getServerInfo(name) {
        const geojsonKey = "geojson_" + name;
        const urlKey = "url_" + name;
        const geojson = localStorage.getItem(geojsonKey);
        const url = localStorage.getItem(urlKey);
        return {
            url: url,
            geojson: geojson,
        };
    },

    /**
     * @param {string} name
     * @param {ServerInfo?} info
     */
    setServerInfo(name, info) {
        const geojsonKey = "geojson_" + name;
        const urlKey = "url_" + name;
        if (!info) {
            localStorage.removeItem(geojsonKey);
            localStorage.removeItem(urlKey);
            return;
        }
        let [geojson, url] = [info.geojson, info.url];
        if (typeof (geojson) === "object") {
            geojson = JSON.stringify(geojson);
        }
        if (url instanceof URL) {
            url = url.toString();
        }
        if (geojson) {
            localStorage.setItem(geojsonKey, geojson);
        }
        if (url) {
            localStorage.setItem(urlKey, url);
        } else {
            localStorage.removeItem(urlKey);
        }
    },

    getCurrentGeojson() {
        const currentServer = this.getCurrentServer();
        const currentServerInfo = this.getServerInfo(currentServer);
        const geojson = currentServerInfo?.geojson;
        if (!geojson) {
            throw Error("Server geojson not found");
        }

        return JSON.parse(geojson);
    },

    setPath(path) {
        internal.path = path;
        pathSubscribers.forEach(sub => {
            sub.dispatchEvent(
                new CustomEvent(
                    "update-path",
                    { detail: { path: path, url: this.getServerInfo(this.getCurrentServer())?.url } },
                )
            )
        });
    },

    getPath() {
        return internal.path
    },

    setErrorText(errorText) {
        errorSubscribers.forEach(sub => {
            sub.dispatchEvent(
                new CustomEvent(
                    "update-error",
                    { detail: { error: errorText } },
                )
            )
        });
    },

    addPathSubscriber(el) {
        pathSubscribers.push(el);
    },

    addErrorSubscriber(el) {
        errorSubscribers.push(el);
    },

    assureDataValid(forceReset) {
        async function onFirstLoad() {
            localStorage.clear();
            const geojsonString = await (await fetch("./translocators.geojson")).text();
            localStorage.setItem("SCHEMA_VERSION", CURRENT_SCHEMA_VERSION);
            data.setServerList([defaultServerName]);
            data.setServerInfo(defaultServerName, {
                geojson: geojsonString,
                url: defaultServerUrl,
            });
        }

        if (forceReset || localStorage.getItem("SCHEMA_VERSION") != CURRENT_SCHEMA_VERSION) {
            onFirstLoad();
        }
    }
}

Object.preventExtensions(data);
