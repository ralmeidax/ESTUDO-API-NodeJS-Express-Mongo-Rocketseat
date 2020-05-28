const express = require('express');
const authMiddleware = require('../middlewares/auth-middleware');

const Project = require('../models/project');
const Task = require('../models/task');
//const User = require('../models/user');

const router = express.Router();

router.use(authMiddleware);

//Show All Projects
router.get('/', async (req, res) => {
    //res.send({ msg: 'List All Registers', user: req.userId });
    try {
        const projects = await Project.find().populate('user').populate(['user', 'tasks']);

        return res.send( { projects });
    } catch (err) {
        return res.status(400).send({ error: true, messageError: 'Error Listing All Projects' });
    }
});

//Show One Project
router.get('/:projectId', async(req, res) => {
    //res.send({ msg: 'Show Id', user: req.userId });
    try {
        const project = await Project.findById(req.params.projectId).
        populate(['user', 'tasks']);

        res.send({ project });

    } catch (err) {
        res.status(400).send({ error: true, messageError: 'Error Loading Project'})
    }
});

//Create Project
router.post('/', async(req,res) => {
    //res.send({ msg: 'Create Id', user: req.userId });
    try {
        //1ª Versão
        //const project = await Project.create({ ...req.body, user: req.userId });

        const { title, description, tasks } = req.body;

        const project = await Project.create( { title, description, user: req.userId });

        await Promise.all(tasks.map(async task => {
            const projectTask = new Task({ ...task, project: project._id });
            await projectTask.save();
            project.tasks.push(projectTask);

        }));

        await project.save();

        return res.send({ project })

    } catch (err) {
        console.log(err);
        return res.status(400).send({ error: true, messageError: 'Error creating new project'});
    }
});

//Update Project and Tasks
router.put('/:projectId', async(req, res) =>{
    //res.send({ msg: 'Update Id', user: req.userId });
    try {
        const { title, description, tasks } = req.body;

        const project = await Project.findByIdAndUpdate(req.params.projectId,
            {
                title,
                description
            }, {new: true });

            project.tasks = [];
            await Task.deleteMany({ project: project._id });

            await Promise.all(tasks.map(async task => {
                const projectTask = new Task({ ...task, project: project._id });

                await projectTask.save();

                project.tasks.push(projectTask);
            }));

            await project.save();

            return res.send( { project });

    } catch (err) {
        console.log(err)
        return res.status(400).send({ error: true, messageError: 'Error Updating Project and Tasks'});
    }

});


//Delete Project
router.delete('/:projectId', async(req,res) =>{
    //res.send({ msg: 'Delete Id', user: req.userId})
    try {
        const project = await Project.findByIdAndRemove(req.params.projectId);

        res.send({ message: 'Project Was Deleted'});
    } catch (err) {
        res.status(400).send({ error: true, messageError: 'Erro Deleting Project'})
    }
}),

module.exports = app => app.use('/projects', router);
