"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAdzunaJobs = fetchAdzunaJobs;
require("dotenv/config");
var axios_1 = require("axios");
var ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
var ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
var ADZUNA_COUNTRY = 'us';
if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    throw new Error('Adzuna API credentials are not set in environment variables.');
}
// Full list of 209 area cities
var area209Cities = [
    'Stockton, CA', 'Modesto, CA', 'Tracy, CA', 'Manteca, CA', 'Merced, CA', 'Turlock, CA', 'Lodi, CA', 'Ceres, CA', 'Atwater, CA', 'Los Banos, CA', 'Riverbank, CA', 'Oakdale, CA', 'Patterson, CA', 'Lathrop, CA', 'Ripon, CA', 'Escalon, CA', 'Galt, CA', 'Gustine, CA', 'Livingston, CA', 'Newman, CA', 'Valley Springs, CA', 'Angels Camp, CA', 'Copperopolis, CA', 'San Andreas, CA', 'Murphys, CA', 'Arnold, CA', 'Hughson, CA', 'Waterford, CA', 'Delhi, CA', 'Denair, CA', 'Hilmar, CA', 'Empire, CA', 'Planada, CA', 'Winton, CA', 'Snelling, CA', 'Ballico, CA', 'Keyes, CA', 'Farmington, CA', 'Linden, CA', 'Lockeford, CA', 'Clements, CA', 'Wallace, CA', 'West Point, CA', 'Rail Road Flat, CA', 'Mountain Ranch, CA', 'Burson, CA', 'Rancho Calaveras, CA', 'La Grange, CA', 'Catheys Valley, CA', 'Coulterville, CA', 'Hornitos, CA', 'Hickman, CA'
];
function fetchAdzunaJobs() {
    return __awaiter(this, arguments, void 0, function (cities, resultsPerCity) {
        var allJobs, _i, cities_1, city, page, totalPages, url, params, response, jobs, error_1;
        var _a, _b;
        if (cities === void 0) { cities = area209Cities; }
        if (resultsPerCity === void 0) { resultsPerCity = 50; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    allJobs = [];
                    _i = 0, cities_1 = cities;
                    _c.label = 1;
                case 1:
                    if (!(_i < cities_1.length)) return [3 /*break*/, 7];
                    city = cities_1[_i];
                    page = 1;
                    totalPages = 1;
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 4, , 5]);
                    url = "https://api.adzuna.com/v1/api/jobs/".concat(ADZUNA_COUNTRY, "/search/").concat(page);
                    params = {
                        app_id: ADZUNA_APP_ID,
                        app_key: ADZUNA_APP_KEY,
                        where: city,
                        results_per_page: resultsPerCity,
                    };
                    return [4 /*yield*/, axios_1.default.get(url, {
                            params: params,
                            headers: { Accept: 'application/json' }
                        })];
                case 3:
                    response = _c.sent();
                    jobs = response.data.results || [];
                    if (jobs.length > 0) {
                        allJobs.push.apply(allJobs, jobs);
                    }
                    // Pagination info
                    totalPages = ((_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.pagination) === null || _b === void 0 ? void 0 : _b.pages) || 1;
                    if (page === 1) {
                        console.log("City: ".concat(city, " | Total pages: ").concat(totalPages));
                    }
                    console.log("Fetched ".concat(jobs.length, " jobs for city: ").concat(city, " (page ").concat(page, "/").concat(totalPages, ")"));
                    page++;
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _c.sent();
                    if (error_1.response) {
                        console.error("Error fetching jobs for city ".concat(city, " (page ").concat(page, "):"), error_1.response.data);
                    }
                    else {
                        console.error("Error fetching jobs for city ".concat(city, " (page ").concat(page, "):"), error_1.message);
                    }
                    return [3 /*break*/, 6]; // Stop paging this city on error
                case 5:
                    if (page <= totalPages) return [3 /*break*/, 2];
                    _c.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7:
                    console.log("Total jobs fetched from Adzuna: ".concat(allJobs.length));
                    return [2 /*return*/, allJobs];
            }
        });
    });
}
