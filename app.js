const express = require('express')
const app = express();

const geolib = require('geolib');

const locations = [
    { index: 0, latitude: 12.9738, longitude: 77.6205 }, // Delivery Hub
    { index: 1, latitude: 12.9716, longitude: 77.5946 }, // Shop 1
    { index: 2, latitude: 12.9718, longitude: 77.5936 }, // Shop 2
    { index: 3, latitude: 12.9712, longitude: 77.5958 }, // Shop 3
    { index: 4, latitude: 12.9722, longitude: 77.5949 }, // Shop 4
    { index: 5, latitude: 12.9741, longitude: 77.5931 }, // Customer's home 1
];


function optimizeDeliveryRoute(locations) {
    const hubIndex = 0; // Use the delivery hub as the starting point for the delivery route

    // Separate the locations into two arrays: shops and customers
    const shops = locations.slice(1, 4);
    const customers = locations.slice(4);

    // Compute the distance matrix between all pairs of locations
    const distanceMatrix = computeDistanceMatrix(locations);

    // // Use the Nearest Neighbor algorithm to find a preliminary route
    const preliminaryRoute = findNearestNeighborRoute(distanceMatrix, hubIndex, shops, customers);

    // // Use the 2-Opt algorithm to improve the preliminary route
    const optimizedRoute = optimize2Opt(preliminaryRoute, distanceMatrix);

    // Convert the optimized route into an array of indices that indicate the order in which to visit the locations

    const optimizedOrder = optimizedRoute
        .filter(location => location != null)
        .map(location => location.index);
    // const optimizedOrder = optimizedRoute.map(location => location.index);

    // Insert the starting point (delivery hub) at the beginning of the optimized order
    optimizedOrder.unshift(hubIndex);
    console.log("#########################################");
    console.log("Distance Matrix");
    console.log(distanceMatrix);
    console.log("------------------------------------------");
    // Return the optimized order
    return optimizedOrder;
}

// -----------functions--------------


function computeDistanceMatrix(locations) {
    const distanceMatrix = [];
    for (let i = 0; i < locations.length; i++) {
        const row = [];
        for (let j = 0; j < locations.length; j++) {
            if (i === j) {
                row.push(0);
            } else {
                const distance = geolib.getDistance(
                    { latitude: locations[i].latitude, longitude: locations[i].longitude },
                    { latitude: locations[j].latitude, longitude: locations[j].longitude }
                );
                row.push(distance);
            }
        }
        distanceMatrix.push(row);
    }
    return distanceMatrix;
}


function findNearestNeighborRoute(distanceMatrix, hubIndex, shops, customers) {
    // Initialize the route with the delivery hub at the beginning
    const route = [{ index: hubIndex, latitude: 12.9738, longitude: 77.6205 }];

    // Initialize a set of unvisited locations containing all the shops and customers
    const unvisited = [...shops, ...customers];

    while (unvisited.length > 0) {
        const lastLocation = route[route.length - 1];
        let nearestNeighbor = null;
        let nearestNeighborDistance = Infinity;

        for (const location of unvisited) {
            const distance = distanceMatrix[lastLocation.index][location.index];
            if (distance < nearestNeighborDistance) {
                nearestNeighbor = location;
                nearestNeighborDistance = distance;
            }
        }

        // Add the nearest neighbor to the route and remove it from the unvisited set
        route.push(nearestNeighbor);
        unvisited.splice(unvisited.indexOf(nearestNeighbor), 1);
    }

    // Return the route
    return route;
}




function optimize2Opt(preliminaryRoute, distanceMatrix) {
    let bestRoute = preliminaryRoute;
    let improved = true;

    while (improved) {
        improved = false;

        for (let i = 1; i < bestRoute.length - 2; i++) {
            for (let j = i + 1; j < bestRoute.length - 1; j++) {
                const newRoute = twoOptSwap(bestRoute, i, j);
                const newDistance = computeRouteDistance(newRoute, distanceMatrix);

                if (newDistance < computeRouteDistance(bestRoute, distanceMatrix)) {
                    bestRoute = newRoute;
                    improved = true;
                }
            }
        }
    }

    return bestRoute;
}

function twoOptSwap(route, i, j) {
    const newRoute = route.slice();
    let k = i;
    let l = j;

    while (k < l) {
        const temp = newRoute[k];
        newRoute[k] = newRoute[l];
        newRoute[l] = temp;
        k++;
        l--;
    }

    return newRoute;
}

function computeRouteDistance(route, distanceMatrix) {
    let distance = 0;

    for (let i = 0; i < route.length - 1; i++) {
        const fromIndex = route[i];
        const toIndex = route[i + 1];

        distance += distanceMatrix[fromIndex.index][toIndex.index];
    }

    return distance;
}


// -------------calling---------------

const optimizedOrder = optimizeDeliveryRoute(locations);
console.log("Delivering order: Starting with hub location to varoius shops");
console.log("------------------------------------------");
console.log(" 0: represents Delivery Hub \n 1: represents Shop1\n 2: represents Shop2\n 3: represents Shop3\n 4: represents Shop4\n 5: represents Customer's location. ");
console.log("------------------------------------------");
console.log(" ## Order of delivery for shortest path and time is: ");
console.log("------------------------------------------");

console.log(optimizedOrder); // Output: [0, 3, 4, 1, 2, 5]

console.log("#########################################");



app.listen(3000, () => {
    console.log("Server is listening on 3000");
})