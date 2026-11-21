console.log("Timetable loaded");

let all_data = null;
let current_courses = [];

browser.storage.local.get(["time_table_data", "sec"]).then((result) => {
    console.log("ข้อมูลที่ส่งข้ามมา:", result);
    all_data = result.time_table_data;
    const current_sec = result.sec;

    if (!all_data) {
        alert("ไม่พบข้อมูลตารางเรียน");
        return;
    }

    current_courses = [...(all_data.sections[current_sec] || [])];
    // render Function
    renderTimetableGrid();
    renderCourseList();
    console.log("Section เริ่มต้นที่เลือก:", current_sec);
    console.log("วิชาบังคับของ Sec นี้:", current_courses);
    console.log("วิชา GenED / เสริมทั้งหมด:", all_data.GenED);
});


function timeToMinutes(time_str) {
    if (!time_str || !time_str.includes(":")) return 0;
    const [h, m] = time_str.split(":").map(Number);
    return (h * 60) + m;
}

function isConflict(A, B) {
    if (A.day !== B.day) return false;
    const startA = timeToMinutes(A.start_time);
    const endA = timeToMinutes(A.end_time);
    const startB = timeToMinutes(B.start_time);
    const endB = timeToMinutes(B.start_time);
    return (startA < endB && startB < endA);
}

function swapOrAddCourse(new_course) {
    const existing_course = current_courses.findIndex(c => c.code === new_course.code);
    const other_course = current_courses.filter((_, idx) => idx !== existing_course);

    for (const course of other_course) {
        if (isConflict(new_course, course)) {
            const msg = `เวลาชนกัน วิชา ${newCourse.name} (กลุ่ม ${newCourse.section})เวลา ${newCourse.day} ${newCourse.start_time}-${newCourse.end_time}ชนกับวิชา ${course.name} (${course.day}${course.start_time}-${course.end_time})`;
            alert(msg);
            return false
        }
    }

    if (existing_course !== -1) {
        current_courses[existing_course] = new_course;
    }
    else {
        current_courses.push(new_course);
    }
    renderTimetableGrid();
    renderCourseList();
}

const DAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];

// รายการช่วงเวลาหัวตาราง (13 ชั่วโมง)
const TIME_SLOTS = [
    "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
    "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
    "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00", "20:00 - 21:00"
];

function renderTimetableGrid() {
    const gridContainer = document.getElementById("timetable-grid");
    if (!gridContainer) return;

    // เคลียร์ตารางเดิมก่อนวาดใหม่
    gridContainer.innerHTML = "";

    // สร้างหัวตาราง (แถวเวลา)
    // สร้างหัวตาราง (ครอบด้วย div class grid-header-row)
    let headerHtml = `<div class="grid-header-row">`;
    headerHtml += `<div class="grid-header-day">วัน / เวลา</div>`;
    TIME_SLOTS.forEach(time => {
        headerHtml += `<div class="grid-header-time">${time}</div>`;
    });
    headerHtml += `</div>`; // ปิด grid-header-row

    // 2. สร้างแถวของแต่ละวัน (อาทิตย์ - เสาร์)
    let bodyHtml = "";
    DAYS.forEach(day => {
        bodyHtml += `<div class="day-row" data-day="${day}">`;
        bodyHtml += `<div class="day-label">${day}</div>`;
        bodyHtml += `<div class="day-slots">`;

        // ค้นหาวิชาที่เรียนในวันนี้
        const daysCourses = current_courses.filter(c => c.day === day);

        // วาดการ์ดของแต่ละวิชาลงบนแถววันนี้
        daysCourses.forEach(course => {
            const startMin = timeToMinutes(course.start_time);
            const endMin = timeToMinutes(course.end_time);

            // คำนวณตำแหน่งช่อง (เริ่มนับ 08:00 = 480 นาที, ตารางจบ 21:00 = 1260 นาที)
            // รวมเวลาทั้งหมด 13 ชม. = 780 นาที
            const totalMinutes = 13 * 60;
            const leftPercent = ((startMin - 480) / totalMinutes) * 100;
            const widthPercent = ((endMin - startMin) / totalMinutes) * 100;

            bodyHtml += `
                    <div class="course-card" style="left: ${leftPercent}%; width:
                    ${widthPercent}%;">
                        <div class="card-code">${course.code}</div>
                        <div class="card-name">${course.name} ${course.start_time} -${course.end_time}</div>
                        <div class="card-room">กลุ่ม ${course.section} |
                        ${course.room}</div>
                    </div>
                `;
        });

        bodyHtml += `</div>`; 
        bodyHtml += `</div>`; 
    });

    gridContainer.innerHTML = headerHtml + bodyHtml;
}

