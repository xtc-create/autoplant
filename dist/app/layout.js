"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
exports.metadata = {
    title: "AutoPlant Dashboard",
    description: "Live ESP32 plant monitoring dashboard",
};
function RootLayout({ children }) {
    return ((0, jsx_runtime_1.jsx)("html", { lang: "en", children: (0, jsx_runtime_1.jsx)("body", { style: { margin: 0 }, children: children }) }));
}
