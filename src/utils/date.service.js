const numberService = require('./number.service');

function randomDate(startDate, endDate) {
    if (!startDate) {
        startDate = new Date(2010, 0, 1);
    }
    if (!endDate) {
        endDate = new Date();
    }
    return new Date(startDate.getTime() + numberService.randomInt(endDate.getTime() - startDate.getTime()));
}

function getYearStart(date) {
    return new Date(date.getFullYear(), 0, 1);
}

function getYearEnd(date) {
    return new Date(new Date(date.getFullYear() + 1, 0, 1) - 1);
}

function getMonthBefore(amount) {
    const monthsBefore = new Date();
    monthsBefore.setMonth(monthsBefore.getMonth() - amount);
    return monthsBefore;
}

function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
    const startOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return new Date(startOfNextMonth - 1);
}

function startOfWeek(date) {
    const day = date.getDay();
    const startOfWeek = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.getFullYear(), date.getMonth(), startOfWeek);
}

function endOfWeek(date) {
    const nextWeek = new Date(date);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const startOfNextWeek = startOfWeek(nextWeek);
    return new Date(startOfNextWeek - 1);
}

function getYearsBefore(amount) {
    return new Date(new Date().getFullYear() - amount, 0, 1);
}

function getWeekBefore() {
    const weekBefore = new Date();
    weekBefore.setDate(weekBefore.getDate() - 7);
    return weekBefore;
}

const shortMonthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function getShortMonthName(monthIndex) {
    return shortMonthsNames[monthIndex];
}

const shortWeekDayNames = ['Mon', 'Tue', 'Wen', 'Thu', 'Fri', 'Sat', 'Sun'];
function getShortWeekDay(dayIndex) {
    return shortWeekDayNames[dayIndex - 1];
}

const addDays = (date, days = 1) => {
    const copyDate = new Date(Number(date));
    copyDate.setDate(date.getDate() + days);
    return copyDate;
};

module.exports = {
    randomDate,
    getYearsBefore,
    getWeekBefore,
    getShortMonthName,
    getShortWeekDay,
    getYearStart,
    getYearEnd,
    getMonthBefore,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
};