function renderCourseList() {
    // วาดตารางรายวิชาปัจจุบัน (#current-courses-table)
    const currentTable = document.getElementById("current-courses-table");
    if (currentTable) {
        let tableHtml = `
                <thead>
                    <tr>
                        <th>รหัสวิชา</th>
                        <th>ชื่อวิชา</th>
                        <th>กลุ่ม</th>
                        <th>วัน-เวลาเรียน</th>
                        <th>ห้องเรียน</th>
                        <th>อาจารย์ผู้สอน</th>
                        <th>จัดการ</th>
                    </tr>
                </thead>
                <tbody>
            `;

        current_courses.forEach((course, index) => {
            const isLab = course.section.includes("ปฏิบัติ");
            const badgeClass = isLab ? "badge-lab" : "badge-lec";
            const badgeText = isLab ? "ปฏิบัติ" : "ทฤษฎี";

            tableHtml += `
                    <tr>
                        <td><strong>${course.code}</strong></td>
                        <td>${course.name}</td>
                        <td>
                            <span class="badge ${badgeClass}">${course.section}</span>
                        </td>
                        <td>${course.day} ${course.start_time} - ${course.end_time}</td>
                        <td>${course.room} (${course.building})</td>
                        <td>${course.professor}</td>
                        <td>
                            <button class="btn-remove" data-index="${index}">ลบ</button>
                        </td>
                    </tr>
                `;
        });

        tableHtml += `</tbody>`;
        currentTable.innerHTML = tableHtml;

        //ปุ่มลบวิชาออกจากตาราง
        currentTable.querySelectorAll(".btn-remove").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                current_courses.splice(idx, 1); // เอาวิชาออก
                renderTimetableGrid();
                renderCourseList();
            });
        });
    }

    
    //วาดรายการวิชาอื่น ๆ สำหรับสลับ Sec หรือเพิ่ม GenED
    const availableContainer = document.getElementById("available-courses-list");
    if (!availableContainer || !all_data) return;

    // รวบรวมวิชาทั้งหมดที่มีในระบบ (ทั้งทุก Sec และ GenED)
    let allAvailable = [];
    Object.keys(all_data.sections).forEach(secKey => {
        allAvailable = allAvailable.concat(all_data.sections[secKey]);
    });
    allAvailable = allAvailable.concat(all_data.GenED || []);

    let availableHtml = `<div class="available-grid">`;

    allAvailable.forEach(course => {
        // เช็คว่าวิชานี้อยู่ในตารางปัจจุบันแล้วหรือเปล่า
        const isInCurrent = current_courses.some(
            c => c.code === course.code && c.section === course.section
        );
        // เช็คว่ามีวิชานี้แต่เป็น Sec อื่นหรือเปล่า
        const isSameCodeOtherSec = current_courses.some(
            c => c.code === course.code && c.section !== course.section
        );

        availableHtml += `
                <div class="available-card ${isInCurrent ? 'is-active' : ''}">
                    <div class="avail-header">
                        <strong>${course.code}</strong> - ${course.name}
                    </div>
                    <div class="avail-body">
                        <div>กลุ่ม: <b>${course.section}</b></div>
                        <div>เวลา: <b>${course.day}
                        ${course.start_time}-${course.end_time}</b></div>
                        <div>ห้อง: ${course.room} | ผู้สอน: ${course.professor}</div>
                    </div>
                    <div class="avail-actions">
            `;

        if (isInCurrent) {
            availableHtml += `<span class="tag-active">อยู่ในตารางแล้ว</span>`;
        } else if (isSameCodeOtherSec) {
            availableHtml += `<button class="btn-swap" data-code="${course.code}"
                data-sec="${course.section}">สลับกลุ่ม</button>`;
        } else {
            availableHtml += `<button class="btn-add" data-code="${course.code}"
                data-sec="${course.section}">เพิ่มเข้าตาราง</button>`;
        }

        availableHtml += `
                    </div>
                </div>
            `;
    });

    availableHtml += `</div>`;
    availableContainer.innerHTML = availableHtml;

    // ผูก Event ให้ปุ่มสลับ Sec และปุ่มเพิ่มวิชา
    availableContainer.querySelectorAll(".btn-swap, .btn-add").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const code = e.target.dataset.code;
            const sec = e.target.dataset.sec;

            // ค้นหาวิชาตัวที่ถูกคลิก
            const targetCourse = allAvailable.find(c => c.code === code && c.section
                === sec);
            if (targetCourse) {
                swapOrAddCourse(targetCourse);
            }
        });
    });
}