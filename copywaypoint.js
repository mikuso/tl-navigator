
async function copyWaypoint(x, y, idx, total) {
    const cmd = `/waypoint addati x ${x} 0 ${y} true lime "TL Waypoint ${idx}/${total}"`;
    await window.navigator.clipboard.writeText(cmd);
}
