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
    var action = new PlugIn.Action(function (selection) {
        return __awaiter(this, void 0, void 0, function () {
            function addTask(task, location) {
                // create task and save ID mapping for later
                var taskName = task.description ? task.content + "\n " + task.description : task.content;
                var createdTask = new Task(taskName, location || projectIdMappings[task.project_id]);
                taskIdMappings[task.id] = createdTask;
                // update task info
                createdTask.added = new Date(task.added_at);
                createdTask.sequential = false;
                if (task.due) {
                    createdTask.dueDate = new Date(task.due.date);
                    if (task.due.is_recurring) {
                        createdTask.addTag(repeatingTag);
                        createdTask.appendStringToNote("REPEATING: " + task.due.string + "\n\n");
                    }
                }
                if (task.completed_at)
                    createdTask.markComplete(new Date(task.completed_at));
                // TODO: add estimatedMinutes based on 'duration' (but need to confirm how this data is exported from Todoist)
                // add tags
                if (task.labels.length > 0) {
                    var tagArray = task.labels.map(function (label) { return flattenedTags.byName(label) || new Tag(label, null); });
                    createdTask.addTags(tagArray);
                }
                return createdTask;
            }
            var picker, url, file, contents, json, projectIdMappings, projects, _i, projects_1, project, createdProject, _a, projects_2, project, omniProject, parent, _b, _c, note, priorityTagGroup, priorityTags, repeatingTag, taskIdMappings, tasks, _loop_1, _d, _e, note, inboxProject;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        picker = new FilePicker();
                        return [4 /*yield*/, picker.show()];
                    case 1:
                        url = _f.sent();
                        file = FileWrapper.fromURL(url[0], null);
                        contents = file.contents.toString();
                        json = JSON.parse(contents);
                        projectIdMappings = {};
                        projects = json.projects // TODO: confirm treatment of ...Object.values(json.completed.projects)
                        ;
                        for (_i = 0, projects_1 = projects; _i < projects_1.length; _i++) {
                            project = projects_1[_i];
                            createdProject = new Project(project.name, null);
                            createdProject.task.added = new Date(project.created_at);
                            projectIdMappings[project.id] = createdProject.task;
                            createdProject.sequential = false;
                            //if (json.completed.projects.some((p) => p.id === project.id)) createdProject.markComplete(new Date(json.completed.projects[project.id].updated_at))
                        }
                        // move any nested projects to the correct place
                        for (_a = 0, projects_2 = projects; _a < projects_2.length; _a++) {
                            project = projects_2[_a];
                            if (project.parent_id) {
                                omniProject = projectIdMappings[project.id];
                                parent = projectIdMappings[project.parent_id];
                                moveTasks([omniProject], parent);
                            }
                        }
                        // add project notes
                        for (_b = 0, _c = json.project_notes; _b < _c.length; _b++) {
                            note = _c[_b];
                            projectIdMappings[note.project_id].note = projectIdMappings[note.project_id].note + ("\n\n " + note.posted_at + ": " + note.content + " " + (note.file_attachment ? '[' + note.file_attachment.file_name + '](' + note.file_attachment.file_url + ')' : ''));
                        }
                        priorityTagGroup = new Tag('Priority', null);
                        priorityTags = {
                            1: new Tag("Priority 1", priorityTagGroup),
                            2: new Tag("Priority 2", priorityTagGroup),
                            3: new Tag("Priority 3", priorityTagGroup),
                            4: new Tag("Priority 4", priorityTagGroup)
                        };
                        repeatingTag = new Tag('repeating', null);
                        taskIdMappings = {};
                        tasks = __spreadArray(__spreadArray([], json.items, true), json.completed.items.map(function (task) { return task.item_object; }), true);
                        _loop_1 = function () {
                            var tasksToRemove = [];
                            for (var i = 0; i < tasks.length; i++) {
                                var task = tasks[i];
                                if (!task.parent_id || task.parent_id in taskIdMappings) {
                                    addTask(task, taskIdMappings[task.parent_id]); // add task
                                    tasksToRemove.push(i);
                                }
                            }
                            // Filter out tasks that have been added
                            tasks = tasks.filter(function (_, index) { return !tasksToRemove.includes(index); });
                        };
                        // APPROACH 1: only add once parent exists, loop through
                        while (tasks.length > 0) {
                            _loop_1();
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
                            */
                        // add notes to tasks
                        for (_d = 0, _e = json.notes; _d < _e.length; _d++) {
                            note = _e[_d];
                            taskIdMappings[note.item_id].note = taskIdMappings[note.item_id].note + ("\n\n " + note.posted_at + ": " + note.content + " " + (note.file_attachment ? '[' + note.file_attachment.file_name + '](' + note.file_attachment.file_url + ')' : ''));
                        }
                        inboxProject = projectNamed("Inbox");
                        moveTasks(inboxProject.tasks, inbox.ending);
                        deleteObject(inboxProject);
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
