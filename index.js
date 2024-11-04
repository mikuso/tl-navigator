import { findPath } from "pathfinder";
const translocators = await (await fetch("./translocators.geojson")).json();
let formData = null;
const calculateButton = document.getElementById("calculateButton");

const defaultFormData = {
    sourceX: 0, sourceY: 0,
    targetX: 163450, targetY: -207500,
    maxWalkDistance: 4000,
    translocatorWeight: 100,
}

function makeLink(point) {
    return `<a href="https://map.tops.vintagestory.at/?x=${point[0]}&y=${point[1]}&zoom=11" target="_blank">${point[0]},${point[1]}</a>`;
}

function getFormData() {
    let formData = Object.fromEntries(
        new FormData(document.forms.CoordinatesForm)
    );
    for (let k in formData) {
        let value = formData[k];
        if (isNaN(value) || value === "") {
            const defaultValue = defaultFormData[k];
            if (typeof (defaultValue) !== "undefined") {
                const el = document.getElementById(k);
                formData[k] = defaultValue;
                el.value = formData[k];
            }
        } else {
            formData[k] = Number(value);
        }
    }

    return formData;
}

function _calculatePathInternal() {
    formData = getFormData();
    console.log(formData);
    let path = findPath(
        translocators,
        [formData.sourceX, formData.sourceY],
        [formData.targetX, formData.targetY],
        formData.maxWalkDistance,
        formData.translocatorWeight
    );
    let output = ["<ul>"]
    output.push(`<li>Start at ${makeLink(path[0])}</li>`);
    for (let i = 1; i < path.length - 1; i += 2) {
        output.push(`<li>Teleport from ${makeLink(path[i])} to ${makeLink(path[i + 1])}</li>`);
    }
    output.push(`<li>Go to ${makeLink(path[path.length - 1])}</li>`);
    output.push("</ul>");
    const text = output.join("");
    document.getElementById("output").innerHTML = text;
}

function calculatePath() {
    calculateButton.setAttribute("disabled", "disabled");
    try {
        _calculatePathInternal()
    } catch (e) {
        if (e.name === "JSNetworkXNoPath") {
            document.getElementById("output").innerHTML = `Location is unreachable with current the settings<br>
            Try increasing max walk distance (very big numbers make algorithm slower)`;
        } else {
            const errorDescription = JSON.stringify({
                data: formData,
                error: e.message
            },
                null,
                2
            );
            document.getElementById("output").innerHTML = `Error:
            ${e.message}
            <br>
            If you want to report this bug, please send message with the following text:
            <code style="display: block; white-space: pre-wrap">${errorDescription}</code>
            to <a href="mailto:herrscher.of.the.tea@gmail.com">herrscher.of.the.tea@gmail.com</a>
            `;
        }
    }
    calculateButton.removeAttribute("disabled");
}

getFormData(); // Fills with default data as a side effect

calculateButton.onclick = calculatePath;