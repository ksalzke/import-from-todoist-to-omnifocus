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
                                console.log('hitting ' + url);
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
                                console.log(JSON.stringify(response));
                                return [2 /*return*/, JSON.parse(response.bodyString)];
                        }
                    });
                });
            }
            var credentialsExist, form, priorityTagGroup, priorityTags, repeatingTag, bodyData, requestResponse, projectsContainingCompletedTasks, sectionsContainingCompletedTasks, itemsContainingCompletedTasks, projectIdMappings, processProjects, archivedProjectsData, archiveFolder;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        credentialsExist = credentials.read('Todoist');
                        if (!!credentialsExist) return [3 /*break*/, 2];
                        form = new Form();
                        form.addField(new Form.Field.String('apiToken', 'API Token', null, null), null);
                        return [4 /*yield*/, form.show('Enter Todoist API Token', 'Continue')];
                    case 1:
                        _a.sent();
                        credentials.write('Todoist', 'Todoist User', form.values.apiToken);
                        _a.label = 2;
                    case 2:
                        priorityTagGroup = tagNamed('Priority') || new Tag('Priority', null);
                        priorityTags = {
                            1: new Tag("Priority 1", priorityTagGroup),
                            2: new Tag("Priority 2", priorityTagGroup),
                            3: new Tag("Priority 3", priorityTagGroup),
                            4: new Tag("Priority 4", priorityTagGroup)
                        };
                        repeatingTag = tagNamed('repeating') || new Tag('repeating', null);
                        bodyData = { sync_token: "*", resource_types: '["projects", "completed_info"]' };
                        return [4 /*yield*/, getEndPoint('sync', bodyData, 'POST')];
                    case 3:
                        requestResponse = _a.sent();
                        console.log(JSON.stringify(requestResponse));
                        console.log(requestResponse.completed_info.filter(function (item) { return 'project_id' in item; }));
                        projectsContainingCompletedTasks = requestResponse.completed_info.filter(function (item) { return 'project_id' in item; }).map(function (item) { return item.project_id; });
                        sectionsContainingCompletedTasks = requestResponse.completed_info.filter(function (item) { return 'section_id' in item; }).map(function (item) { return item.section_id; });
                        itemsContainingCompletedTasks = requestResponse.completed_info.filter(function (item) { return 'item_id' in item; }).map(function (item) { return item.item_id; });
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
                                                // if (task.completed_at) createdTask.markComplete(new Date(task.completed_at)) // TODO: completed tasks
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
                                                                    newTask.markComplete(new Date(item.completed_at));
                                                                }
                                                                _b = 0, _c = completedInfoObject.completed_info;
                                                                _e.label = 1;
                                                            case 1:
                                                                if (!(_b < _c.length)) return [3 /*break*/, 5];
                                                                completedInfoId = _c[_b];
                                                                if (!('item_id' in completedInfoId)) return [3 /*break*/, 4];
                                                                return [4 /*yield*/, getEndPoint("archive/items?parent_id=" + completedInfoId.item_id, null, 'GET')];
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
                                            var taskIdMappings, createdProject, requestData, projectDataResponse, sectionIdMappings, _b, _c, section, createdSection, completedItemsData, remainingTasks, _loop_2, state_1, completedItemsData;
                                            return __generator(this, function (_d) {
                                                switch (_d.label) {
                                                    case 0:
                                                        taskIdMappings = {};
                                                        createdProject = new Project(project.name, location);
                                                        if (project.created_at)
                                                            createdProject.task.added = new Date(project.created_at); //TODO: note that this is not included
                                                        createdProject.sequential = false;
                                                        projectIdMappings[project.id] = createdProject;
                                                        requestData = { project_id: project.id };
                                                        return [4 /*yield*/, getEndPoint('projects/get_data', requestData, 'POST')
                                                            // create sections
                                                        ];
                                                    case 1:
                                                        projectDataResponse = _d.sent();
                                                        sectionIdMappings = {};
                                                        _b = 0, _c = projectDataResponse.sections;
                                                        _d.label = 2;
                                                    case 2:
                                                        if (!(_b < _c.length)) return [3 /*break*/, 6];
                                                        section = _c[_b];
                                                        createdSection = new Task(section.name, createdProject);
                                                        createdSection.added = new Date(section.added_at);
                                                        sectionIdMappings[section.id] = createdSection;
                                                        createdSection.sequential = false;
                                                        if (!section.is_archived) return [3 /*break*/, 5];
                                                        return [4 /*yield*/, getEndPoint("archive/items?section_id=" + section.id, null, 'GET')];
                                                    case 3:
                                                        completedItemsData = _d.sent();
                                                        console.log(JSON.stringify(completedItemsData));
                                                        return [4 /*yield*/, processItemsAndMarkComplete(completedItemsData)];
                                                    case 4:
                                                        _d.sent();
                                                        _d.label = 5;
                                                    case 5:
                                                        _b++;
                                                        return [3 /*break*/, 2];
                                                    case 6:
                                                        remainingTasks = projectDataResponse.items;
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
                                                                for (var _e = 0, remainingTasks_1 = remainingTasks; _e < remainingTasks_1.length; _e++) {
                                                                    var task = remainingTasks_1[_e];
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
                                                        if (!(projectsContainingCompletedTasks.includes(project.id) || project.is_archived)) return [3 /*break*/, 9];
                                                        return [4 /*yield*/, getEndPoint("archive/items?project_id=" + project.id, null, 'GET')];
                                                    case 7:
                                                        completedItemsData = _d.sent();
                                                        return [4 /*yield*/, processItemsAndMarkComplete(completedItemsData)];
                                                    case 8:
                                                        _d.sent();
                                                        _d.label = 9;
                                                    case 9: return [2 /*return*/];
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
                        return [4 /*yield*/, processProjects(requestResponse.projects, null)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, getEndPoint('projects/get_archived', null, 'GET')]; //TODO: deal with more than 500
                    case 5:
                        archivedProjectsData = _a.sent() //TODO: deal with more than 500
                        ;
                        archiveFolder = new Folder('Archive', null);
                        return [4 /*yield*/, processProjects(archivedProjectsData, archiveFolder)
                            // FIXME: test re completed archived tasks
                            /*  const completedItemsData = await getEndPoint(`archive/items?project_id=2337615654`, null, 'GET')
                                 console.log('test for archive: ' + JSON.stringify(completedItemsData)) */
                            /*
                            // now consider completed tasks
                            for (const completedContainer of requestResponse.completed_info) {
                                console.log(JSON.stringify(completedContainer))
                    
                                // FIXME: currently assumes project but could return section or item
                                const completedItemsData = await getEndPoint(`archive/items?project_id=${completedContainer.project_id}`, null, 'GET')
                                console.log(JSON.stringify(completedItemsData))
                                for (const item of completedItemsData.items) {
                                    // TODO: add details
                                    const newTask = new Task(item.content, projectIdMappings[item.project_id])
                                    newTask.markComplete(null) //FIXME: add date
                                }
                    
                            }
                                */
                            /*
                    
                    
                            // mark any completed projects complete
                            for (const completedProject of json.completed.projects) {
                                projectIdMappings[completedProject.id].markComplete(new Date(completedProject.updated_at))
                            }
                    
                            // add project notes
                            for (const note of json.project_notes) {
                                projectIdMappings[note.project_id].note = projectIdMappings[note.project_id].note + `\n\n ${note.posted_at}: ${note.content} ${note.file_attachment ? '[' + note.file_attachment.file_name + '](' + note.file_attachment.file_url + ')' : ''}`
                            }
                    
                        
                            
                            // APPROACH 1: only add once parent exists, loop through
                    
                            while (tasks.length > 0) {
                                const tasksToRemove: number[] = [];
                            
                                for (let i = 0; i < tasks.length; i++) {
                                    const task = tasks[i];
                                    if (!task.parent_id || task.parent_id in taskIdMappings) {
                                        addTask(task, taskIdMappings[task.parent_id]); // add task
                                        tasksToRemove.push(i);
                                    }
                                }
                            
                                // Filter out tasks that have been added
                                tasks = tasks.filter((_, index) => !tasksToRemove.includes(index));
                            }
                    
                            
                            // APPROACH 2: create all then move
                            /*
                            for (const task of tasks) {
                                addTask(task, null)
                            }
                    
                            // move any nested tasks to the correct place
                            for (const task of tasks) {
                                if (task.parent_id) {
                                    const omniTask = taskIdMappings[task.id]
                                    const parent = taskIdMappings[task.parent_id]
                                    moveTasks([omniTask], parent)
                                }
                            }
                            ------------
                    
                            // add notes to tasks
                            const completedNotes = json.completed.items.flatMap(item => item.notes)
                            for (const note of [...json.notes, ...completedNotes]) {
                                taskIdMappings[note.item_id].note = taskIdMappings[note.item_id].note + `\n\n ${note.posted_at}: ${note.content} ${note.file_attachment ? '[' + note.file_attachment.file_name + '](' + note.file_attachment.file_url + ')' : ''}`
                            }
                            
                            // deal with inbox project (at end)
                            const inboxProject = projectNamed("Inbox")
                            moveTasks(inboxProject.tasks, inbox.ending)
                            deleteObject(inboxProject)
                    
                            */
                        ];
                    case 6:
                        _a.sent();
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
// IMPROVEMENT: use directly with Todoist API rather than export
// IMPROVEMENT: add support for sections
// IMPROVEMENT: add estimatedMinutes based on 'duration' (but need to confirm how this data is exported from Todoist)
