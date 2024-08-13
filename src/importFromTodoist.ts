
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


   

        console.log('about to get allProjects')
        const bodyData = {sync_token: "*", resource_types: '["projects"]'}
        const allProjectsResponse = await getEndPoint('sync', bodyData)
        
        for (const project of allProjectsResponse.projects) { //TODO: include archived projects
            const createdProject = new Project(project.name, null)
            createdProject.task.added = new Date(project.created_at)
            createdProject.sequential = false

            //TODO: consider project notes - need to use /projects/get 'Get project info' if more than 10 notes

            // get project data
            //const projectDataResponse = 


        }



        /* 
        // START BY CREATING PROJECTS
        const projectIdMappings = {}


                    
        // first, create all projects in a flat structure
        const projects = await getEndPoint('projects') // TODO: confirm treatment of ...Object.values(json.completed.projects)
        for (const project of projects) {
            
            createdProject.task.added = new Date(project.created_at)
            projectIdMappings[project.id] = createdProject.task
            createdProject.sequential = false
        } 

        // mark any completed projects complete
        for (const completedProject of json.completed.projects) {
            projectIdMappings[completedProject.id].markComplete(new Date(completedProject.updated_at))
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
            projectIdMappings[note.project_id].note = projectIdMappings[note.project_id].note + `\n\n ${note.posted_at}: ${note.content} ${note.file_attachment ? '[' + note.file_attachment.file_name + '](' + note.file_attachment.file_url + ')' : ''}`
        }

        // CREATE PRIORITY TAGS
        const priorityTagGroup = tagNamed('Priority') || new Tag('Priority', null)
        const priorityTags = {
            1: new Tag("Priority 1", priorityTagGroup),
            2: new Tag("Priority 2", priorityTagGroup),
            3: new Tag("Priority 3", priorityTagGroup),
            4: new Tag("Priority 4", priorityTagGroup)

        }
        const repeatingTag = new Tag('repeating', null)
        
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
            createdTask.sequential = false
            if (task.due) {
                createdTask.dueDate = new Date(task.due.date)
                if (task.due.is_recurring) {
                    createdTask.addTag(repeatingTag)
                    createdTask.appendStringToNote(`REPEATING: ${task.due.string}\n\n`)
                }
                
            }

            if (task.completed_at) createdTask.markComplete(new Date(task.completed_at))
            
            // add tags
            createdTask.removeTags(createdTask.tags) // first remove any existing tags that might have been inherited from the parent

            const tagArray = task.labels.map(label => flattenedTags.byName(label) || new Tag(label, null))
            createdTask.addTags([priorityTags[task.priority], ...tagArray])

            return createdTask
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