const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const Task = require('../models/task')

router.post('/tasks',auth,  async (req, res)=>{
    
    // const task = new Task(req.body)

    const task = new Task({
        ...req.body,   // copy all the propery to a object
        owner : req.user._id
    })


    try {
       await task.save()
       res.status(200).send(task) 
    } catch (e) {
        res.status(400).send(e)
    }    
    
    
    
    // task.save().then(()=>{
    //     res.status(201).send(task)
    // }).catch((error)=>{
    //     res.status(400).send(e)
    // })

})

//get/tasks?completd=true
//get/tasks?limit=10&skip=0
// get/sortBy=createdAt:desc


router.get('/tasks' , auth,  async (req, res)=>{
    
        const match = {}
        const sort = {}
        
         if(req.query.completed){
             match.completed = req.query.completed === 'true'
         }

         if(req.query.sortBy){
             const parts = req.query.sortBy.split(':')
             sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 
         }

    try {
    //    const task = await Task.find({owner : req.user._id}) 
        await req.user.populate({
            path : 'tasks',
            match,
            options : {
                limit : parseInt(req.query.limit),
                skip : parseInt(req.query.skip),
                sort
            }
            }).execPopulate()
         res.status(201).send(req.user.tasks)
    } catch (error) {
        res.status(500).send()  
    }
    
    
    // Task.find({}).then((task)=>{
    //     res.status(201).send(task)
    // }).catch((e)=>{
    //     res.status(500).send()
    // })
})

router.get('/tasks/:id', auth, async (req,res)=>{

    const _id = req.params.id
    
    try {
        // const task = await Task.findById(_id) 
        const task = await Task.findOne({_id , owner : req.user._id})
        if(!task){
          return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send(e)
    }

    // Task.findById(_id).then((task)=>{
    //     if(!task){
    //         return res.status(404).send()
    //     }
    //     res.send(task)
    // }).catch((e)=>{
    //     res.status(500).send(e)
    // })
})

router.patch('/tasks/:id', auth,async (req, res)=>{

    const updates = Object.keys(req.body)
    const allowedUpdate = ['description', 'completed' ]
    const isValidoperation = updates.every((update)=> allowedUpdate.includes(update))
    if(!isValidoperation){
        return res.status(400).send({err:"invalid updates"})
    }

    try {

        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
        // const task = await Task.findByIdAndUpdate(req.params.id)
        
        await task.save()

        // const task = await Task.findByIdAndUpdate(req.params.id,req.body,{new:true, runValidators:true})
        if(!task){
            res.status(404).send()
        }

        updates.forEach(update=>task[update] = req.body[update])
        res.status(200).send(task)
       
    } catch (e) {
        console.log(e);
        res.status(404).send()
    }

})

router.delete('/tasks/:id' , auth, async (req, res)=>{

    try {
        const task = await Task.findOneAndDelete({_id: req.params.id , owner : req.user._id})
        // const task = await Task.findByIdAndDelete(req.params.id)
        if(!task){
            res.status(404).send()
        }
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send()
    }

})

module.exports = router