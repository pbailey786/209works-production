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
exports.upsertAdzunaJobsToDb = upsertAdzunaJobsToDb;
var adzunaService_1 = require("./adzunaService");
var prisma_1 = require("../api/auth/prisma");
function mapContractTimeToJobType(contract_time) {
    switch (contract_time) {
        case 'full_time': return 'full_time';
        case 'part_time': return 'part_time';
        case 'contract': return 'contract';
        case 'internship': return 'internship';
        case 'temporary': return 'temporary';
        case 'volunteer': return 'volunteer';
        default: return 'other';
    }
}
function upsertAdzunaJobsToDb(cities, resultsPerCity) {
    return __awaiter(this, void 0, void 0, function () {
        var adzunaJobs, upserted, _i, adzunaJobs_1, job, err_1;
        var _a, _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0: return [4 /*yield*/, (0, adzunaService_1.fetchAdzunaJobs)(cities, resultsPerCity)];
                case 1:
                    adzunaJobs = _g.sent();
                    upserted = 0;
                    _i = 0, adzunaJobs_1 = adzunaJobs;
                    _g.label = 2;
                case 2:
                    if (!(_i < adzunaJobs_1.length)) return [3 /*break*/, 7];
                    job = adzunaJobs_1[_i];
                    _g.label = 3;
                case 3:
                    _g.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, prisma_1.prisma.job.upsert({
                            where: { id: job.id },
                            update: {
                                title: job.title,
                                company: ((_a = job.company) === null || _a === void 0 ? void 0 : _a.display_name) || 'Unknown',
                                description: job.description,
                                location: ((_b = job.location) === null || _b === void 0 ? void 0 : _b.display_name) || '',
                                salary: job.salary_min && job.salary_max ? "".concat(job.salary_min, " - ").concat(job.salary_max) : job.salary_min ? "".concat(job.salary_min) : job.salary_max ? "".concat(job.salary_max) : '',
                                type: mapContractTimeToJobType(job.contract_time),
                                categories: ((_c = job.category) === null || _c === void 0 ? void 0 : _c.label) ? [job.category.label] : [],
                                source: 'adzuna',
                                url: job.redirect_url,
                                postedAt: new Date(job.created),
                            },
                            create: {
                                id: job.id,
                                title: job.title,
                                company: ((_d = job.company) === null || _d === void 0 ? void 0 : _d.display_name) || 'Unknown',
                                description: job.description,
                                location: ((_e = job.location) === null || _e === void 0 ? void 0 : _e.display_name) || '',
                                salary: job.salary_min && job.salary_max ? "".concat(job.salary_min, " - ").concat(job.salary_max) : job.salary_min ? "".concat(job.salary_min) : job.salary_max ? "".concat(job.salary_max) : '',
                                type: mapContractTimeToJobType(job.contract_time),
                                categories: ((_f = job.category) === null || _f === void 0 ? void 0 : _f.label) ? [job.category.label] : [],
                                source: 'adzuna',
                                url: job.redirect_url,
                                postedAt: new Date(job.created),
                            },
                        })];
                case 4:
                    _g.sent();
                    upserted++;
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _g.sent();
                    console.error('Failed to upsert job', job.id, err_1);
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7:
                    console.log("Upserted ".concat(upserted, " Adzuna jobs to DB."));
                    return [2 /*return*/];
            }
        });
    });
}
// If run directly (node src/app/services/adzunaToDb.ts), execute upsert
if (require.main === module) {
    // Import the full city list from adzunaService
    var area209Cities = require('./adzunaService').area209Cities;
    upsertAdzunaJobsToDb(area209Cities, 50).then(function () { return process.exit(0); });
}
