// @ts-check
import { findPath } from "./pathfinder";
import { data, SERVER_EDIT_MODE } from "./data_model";
import { TlNavigatorServerEditor } from "./components/server_editor";
// Welcome to the spaghetti realm

let formData = null;

/** @type {HTMLButtonElement} */
// @ts-ignore
const calculateButton = document.getElementById("calculateButton");
/** @type {HTMLSelectElement} */
// @ts-ignore
const mapUrlSelect = document.getElementById("mapUrlSelect");
/** @type {HTMLButtonElement} */
// @ts-ignore
const editServerInfo = document.getElementById("editServerInfo");
/** @type {HTMLButtonElement} */
// @ts-ignore
const newServerInfo = document.getElementById("newServerInfo");
/** @type {HTMLButtonElement} */
// @ts-ignore
const resetServerInfo = document.getElementById("resetServerInfo");
/** @type {TlNavigatorServerEditor} */
// @ts-ignore
const customServerEditor = document.getElementById("customServerEditor");
/** @type {HTMLFormElement} */
const coordinatesForm = document.forms["CoordinatesForm"];

// AF = https://map.ri.aurafury.org
// TOPS = https://map.tops.vintagestory.at

const defaultFormData = {
    sourceX: 0, sourceY: 0,
    targetX: 0, targetY: 0,
    maxWalkDistance: 4000,
    translocatorWeight: 100,
}

const numberValues = [
    "sourceX", "targetX",
    "sourceY", "targetY",
    "maxWalkDistance", "translocatorWeight"
];

function fillMapSelect(serverList) {
    if (!serverList) {
        serverList = data.getServerList();
    }
    mapUrlSelect.innerHTML = "";
    serverList.forEach(function(name) {
        const optionElement = document.createElement("option");
        optionElement.value = name;
        optionElement.innerText = name;
        mapUrlSelect.appendChild(optionElement);
    });
    mapUrlSelect.value = data.getCurrentServer();
}

function getFormData() {
    let formData = Object.fromEntries(
        new FormData(coordinatesForm)
    );
    for (let k in formData) {
        let value = formData[k];
        // @ts-ignore
        if (numberValues.indexOf(k) >= 0 && (isNaN(value) || value === "")) {
            const defaultValue = defaultFormData[k];
            if (typeof (defaultValue) !== "undefined") {
                const el = document.getElementById(k);
                formData[k] = defaultValue;
                // @ts-ignore
                el.value = formData[k];
            }
        } else {
            // @ts-ignore
            formData[k] = Number(value);
        }
    }

    return formData;
}

function _calculatePathInternal() {
    const geojson = data.getCurrentGeojson();
    formData = getFormData();
    return findPath(
        geojson,
        [formData.sourceX, -formData.sourceY],
        [formData.targetX, -formData.targetY],
        formData.maxWalkDistance,
        formData.translocatorWeight
    );
}

function calculatePath() {
    calculateButton.setAttribute("disabled", "disabled");
    try {
        const path = _calculatePathInternal();
        data.setPath(path);
    } catch (e) {
        let text = "";
        if (e.name === "JSNetworkXNoPath") {
            text = `Location is unreachable with current the settings<br>
            Try increasing max walk distance (very big numbers make algorithm slower)`;
        } else {
            console.error(e);
            const errorDescription = JSON.stringify({
                data: formData,
                error: e.message
            },
                null,
                2
            );
            text = `Error:
            ${e.message}
            <br>
            If you want to report this bug, please send message with the following text:
            <code style="display: block; white-space: pre-wrap">${errorDescription}</code>
            to <a href="mailto:herrscher.of.the.tea@gmail.com">herrscher.of.the.tea@gmail.com</a>
            `;
        }
        data.setErrorText(text);
    }
    calculateButton.removeAttribute("disabled");
}

calculateButton.onclick = calculatePath;

