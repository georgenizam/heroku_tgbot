const kb = require('./keyboard-buttons');

module.exports = {
    home: [
        [kb.home.registration],
        [kb.home.task],
        [kb.home.score],
        [kb.home.review]
    ],
    reg: [
        [kb.regStudTeach.stud, kb.regStudTeach.teacher],
        [kb.back],
    ],
    regStud: [
        [kb.regStudent.name],
        [kb.regStudent.age],
        [kb.regStudent.category],
        [kb.regStudent.teamName],
        [kb.regStudent.school],
        [kb.regStudent.city],
        [kb.back, kb.regStudent.sendData]
    ],
    regTeach: [
        [kb.regTeacher.name],
        [kb.regTeacher.tel],
        [kb.regTeacher.school],
        [kb.regTeacher.city],
        [kb.back, kb.regTeacher.sendData]
    ],
    reviewKb: [
        [kb.back]
    ]
};