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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
(function () {
    var credentials = new Credentials();
    var action = new PlugIn.Action(function (selection) {
        return __awaiter(this, void 0, void 0, function () {
            function getEndPoint(endpoint, bodyData, method) {
                return __awaiter(this, void 0, void 0, function () {
                    var url, request, response;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                url = "https://api.todoist.com/sync/v9/" + endpoint;
                                console.log('hitting endpoint: ' + url);
                                request = new URL.FetchRequest();
                                request.method = method;
                                request.headers = {
                                    Accept: "application/json",
                                    "Content-Type": "application/json",
                                    "Authorization": "Bearer " + credentials.read('Todoist').password
                                };
                                if (method !== 'GET')
                                    request.bodyString = JSON.stringify(bodyData);
                                request.url = URL.fromString(url);
                                return [4 /*yield*/, request.fetch()];
                            case 1:
                                response = _a.sent();
                                console.log('response status: ' + response.statusCode);
                                if (response.statusCode !== 200)
                                    console.log(response.bodyString);
                                return [2 /*return*/, JSON.parse(response.bodyString)];
                        }
                    });
                });
            }
            function getArchiveItems(endpoint, offset) {
                if (offset === void 0) { offset = 0; }
                return __awaiter(this, void 0, void 0, function () {
                    var bodyData, page, remainder;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                bodyData = { limit: ARCH_MAX_PAGE_SIZE, offset: offset };
                                return [4 /*yield*/, getEndPoint(endpoint, bodyData, 'GET')];
                            case 1:
                                page = _a.sent();
                                if (!page.has_more) return [3 /*break*/, 3];
                                return [4 /*yield*/, getArchiveItems(endpoint, offset + COMPL_MAX_PAGE_SIZE)];
                            case 2:
                                remainder = _a.sent();
                                return [2 /*return*/, {
                                        items: page.items.concat(remainder.items),
                                        completed_info: Object.assign({}, page.completed_info, remainder.completed_info)
                                    }];
                            case 3: return [2 /*return*/, page];
                        }
                    });
                });
            }
            function fetchCompleted(offset) {
                if (offset === void 0) { offset = 0; }
                return __awaiter(this, void 0, void 0, function () {
                    var completedRequestBody, page, remainder;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                completedRequestBody = { limit: COMPL_MAX_PAGE_SIZE, offset: offset, annotate_notes: "true", annotate_items: "true" };
                                return [4 /*yield*/, getEndPoint('completed/get_all', completedRequestBody, 'POST')];
                            case 1:
                                page = _a.sent();
                                if (!(page.items.length > 0)) return [3 /*break*/, 3];
                                return [4 /*yield*/, fetchCompleted(offset + COMPL_MAX_PAGE_SIZE)];
                            case 2:
                                remainder = _a.sent();
                                return [2 /*return*/, {
                                        items: page.items.concat(remainder.items),
                                        projects: Object.assign({}, page.projects, remainder.projects),
                                        sections: Object.assign({}, page.sections, remainder.sections)
                                    }];
                            case 3: return [2 /*return*/, page];
                        }
                    });
                });
            }
            function getArchived(offset) {
                if (offset === void 0) { offset = 0; }
                return __awaiter(this, void 0, void 0, function () {
                    var requestBody, page, remainder;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                requestBody = { limit: ARCH_PROJ_PAGE_SIZE, offset: offset };
                                return [4 /*yield*/, getEndPoint('projects/get_archived', requestBody, 'POST')];
                            case 1:
                                page = _a.sent();
                                if (!(page.length > 0)) return [3 /*break*/, 3];
                                return [4 /*yield*/, getArchived(offset + ARCH_PROJ_PAGE_SIZE)];
                            case 2:
                                remainder = _a.sent();
                                return [2 /*return*/, __spreadArray(__spreadArray([], page, true), remainder, true)];
                            case 3: return [2 /*return*/, page];
                        }
                    });
                });
            }
            var credentialsExist, form_1, form, importActive, importArchived, ARCH_MAX_PAGE_SIZE, priorityTagGroup, priorityTags, repeatingTag, bodyData, requestResponse, COMPL_MAX_PAGE_SIZE, completedRequest, completedNotesByItemId, projectIdMappings, processProjects, projectSelectionForm, ARCH_PROJ_PAGE_SIZE, archivedProjectsData, archiveFolder, projectSelectionForm, inboxProject;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        credentialsExist = credentials.read('Todoist');
                        if (!(!credentialsExist || app.optionKeyDown)) return [3 /*break*/, 2];
                        form_1 = new Form();
                        form_1.addField(new Form.Field.String('apiToken', 'API Token', null, null), null);
                        return [4 /*yield*/, form_1.show('Enter Todoist API Token', 'Continue')];
                    case 1:
                        _a.sent();
                        credentials.write('Todoist', 'Todoist User', form_1.values.apiToken);
                        _a.label = 2;
                    case 2:
                        form = new Form();
                        form.addField(new Form.Field.Checkbox("importActive", "Import Active Projects", true), null);
                        form.addField(new Form.Field.Checkbox('importArchived', "Import Archived Projects", true), null);
                        return [4 /*yield*/, form.show("Select Items To Import", "Import")];
                    case 3:
                        _a.sent();
                        importActive = form.values.importActive;
                        importArchived = form.values.importArchived;
                        ARCH_MAX_PAGE_SIZE = 100;
                        priorityTagGroup = tagNamed('Priority') || new Tag('Priority', null);
                        priorityTags = {
                            1: new Tag("Priority 1", priorityTagGroup),
                            2: new Tag("Priority 2", priorityTagGroup),
                            3: new Tag("Priority 3", priorityTagGroup),
                            4: new Tag("Priority 4", priorityTagGroup)
                        };
                        repeatingTag = tagNamed('repeating') || new Tag('repeating', null);
                        bodyData = { sync_token: "*", resource_types: '["projects", "completed_info", "notes"]' };
                        return [4 /*yield*/, getEndPoint('sync', bodyData, 'POST')];
                    case 4:
                        requestResponse = _a.sent();
                        COMPL_MAX_PAGE_SIZE = 200;
                        return [4 /*yield*/, fetchCompleted()];
                    case 5:
                        completedRequest = _a.sent();
                        completedNotesByItemId = completedRequest.items.reduce(function (acc, item) {
                            if (item.notes.length > 0) {
                                acc[item.task_id] = item.notes;
                            }
                            return acc;
                        }, {});
                        projectIdMappings = {};
                        processProjects = function (projects, location) { return __awaiter(_this, void 0, void 0, function () {
                            var _loop_1, _i, projects_1, project;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _loop_1 = function (project) {
                                            // create tasks/items    
                                            function addTask(item) {
                                                var taskName = item.description ? item.content + "\n " + item.description : item.content;
                                                var location = item.parent_id ? taskIdMappings[item.parent_id] : item.section_id ? sectionIdMappings[item.section_id] : createdProject;
                                                var createdTask = new Task(taskName, location);
                                                taskIdMappings[item.id] = createdTask;
                                                // update task info
                                                createdTask.added = new Date(item.added_at);
                                                createdTask.sequential = false;
                                                if (item.due) {
                                                    createdTask.dueDate = new Date(item.due.date);
                                                    if (item.due.is_recurring) {
                                                        createdTask.addTag(repeatingTag);
                                                        createdTask.appendStringToNote("REPEATING: " + item.due.string + "\n\n");
                                                    }
                                                }
                                                // add tags
                                                createdTask.removeTags(createdTask.tags); // first remove any existing tags that might have been inherited from the parent
                                                var tagArray = item.labels.map(function (label) { return flattenedTags.byName(label) || new Tag(label, null); });
                                                createdTask.addTags(__spreadArray([priorityTags[item.priority]], tagArray, true));
                                                // add notes for task 
                                                var notesFromIncompleteTasks = requestResponse.notes.filter(function (note) { return note.item_id === item.id; });
                                                var notesFromCompleteTasks = completedNotesByItemId[item.id] || [];
                                                var notes = __spreadArray(__spreadArray([], notesFromIncompleteTasks, true), notesFromCompleteTasks, true);
                                                for (var _i = 0, notes_1 = notes; _i < notes_1.length; _i++) {
                                                    var note = notes_1[_i];
                                                    createdTask.note = createdTask.note + ("\n\n " + note.posted_at + ": " + note.content + " " + (note.file_attachment ? '[' + note.file_attachment.file_name + '](' + note.file_attachment.file_url + ')' : ''));
                                                }
                                                return createdTask;
                                            }
                                            // deal with completed items
                                            function processItemsAndMarkComplete(completedInfoObject) {
                                                return __awaiter(this, void 0, void 0, function () {
                                                    var createdItems, _i, _a, item, newTask, _b, _c, completedInfoId, newCompletedInfoObject, _d, createdItems_1, item, task, date;
                                                    return __generator(this, function (_e) {
                                                        switch (_e.label) {
                                                            case 0:
                                                                createdItems = [];
                                                                for (_i = 0, _a = completedInfoObject.items; _i < _a.length; _i++) {
                                                                    item = _a[_i];
                                                                    newTask = addTask(item);
                                                                    createdItems.push({ task: newTask, completedDate: new Date(item.completed_at) });
                                                                }
                                                                _b = 0, _c = completedInfoObject.completed_info;
                                                                _e.label = 1;
                                                            case 1:
                                                                if (!(_b < _c.length)) return [3 /*break*/, 5];
                                                                completedInfoId = _c[_b];
                                                                if (!('item_id' in completedInfoId)) return [3 /*break*/, 4];
                                                                return [4 /*yield*/, getArchiveItems("archive/items?parent_id=" + completedInfoId.item_id)];
                                                            case 2:
                                                                newCompletedInfoObject = _e.sent();
                                                                return [4 /*yield*/, processItemsAndMarkComplete(newCompletedInfoObject)];
                                                            case 3:
                                                                _e.sent();
                                                                _e.label = 4;
                                                            case 4:
                                                                _b++;
                                                                return [3 /*break*/, 1];
                                                            case 5:
                                                                // mark complete at end, so that tasks aren't 'uncompleted' when child tasks are added
                                                                for (_d = 0, createdItems_1 = createdItems; _d < createdItems_1.length; _d++) {
                                                                    item = createdItems_1[_d];
                                                                    task = item.task, date = item.date;
                                                                    task.markComplete(date);
                                                                }
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                });
                                            }
                                            var taskIdMappings, createdProject, requestData, projectDataResponse, _b, _c, note, sectionIdMappings, _d, _e, section, createdSection, completedItemsData, completedTasks, remainingTasks, _loop_2, state_1, _f, completedTasks_1, task;
                                            return __generator(this, function (_g) {
                                                switch (_g.label) {
                                                    case 0:
                                                        console.log("processing project: " + project.name);
                                                        taskIdMappings = {};
                                                        createdProject = new Project(project.name, location);
                                                        if (project.created_at)
                                                            createdProject.task.added = new Date(project.created_at);
                                                        createdProject.sequential = false;
                                                        projectIdMappings[project.id] = createdProject;
                                                        requestData = { project_id: project.id };
                                                        return [4 /*yield*/, getEndPoint('projects/get_data', requestData, 'POST')
                                                            // add project notes
                                                        ];
                                                    case 1:
                                                        projectDataResponse = _g.sent();
                                                        // add project notes
                                                        for (_b = 0, _c = projectDataResponse.project_notes; _b < _c.length; _b++) {
                                                            note = _c[_b];
                                                            projectIdMappings[note.project_id].note = projectIdMappings[note.project_id].note + ("\n\n " + note.posted_at + ": " + note.content + " " + (note.file_attachment ? '[' + note.file_attachment.file_name + '](' + note.file_attachment.file_url + ')' : ''));
                                                        }
                                                        sectionIdMappings = {};
                                                        _d = 0, _e = projectDataResponse.sections;
                                                        _g.label = 2;
                                                    case 2:
                                                        if (!(_d < _e.length)) return [3 /*break*/, 6];
                                                        section = _e[_d];
                                                        createdSection = new Task(section.name, createdProject);
                                                        createdSection.added = new Date(section.added_at);
                                                        sectionIdMappings[section.id] = createdSection;
                                                        createdSection.sequential = false;
                                                        if (!section.is_archived) return [3 /*break*/, 5];
                                                        return [4 /*yield*/, getArchiveItems("archive/items?section_id=" + section.id)];
                                                    case 3:
                                                        completedItemsData = _g.sent();
                                                        return [4 /*yield*/, processItemsAndMarkComplete(completedItemsData)];
                                                    case 4:
                                                        _g.sent();
                                                        _g.label = 5;
                                                    case 5:
                                                        _d++;
                                                        return [3 /*break*/, 2];
                                                    case 6:
                                                        completedTasks = completedRequest.items.filter(function (item) { return item.project_id === project.id; }).map(function (item) { return item.item_object; });
                                                        remainingTasks = __spreadArray(__spreadArray([], projectDataResponse.items, true), completedTasks, true);
                                                        _loop_2 = function () {
                                                            var tasksToRemove = [];
                                                            for (var i = 0; i < remainingTasks.length; i++) {
                                                                var task = remainingTasks[i];
                                                                if (!task.parent_id || task.parent_id in taskIdMappings) {
                                                                    addTask(task); // add task
                                                                    tasksToRemove.push(i);
                                                                }
                                                            }
                                                            // fallback to stop us getting stuck in infinite loop - add any remaining tasks to root of project
                                                            if (tasksToRemove.length === 0) {
                                                                for (var _h = 0, remainingTasks_1 = remainingTasks; _h < remainingTasks_1.length; _h++) {
                                                                    var task = remainingTasks_1[_h];
                                                                    addTask(task);
                                                                }
                                                                return "break";
                                                            }
                                                            // Filter out tasks that have been added
                                                            remainingTasks = remainingTasks.filter(function (_, index) { return !tasksToRemove.includes(index); });
                                                        };
                                                        while (remainingTasks.length > 0) {
                                                            state_1 = _loop_2();
                                                            if (state_1 === "break")
                                                                break;
                                                        }
                                                        // mark completed tasks complete
                                                        for (_f = 0, completedTasks_1 = completedTasks; _f < completedTasks_1.length; _f++) {
                                                            task = completedTasks_1[_f];
                                                            taskIdMappings[task.id].markComplete(new Date(task.completed_at));
                                                        }
                                                        return [2 /*return*/];
                                                }
                                            });
                                        };
                                        _i = 0, projects_1 = projects;
                                        _a.label = 1;
                                    case 1:
                                        if (!(_i < projects_1.length)) return [3 /*break*/, 4];
                                        project = projects_1[_i];
                                        return [5 /*yield**/, _loop_1(project)];
                                    case 2:
                                        _a.sent();
                                        _a.label = 3;
                                    case 3:
                                        _i++;
                                        return [3 /*break*/, 1];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); };
                        if (!importActive) return [3 /*break*/, 8];
                        projectSelectionForm = new Form();
                        projectSelectionForm.addField(new Form.Field.MultipleOptions('activeProjects', 'Active Projects', requestResponse.projects, requestResponse.projects.map(function (p) { return p.name; }), requestResponse.projects), null);
                        return [4 /*yield*/, projectSelectionForm.show('Select Active Projects', 'OK')];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, processProjects(projectSelectionForm.values.activeProjects, null)];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8:
                        ARCH_PROJ_PAGE_SIZE = 500;
                        if (!importArchived) return [3 /*break*/, 12];
                        return [4 /*yield*/, getArchived()];
                    case 9:
                        archivedProjectsData = _a.sent();
                        archiveFolder = folderNamed('Archive') || new Folder('Archive', null);
                        projectSelectionForm = new Form();
                        projectSelectionForm.addField(new Form.Field.MultipleOptions('archivedProjects', 'Archived Projects', archivedProjectsData, archivedProjectsData.map(function (p) { return p.name; }), archivedProjectsData), null);
                        return [4 /*yield*/, projectSelectionForm.show('Select Active Projects', 'OK')];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, processProjects(projectSelectionForm.values.archivedProjects, archiveFolder)];
                    case 11:
                        _a.sent();
                        _a.label = 12;
                    case 12:
                        inboxProject = projectNamed("Inbox");
                        if (inboxProject !== null) {
                            moveTasks(inboxProject.tasks, inbox.ending);
                            deleteObject(inboxProject);
                        }
                        return [2 /*return*/];
                }
            });
        });
    });
    action.validate = function () {
        return true; // always available
    };
    return action;
})();
// IMPROVEMENT: add estimatedMinutes based on 'duration' (but need to confirm how this data is exported from Todoist)
