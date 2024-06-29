import browser from "webextension-polyfill";

browser.devtools.panels.create("fiveway", "", "src/panel.html");