function setServerInfoEditable(isEditable) {
    if (isEditable) {
        customServerEditor.classList.remove("hidden");
        editServerInfo.classList.add("hidden");
    } else {
        customServerEditor.classList.add("hidden");
        editServerInfo.classList.remove("hidden");
    }
}

mapUrlSelect.addEventListener("change", function(e) {
    // @ts-ignore
    const optionId = e.target.value;

    data.setServerEditMode(SERVER_EDIT_MODE.NONE);
    data.setCurrentServer(optionId);
    mapUrlSelect.value = optionId;
    customServerEditor.setAttribute("data-name", optionId);
    // @ts-ignore
    customServerEditor.setAttribute("data-url", data.getServerInfo(optionId)?.url || "");
});

editServerInfo.onclick = function(e) {
    data.setServerEditMode(SERVER_EDIT_MODE.EDIT);
    setServerInfoEditable(true);
}

newServerInfo.onclick = function(e) {
    customServerEditor.setAttribute("data-name", "");
    customServerEditor.setAttribute("data-url", "");
    data.setServerEditMode(SERVER_EDIT_MODE.NEW);
    setServerInfoEditable(true);
}

resetServerInfo.onclick = async function(e) {
    data.assureDataValid(true);
    window.location.reload();
}

data.assureDataValid();

getFormData(); // Fills with default data as a side effect
fillMapSelect();
setServerInfoEditable(false);

customServerEditor.addEventListener(
    "edit-finished",
    function(event) {
        // @ts-ignore
        data.setCurrentServer(event.detail.name);

        fillMapSelect();
        setServerInfoEditable(false);
    }
);

customServerEditor.addEventListener(
    "edit-canceled",
    function(event) {
        fillMapSelect();
        setServerInfoEditable(false);
    }
);

const inputs = ["sourceX", "sourceY", "targetX", "targetY"].reduce((map, id) => {
    map[id] = document.getElementById(id);
    return map;
}, {});

function readSearchParams() {
    const url = new URL(window.location.href);
    const params = ["sx", "sy", "tx", "ty"].reduce((map, key) => {
        const val = +url.searchParams.get(key);
        map[key] = Number.isNaN(val) ? 0 : val;
        return map;
    }, {});

    inputs.sourceX.value = params.sx;
    inputs.sourceY.value = params.sy;
    inputs.targetX.value = params.tx;
    inputs.targetY.value = params.ty;
}

function updateSearchParams() {
    const url = new URL(window.location.href);
    url.searchParams.set('sx', inputs.sourceX.value);
    url.searchParams.set('sy', inputs.sourceY.value);
    url.searchParams.set('tx', inputs.targetX.value);
    url.searchParams.set('ty', inputs.targetY.value);
    window.history.replaceState(null, '', url.toString());
}

[
    inputs.sourceX,
    inputs.sourceY,
    inputs.targetX,
    inputs.targetY,
].forEach(input => {
    input.addEventListener('change', updateSearchParams);
    input.addEventListener('keyup', updateSearchParams);
});

function handlePaste(event) {
    const clipboardData = event.clipboardData || window.clipboardData;
    const pastedData = clipboardData.getData('Text');
    try {
        const url = new URL(pastedData);
        const x = Number(url.searchParams.get("x"));
        const y = -Number(url.searchParams.get("y"));

        if (this.id === "sourceCoordinates") {
            document.getElementById("sourceX").value = x;
            document.getElementById("sourceY").value = y;
        } else if (this.id === "targetCoordinates") {
            document.getElementById("targetX").value = x;
            document.getElementById("targetY").value = y;
        }

        updateSearchParams();
        event.stopPropagation();
        event.preventDefault();
    } catch (e) {
        console.error(e);
    }
}

document.getElementById("sourceCoordinates")?.addEventListener("paste", handlePaste, true);
document.getElementById("targetCoordinates")?.addEventListener("paste", handlePaste, true);

readSearchParams();
