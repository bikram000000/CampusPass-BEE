// CampusPass - Simple JavaScript for Continuous Assessment
// Main syllabus topics used here:
// Variables, conditions, functions, arrays, objects, array methods,
// DOM, events, forms, validation, localStorage, sessionStorage,
// ES6 features, JSON, Fetch API, Promises and async/await.

const app = document.getElementById('app');
const navbar = document.getElementById('navbar');
const mobileNav = document.getElementById('mobileNav');
const profileBox = document.getElementById('profileBox');
const toast = document.getElementById('toast');

let currentUser = null;
let selectedEventId = null;
let bookingData = {};
let countdownTimer = null;

// ------------------------------------------------------------
