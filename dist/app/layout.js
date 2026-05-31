"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
exports.metadata = {
    title: "Paneli AutoPlant",
    description: "Panel i drejtpërdrejtë për monitorimin e bimës me ESP32",
};
function RootLayout({ children }) {
    return ((0, jsx_runtime_1.jsx)("html", { lang: "sq", children: (0, jsx_runtime_1.jsx)("body", { style: { margin: 0 }, children: children }) }));
}
