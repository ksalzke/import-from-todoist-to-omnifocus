
(() => {
    const credentials = new Credentials()
    const action = new PlugIn.Action(async function (selection: Selection) {

        // PROMPT FOR API IF NOT ALREADY STORED
        const credentialsExist = credentials.read('Todoist')

        if (!credentialsExist || app.optionKeyDown) {

            const form = new Form()
            form.addField(new Form.Field.String('apiToken', 'API Token',null, null), null)
            await form.show('Enter Todoist API Token', 'Continue')
            
            credentials.write('Todoist', 'Todoist User', form.values.apiToken)
        }

        const form = new Form()
        form.addField(new Form.Field.Checkbox("importActive", "Import Active Projects", true), null)
        form.addField(new Form.Field.Checkbox('importArchived', "Import Archived Projects", true), null)

        await form.show("Select Items To Import", "Import")

        const importActive = form.values.importActive
        const importArchived = form.values.importArchived

        async function getEndPoint(endpoint: string, bodyData, method: string) {
            const url = `https://api.todoist.com/sync/v9/${endpoint}`
            console.log('hitting endpoint: ' + url)

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
            console.log('response status: ' + response.statusCode)
            if (response.statusCode !== 200) console.log(response.bodyString) 
            
            return JSON.parse(response.bodyString)
        }

        const ARCH_MAX_PAGE_SIZE = 100
        async function getArchiveItems(endpoint, offset = 0) {
            const bodyData = {limit: ARCH_MAX_PAGE_SIZE, offset: offset}
            let page = await getEndPoint(endpoint, bodyData, 'GET')
            if (page.has_more) {
                const remainder = await getArchiveItems(endpoint, offset + COMPL_MAX_PAGE_SIZE);
                return {
                  items: page.items.concat(remainder.items),
                  completed_info: Object.assign({}, page.completed_info, remainder.completed_info),
                };
              } else {
                return page;
              }
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
   
        const bodyData = {sync_token: "*", resource_types: '["projects", "completed_info", "notes"]'}
        const requestResponse = await getEndPoint('sync', bodyData, 'POST')

        // PROCESS PROJECTS
        const projectIdMappings = {}
        const processProjects = async (projects, location) => {
            for (const project of projects) {
                console.log("processing project: " + project.name)

                let taskIdMappings = {}

                // get and create projects
                const createdProject = new Project(project.name, location)
                if (project.created_at) createdProject.task.added = new Date(project.created_at)
                createdProject.sequential = false
                projectIdMappings[project.id] = createdProject
        
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
    
                    // add notes for task 
                    const notesFromIncompleteTasks = requestResponse.notes.filter(note => note.item_id === item.id)

                    const notes = [...notesFromIncompleteTasks]
                    for (const note of notes) {
                        createdTask.note = createdTask.note + `\n\n ${note.posted_at}: ${note.content} ${note.file_attachment ? '[' + note.file_attachment.file_name + '](' + note.file_attachment.file_url + ')' : ''}`
                    }

                    return createdTask
                }

                let remainingTasks = [...projectDataResponse.items]
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

        }

        if (importActive) {
            const projectSelectionForm = new Form()
            projectSelectionForm.addField(new Form.Field.MultipleOptions('activeProjects', 'Active Projects', requestResponse.projects, requestResponse.projects.map(p => p.name), requestResponse.projects), null)
            await projectSelectionForm.show('Select Active Projects', 'OK')
            await processProjects(projectSelectionForm.values.activeProjects, null)
        }

        const ARCH_PROJ_PAGE_SIZE = 500
        async function getArchived (offset = 0) {
            const requestBody = {limit: ARCH_PROJ_PAGE_SIZE, offset: offset}
            let page = await getEndPoint('projects/get_archived', requestBody, 'POST')

            if (page.length > 0) {
                const remainder = await getArchived(offset + ARCH_PROJ_PAGE_SIZE);
                return [...page, ...remainder]
              } else {
                return page;
              }
        }

        if (importArchived) {     
            const archivedProjectsData = await getArchived()
            const archiveFolder = folderNamed('Archive') || new Folder('Archive', null)


            const projectSelectionForm = new Form()
            projectSelectionForm.addField(new Form.Field.MultipleOptions('archivedProjects', 'Archived Projects', archivedProjectsData, archivedProjectsData.map(p => p.name), archivedProjectsData), null)
            await projectSelectionForm.show('Select Active Projects', 'OK')
            await processProjects(projectSelectionForm.values.archivedProjects, archiveFolder)
        }   
        
        // deal with inbox project (at end)
        const inboxProject = projectNamed("Inbox")
        if (inboxProject !== null) {
        moveTasks(inboxProject.tasks, inbox.ending)
        deleteObject(inboxProject)
        }

    })

    action.validate = function () {
        return true // always available
    }

    return action
})()

// IMPROVEMENT: add estimatedMinutes based on 'duration' (but need to confirm how this data is exported from Todoist)