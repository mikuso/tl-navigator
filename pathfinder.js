// @ts-check

function getDistance(point1, point2) {
    return Math.sqrt(Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2));
    // Manhattan distance. Can make sense sometimes because of the road infrastructure
    // return Math.abs(point1[0] - point2[0]) + Math.abs(point1[1] - point2[1]);
}

/**
 * @typedef {Object} TranslocatorPair
 * @property {TranslocatorPairProperties} properties
 * @property {TranslocatorPairGeometry} geometry
 */

/**
 * @typedef {Object} TranslocatorPairProperties
 * @property {number} depth1
 * @property {number} depth2
 */

/**
 * @typedef {Object} TranslocatorPairGeometry
 * @property {[[number, number], [number, number]]} coordinates
 */

function buildGraph(nodes, maxDist, translocatorWeight) {
    const graph = new jsnx.Graph();
    for (let i = 0; i < nodes.length; i++) {
        if (i % 2 === 0) {
            graph.addWeightedEdgesFrom([[i, i + 1, translocatorWeight]]);
        }
        for (let j = i - i % 2 + 2; j < nodes.length; j++) {
            const dist = getDistance(nodes[i], nodes[j])
            if (dist <= maxDist) {
                graph.addWeightedEdgesFrom([[i, j, dist]]);
            }
        }
    }
    return graph;
}

export function findPath(geojson, start, stop, maxWalkDistance, translocatorWeight) {
    /**
     * @type {Array<TranslocatorPair>}
     */
    const tlPairList = geojson["features"];
    const nodes = [];

    for (var i = 0; i < tlPairList.length; i++) {
        const pair = tlPairList[i];
        nodes.push(pair.geometry.coordinates[0]);
        nodes.push(pair.geometry.coordinates[1]);
    }

    const graph = buildGraph(nodes, maxWalkDistance, translocatorWeight);

    const startNodeId = nodes.length;
    nodes.push(start);
    for (let i = 0; i < nodes.length - 1; i++) {
        const dist = getDistance(nodes[i], start);
        if (dist <= maxWalkDistance) {
            graph.addWeightedEdgesFrom([[i, startNodeId, dist]])
        }
    }
    const stopNodeId = nodes.length;
    nodes.push(stop);
    for (let i = 0; i < nodes.length - 1; i++) {
        const dist = getDistance(nodes[i], stop);
        if (dist <= maxWalkDistance) {
            graph.addWeightedEdgesFrom([[i, stopNodeId, dist]])
        }
    }

    function areLinked(node1, node2) {
        if (node1 === startNodeId || node1 === stopNodeId || node2 === startNodeId || node2 === stopNodeId) {
            return false;
        }
        return Math.abs(node1 - node2) === 1 && Math.min(node1, node2) % 2 === 0;
    }

    let path = jsnx.shortestPaths.dijkstraPath(graph, { source: startNodeId, target: stopNodeId });

    // When using incomplete graph algorithm may choose to walk you through several close nodes
    // without teleporting. If that's the case, we should reduce path.
    const MASK_PASSTHROUGH = 0;
    const MASK_NORMAL = 1;
    const teleportMask = [MASK_NORMAL, MASK_NORMAL];
    for (let i = 2; i < path.length - 1; i++) {
        let node = path[i];
        let previousNode = path[i - 1];
        if (areLinked(node, previousNode)) {
            teleportMask[i - 1] = MASK_NORMAL
            teleportMask[i] = MASK_NORMAL
        } else {
            teleportMask[i] = MASK_PASSTHROUGH;
        }
    }
    for (let i = teleportMask.length - 1; i > 0; i--) {
        if (teleportMask[i] === MASK_PASSTHROUGH) {
            path.splice(i, 1);
        }
    }

    path = path.map((value) => nodes[value]);
    return path;
}
