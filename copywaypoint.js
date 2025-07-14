
async function copyWaypoint(x, y) {
    const cmd = `/waypoint addati cross ${x} 0 ${y} true red Waypoint`;
    await window.navigator.clipboard.writeText(cmd);
}
