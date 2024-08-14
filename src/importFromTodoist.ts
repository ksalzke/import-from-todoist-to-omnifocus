
(() => {
    const credentials = new Credentials()
    const action = new PlugIn.Action(async function (selection: Selection) {

        // PROMPT FOR API IF NOT ALREADY STORED
        const credentialsExist = credentials.read('Todoist')

        if (!credentialsExist) {

            const form = new Form()
            form.addField(new Form.Field.String('apiToken', 'API Token',null, null), null)
            await form.show('Enter Todoist API Token', 'Continue')
            
            credentials.write('Todoist', 'Todoist User', form.values.apiToken)
        }

        async function getEndPoint(endpoint: string, bodyData, method: string) {
            const url = `https://api.todoist.com/sync/v9/${endpoint}`
            console.log('hitting ' + url)

            const request = new URL.FetchRequest()
            request.method = method
            request.headers = {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${credentials.read('Todoist').password}`
                }
            if (method !== 'GET') request.bodyString = JSON.stringify(bodyData)
            request.url = URL.fromString(url)

            const response = await request.fetch()
            console.log(JSON.stringify(response))
            
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
        const requestResponse = await getEndPoint('sync', bodyData, 'POST')
        
        console.log(JSON.stringify(requestResponse))


        console.log(requestResponse.completed_info.filter(item => 'project_id' in item))

        const projectsContainingCompletedTasks = requestResponse.completed_info.filter(item => 'project_id' in item).map(item => item.project_id)
        const sectionsContainingCompletedTasks = requestResponse.completed_info.filter(item => 'section_id' in item).map(item => item.section_id)
        const itemsContainingCompletedTasks = requestResponse.completed_info.filter(item => 'item_id' in item).map(item => item.item_id)

        // PROCESS PROJECTS
        const projectIdMappings = {}
        const processProjects = async (projects, location) => {
            for (const project of projects) {

                let taskIdMappings = {}

                // get and create projects
                const createdProject = new Project(project.name, location)
                if (project.created_at) createdProject.task.added = new Date(project.created_at) //TODO: note that this is not included
                createdProject.sequential = false
                projectIdMappings[project.id] = createdProject
    
    
                //TODO: consider project notes - need to use /projects/get 'Get project info' if more than 10 notes
    
                // get sections and items
                const requestData = {project_id: project.id}
                const projectDataResponse = await getEndPoint('projects/get_data', requestData, 'POST')

                // add project notes
                for (const note of projectDataResponse.project_notes) {
                    projectIdMappings[note.project_id].note = projectIdMappings[note.project_id].note + `\n\n ${note.posted_at}: ${note.content} ${note.file_attachment ? '[' + note.file_attachment.file_name + '](' + note.file_attachment.file_url + ')' : ''}`
                }
    
                // create sections
                let sectionIdMappings = {}
                for (const section of projectDataResponse.sections) {
                    const createdSection = new Task(section.name, createdProject)
                    createdSection.added = new Date(section.added_at)
                    sectionIdMappings[section.id] = createdSection
                    createdSection.sequential = false
                    if (section.is_archived) {
                        let completedItemsData = await getEndPoint(`archive/items?section_id=${section.id}`, null, 'GET')
                        console.log(JSON.stringify(completedItemsData))
                        await processItemsAndMarkComplete(completedItemsData)
                    }
                }
    
                // create tasks/items

    
                function addTask (item) {
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
                    return createdTask
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


                // deal with completed items
                async function processItemsAndMarkComplete (completedInfoObject) {
                    const createdItems = []
                    for (const item of completedInfoObject.items) {
                        const newTask = addTask(item)
                        createdItems.push({task: newTask, completedDate: new Date(item.completed_at)})
                        newTask.markComplete(new Date(item.completed_at))
                    }
                    for (const completedInfoId of completedInfoObject.completed_info) {
                        
                        if ('item_id' in completedInfoId) {
                            const newCompletedInfoObject = await getEndPoint(`archive/items?parent_id=${completedInfoId.item_id}`, null, 'GET') 
                            await processItemsAndMarkComplete(newCompletedInfoObject)
                        }
                    }

                    // mark complete at end, so that tasks aren't 'uncompleted' when child tasks are added
                    for (const item of createdItems) {
                        const {task, date} = item
                        task.markComplete(date)
                    }
                }

                if (projectsContainingCompletedTasks.includes(project.id) || project.is_archived) {
                    let completedItemsData = await getEndPoint(`archive/items?project_id=${project.id}`, null, 'GET')
                    await processItemsAndMarkComplete(completedItemsData)
                }


            }

        }

        await processProjects(requestResponse.projects, null)
        
        const archivedProjectsData = await getEndPoint('projects/get_archived', null, 'GET') //TODO: deal with more than 500


        const archiveFolder = new Folder('Archive', null)
        await processProjects(archivedProjectsData, archiveFolder)

        /*
        

        // add notes to tasks
        const completedNotes = json.completed.items.flatMap(item => item.notes)
        for (const note of [...json.notes, ...completedNotes]) {
            taskIdMappings[note.item_id].note = taskIdMappings[note.item_id].note + `\n\n ${note.posted_at}: ${note.content} ${note.file_attachment ? '[' + note.file_attachment.file_name + '](' + note.file_attachment.file_url + ')' : ''}`
        }

        */
        
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

// IMPROVEMENT: add estimatedMinutes based on 'duration' (but need to confirm how this data is exported from Todoist)