console.log("KMITL Time Table Plus Extension loaded");

const ext = typeof browser !== "undefined" ? browser : chrome;

function checkCurrentPage() {
    const hash = window.location.hash;
    console.log("Current Hash:", hash);

    if (hash.includes("teach_table")) {
        console.log("at the page now");
        waitForTable((rows) => {
            const courses = parseTimeTable(rows);
            const organizedData = organizeSections(courses);
            console.log("Organized Timetable Data:", organizedData);
            renderControlButtons(organizedData);
        });
    } else {
        document.body.style.border = "none";
    }
}

checkCurrentPage();

window.addEventListener("hashchange", checkCurrentPage);


function waitForTable(callback) {
    const checkInterval = setInterval(() => {
        const rows = document.querySelectorAll("table tbody tr")
        if (rows.length > 0) {
            clearInterval(checkInterval);
            callback(rows);
        }
    }, 2000)
}

function parseTimeTable(rows) {
    const courses = [];
    rows.forEach((row) => {
        const cells = row.querySelectorAll("td");

        if (cells.length < 8) return;
        const course_code = cells[0]?.innerText.trim();
        const course_name = cells[1]?.innerText.trim();
        const section = cells[3]?.innerText.trim();
        const schedule_text = cells[4]?.innerText.trim();
        const room = cells[5]?.innerText.trim();
        const building = cells[6]?.innerText.trim();
        const professor = cells[7]?.innerText.trim();

        let day = "";
        let start_time = "";
        let end_time = "";

        if (schedule_text && schedule_text.includes(" ")) {
            const parts = schedule_text.split(" ")
            day = parts[0];
            if (parts[1] && parts[1].includes("-")) {
                const times = parts[1].split("-");
                start_time = times[0];
                end_time = times[1];
            }
        }

        courses.push({
            code: course_code,
            name: course_name,
            section: section,
            day: day,
            start_time: start_time,
            end_time: end_time,
            room: room,
            building: building,
            professor: professor
        });
    });
    console.log("reading subject info success :", courses.length);
    console.table(courses);
    return courses
}

function organizeSections(courses) {
    const time_table_data = {
        sections: {},
        GenED: []
    }
    courses.forEach((course) => {
        
        const sec_digit = course.section.match(/\d+/)?.[0] || "";// RegEx catch only integer (only get 101 in 101 ปฏิบัติ)
        const sec_num = parseInt(sec_digit, 10);//convert string to int

        const is_gened = course.code.startsWith("90") || sec_num >= 900 || course.code.startsWith("1");
        if (is_gened) {
            time_table_data.GenED.push(course)
        }
        else {
            const sec_key = sec_digit.slice(-1);
            if (!time_table_data.sections[sec_key]) {
                time_table_data.sections[sec_key] = [];
            }
            time_table_data.sections[sec_key].push(course);
        }
    });
    return time_table_data;
}

function renderControlButtons(organizedData) {
    if (document.getElementById("kmitl-timetable-control")) return;

    const container = document.createElement("div");
    container.id = "kmitl-timetable-control";
    container.style = "margin: 15px 0; padding: 10px; background: #fff3e0; border-radius: 8px; border: 1px solid #ffb74d; "

    const sec_keys = Object.keys(organizedData.sections);
    let html = `<strong>เลือก Section หลัก:</strong> `;
    html += `<select id="kmitl-sec-select" style="padding: 5px; margin: 0 10px; border-radius: 8px;border: 1px solid #000000 ;font-size:
        14px;">`;
    sec_keys.forEach(sec => {
        html += `<option value="${sec}"  style ="border: 1px solid #000000">Section ${sec}</option>`;
    });
    html += `</select>`;
    html += `<button id="kmitl-open-btn" style="padding: 6px 12px; background: #e65100; color:
        white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        เปิดตารางเรียน</button>`;

    container.innerHTML = html;

    // insert controller bar before the table
    const table = document.querySelector('table');
    table?.parentElement?.insertBefore(container, table);

    document.getElementById("kmitl-open-btn").addEventListener("click", () => {
        console.log("clicked");
        const selected_sec = document.getElementById("kmitl-sec-select").value;
        console.log("selected_sec",selected_sec);
        
        ext.storage.local.set({
            time_table_data: organizedData,
            sec : selected_sec
        }).then(()=> {
            // const url = ext.runtime.getURL("time_table.html");
            ext.runtime.sendMessage({ action: "open_timetable" });
        });
    });
}