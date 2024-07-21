
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
        const tasks = json.items

        function addTask (task) {
            // create task and save ID mapping for later
            const project = projectIdMappings[task.project_id] 
            const createdTask = new Task(task.content, project) // TODO: work out if it is task.content or task.description that is needed (or both)
            taskIdMappings[task.id] = createdTask

            // update task info
            createdTask.added = new Date(task.added_at)
            if (task.due) createdTask.dueDate = new Date(task.due.date)

            // TODO: add recurring info
            
            // TODO: consider whether 'child_order' is required
            // TODO: add estimatedMinutes based on 'duration' (but need to confirm how this data is exported from Todoist)
            
            // add tags
            //const tagArray = task.labels.map(label => flattenedTags.byName(label) || new Tag(label, null))
            // createdTask.addTags([priorityTags[task.priority], ...tagArray]) FIXME: RE-ENABLE TAGS

            return createdTask
        }

        for (const task of tasks) {
            addTask(task)
        }

        // move any nested tasks to the correct place
        for (const task of tasks) {
            if (task.parent_id) {
                const omniTask = taskIdMappings[task.id]
                const parent = taskIdMappings[task.parent_id]
                // moveTasks([omniTask], parent) FIXME: re-enable move
            }
        }

        // mark any completed items as completed
        for (const completedTask of json.completed.items) {
            const newTask = addTask(completedTask.item_object)
            newTask.markComplete(new Date(completedTask.completed_at))

            // TODO: add notes for completed tasks
        }
        // TODO: json.completed - other

        // TODO: confirm whether section_id (and sections) are required



        // TODO: deal with inbox project (at end)

    })

    action.validate = function () {
        return true // always available
    }

    return action
})()
