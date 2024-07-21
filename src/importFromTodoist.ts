
(() => {
    const action = new PlugIn.Action(async function (selection: Selection) {

        const picker = new FilePicker()

        const url = await picker.show()

        const file = FileWrapper.fromURL(url[0], null)

        const contents = file.contents.toString()

        const json = JSON.parse(contents)


        // START BY CREATING PROJECTS
        const projectIdMappings = {}

        // first, create all projects in a flat structure
        const projects = json.projects
        for (const project of projects) {
            const createdProject = new Project(project.name, null)
            createdProject.task.added = new Date(project.created_at)
            projectIdMappings[project.id] = createdProject.task
        } 

        // move any nested projects to the correct place
        for (const project of projects) {
            if (project.parent_id) {
                const omniProject = projectIdMappings[project.id]
                const parent = projectIdMappings[project.parent_id]
                moveTasks([omniProject], parent)
            }
        }

        // add project notes
        for (const note of json.project_notes) {
            projectIdMappings[note.project_id].appendStringToNote(`${note.posted_at}: ${note.content}`)
            if (note.file_attachment) {
                ""
                // TODO: deal with file attachment in projects
            }
        }

        // CREATE PRIORITY TAGS
        const priorityTagGroup = new Tag('Priority', null)
        const priorityTags = {
            1: new Tag("Priority 1", priorityTagGroup),
            2: new Tag("Priority 2", priorityTagGroup),
            3: new Tag("Priority 3", priorityTagGroup),
            4: new Tag("Priority 4", priorityTagGroup)

        }
        
        // CONTINUE BY CREATING TASKS
        const taskIdMappings = {}

        // first, create all projects in a flat structure
        let tasks = [...json.items, ...json.completed.items.map(task => task.item_object)]

        function addTask (task, location) {
            // create task and save ID mapping for later
            const taskName = task.description ? `${task.content}\n ${task.description}` : task.content
            const createdTask = new Task(taskName, location || projectIdMappings[task.project_id] )
            taskIdMappings[task.id] = createdTask

            // update task info
            createdTask.added = new Date(task.added_at)
            if (task.due) createdTask.dueDate = new Date(task.due.date) 

            if (task.completed_at) createdTask.markComplete(new Date(task.completed_at))

            // TODO: add recurring info
            
            // TODO: consider whether 'child_order' is required
            // TODO: add estimatedMinutes based on 'duration' (but need to confirm how this data is exported from Todoist)
            
            // add tags
            if (task.labels.length > 0) {
                const tagArray = task.labels.map(label => flattenedTags.byName(label) || new Tag(label, null))
                createdTask.addTags(tagArray)
            }

            return createdTask
        }

        /*
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
        } */

        
        // APPROACH 2: create all then move

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
        

       
        // TODO: add notes for completed tasks
        // TODO: add notes
        // TODO: json.completed - other
        

        // TODO: confirm whether section_id (and sections) are required



        // deal with inbox project (at end)
        const inboxProject = projectNamed("Inbox")
        moveTasks(inboxProject.tasks, inbox.ending)
        deleteObject(inboxProject)

    })

    action.validate = function () {
        return true // always available
    }

    return action
})()
