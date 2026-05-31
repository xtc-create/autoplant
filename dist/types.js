"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOISTURE_LABELS = void 0;
exports.getMoistureStatus = getMoistureStatus;
function getMoistureStatus(moisture) {
    if (moisture == null)
        return "unknown";
    if (moisture < 30)
        return "dry";
    if (moisture < 60)
        return "moist";
    return "wet";
}
exports.MOISTURE_LABELS = {
    dry: "Dry — needs water",
    moist: "Moist — good",
    wet: "Very wet",
    unknown: "No data",
};
