
(() => {
    const credentials = new Credentials()
    const action = new PlugIn.Action(async function (selection: Selection) {

        const credentialsExist = credentials.read('Todoist')

        if (!credentialsExist) {

            const form = new Form()
            form.addField(new Form.Field.String('apiToken', 'API Token',null, null), null)
            await form.show('Enter Todoist API Token', 'Continue')
            
            credentials.write('Todoist', 'Todoist User', form.values.apiToken)
        }

        async function getEndPoint(endpoint: string, bodyData) {
            const url = `https://api.todoist.com/sync/v9/${endpoint}`

            const request = new URL.FetchRequest()
            request.method = 'POST'
            request.headers = {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${credentials.read('Todoist').password}`
                }
            request.bodyString = JSON.stringify(bodyData)
            request.url = URL.fromString(url)

            const response = await request.fetch()
            
            return JSON.parse(response.bodyString)
        }


        // CREATE TAGS
        const priorityTagGroup = tagNamed('Priority') || new Tag('Priority', null)
        const priorityTags = {
            1: new Tag("Priority 1", priorityTagGroup),
            2: new Tag("Priority 2", priorityTagGroup),
            3: new Tag("Priority 3", priorityTagGroup),
            4: new Tag("Priority 4", priorityTagGroup)

        }
        const repeatingTag = tagNamed('repeating') || new Tag('repeating', null)
   
        const bodyData = {sync_token: "*", resource_types: '["projects", "completed_info"]'}
        const requestResponse = await getEndPoint('sync', bodyData)
        
        console.log(JSON.stringify(requestResponse))
        
        for (const project of requestResponse.projects) { //TODO: include archived projects

            // get and create projects
            const createdProject = new Project(project.name, null)
            createdProject.task.added = new Date(project.created_at)
            createdProject.sequential = false

            //TODO: consider project notes - need to use /projects/get 'Get project info' if more than 10 notes

            // get sections and items
            const requestData = {project_id: project.id}
            const projectDataResponse = await getEndPoint('projects/get_data', requestData)

            // create sections
            let sectionIdMappings = {}
            for (const section of projectDataResponse.sections) {
                const createdSection = new Task(section.name, createdProject)
                createdSection.added = new Date(section.added_at)
                sectionIdMappings[section.id] = createdSection
                createdSection.sequential = false
            }

            // create tasks/items
            let taskIdMappings = {}

            const addTask = (item) => {
                const taskName = item.description ? `${item.content}\n ${item.description}` : item.content
                const location = item.parent_id ? taskIdMappings[item.parent_id] : item.section_id ? sectionIdMappings[item.section_id] : createdProject
                const createdTask = new Task(taskName, location)
                taskIdMappings[item.id] = createdTask

                // update task info
                createdTask.added = new Date(item.added_at)
                createdTask.sequential = false
                if (item.due) {
                    createdTask.dueDate = new Date(item.due.date)
                    if (item.due.is_recurring) {
                        createdTask.addTag(repeatingTag)
                        createdTask.appendStringToNote(`REPEATING: ${item.due.string}\n\n`)
                    }
                }

                // add tags
                createdTask.removeTags(createdTask.tags) // first remove any existing tags that might have been inherited from the parent
                const tagArray = item.labels.map(label => flattenedTags.byName(label) || new Tag(label, null))
                createdTask.addTags([priorityTags[item.priority], ...tagArray])

                // if (task.completed_at) createdTask.markComplete(new Date(task.completed_at)) // TODO: completed tasks
            }

            let remainingTasks = projectDataResponse.items
            while (remainingTasks.length > 0) {
                const tasksToRemove: number[] = [];
            
                for (let i = 0; i < remainingTasks.length; i++) {
                    const task = remainingTasks[i];
                    if (!task.parent_id || task.parent_id in taskIdMappings) {
                        addTask(task); // add task
                        tasksToRemove.push(i);
                    }
                }
            
                // fallback to stop us getting stuck in infinite loop - add any remaining tasks to root of project
                if (tasksToRemove.length === 0) {
                    for (const task of remainingTasks) addTask(task)
                    break
                }
                // Filter out tasks that have been added
                remainingTasks = remainingTasks.filter((_, index) => !tasksToRemove.includes(index));
            } 
        }

        // now consider completed tasks
        for (const completedContainer of requestResponse.completed_info) {
            console.log(JSON.stringify(completedContainer))

            // FIXME: currently assumes project but could return section or item
            const completedItems = await getEndPoint('archive/items', {project_id: completedContainer.project_id})
            console.log(JSON.stringify(completedItems))
            /* for (const item of completedItems) {
                // TODO: add details
                const newTask = new Task(new Task())
            } */

        }

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

    })

    action.validate = function () {
        return true // always available
    }

    return action
})()

// IMPROVEMENT: use directly with Todoist API rather than export
// IMPROVEMENT: add support for sections
// IMPROVEMENT: add estimatedMinutes based on 'duration' (but need to confirm how this data is exported from Todoist)