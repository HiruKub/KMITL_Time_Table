console.log("Background script running...");
const ext = typeof browser !== "undefined" ? browser : chrome;

// รอรับข้อความจาก script.js
ext.runtime.onMessage.addListener((message) => {
    if (message.action === "open_timetable") {
        // ใช้คำสั่งระดับ Extension ในการเปิดแท็บใหม่
        browser.tabs.create({
            url: "time_table.html"
        }).then((tab) => {
            console.log("Opened tab")
        }).catch((err) => {
            console.log("Error :",err)
        });
    }
});