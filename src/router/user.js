const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/users')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')
const router = new express.Router()

router.post('/users', async (req, res)=>{
    const user = new User(req.body)
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })    
    } catch (e) {
        res.status(400).send(e)   
        console.log(e)
    }
    
    // user.save().then(()=>{
    //     res.status(201).send(user)
    // }).catch((e)=>{
    //     res.status(400).send(e)
    // })
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user , token })
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res)=>{
    try {
        req.user.tokens= req.user.tokens.filter(token => token.token != req.token)
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logoutall', auth, async (req, res)=>{
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})


router.get('/users/me', auth, async (req, res)=>{

    res.send(req.user)    //authenticate user
   
    // try {
    //     const users = await User.find({})   //for all user route = /users
    //     res.status(201).send(users)
    // } catch (error) {
    //     res.status(500)
    // }

    // User.find({}).then((users)=>{
    //     res.status(201).send(users)
    // }).catch((e)=>{
    //     res.status(500)
    // })
})


// router.get('/users/:id' , auth , async (req,res)=>{

//     const _id = req.params.id

//     try {
//     const user = await  User.findById(_id)
//     if(!user){
//         return res.status(404).send()
//     }
//     res.send(user)
//     } catch (error) {
//         res.status(500).send()
//     }

//     // User.findById(_id).then((user)=>{
//     //     if(!user){
//     //         return res.status(404).send()
//     //     }
//     //     res.send(user)
//     // }).catch((e)=>{
//     //     res.status(500).send()
//     // })

// })

router.patch('/users/me', auth, async(req, res)=>{
    
    const updates = Object.keys(req.body)
    const allowedUpdate = ['name', 'age', 'email', 'password' ]
    const isValidoperation = updates.every((update)=> allowedUpdate.includes(update))
    if(!isValidoperation){
        return res.status(400).send({err:"invalid updates"})
    }
    
    try {
        // const user = await User.findById(req.params.id)
        updates.forEach(update => req.user[update] = req.body[update])
        await req.user.save()
        // const user = await User.findByIdAndUpdate(req.params.id,req.body,{new:true, runValidators:true})
        // if (!user) {
        //      return res.status(404).send()
        // }
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me',auth,  async (req, res)=>{

    try {
        // const user = await User.findByIdAndDelete(req.user._id)
        // if(!user){
        //     res.status(404).send('user not found')
        // }
        // res.send(user)
        await req.user.remove()
        sendCancelationEmail(req.user.email,req.user.name)
        res.send(req.user)


    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
})

const upload = multer({
    // dest : 'avatars',
    limits : {
        fileSize : 1000000
    },
    fileFilter(req,file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('please upload images'))
        }       
        cb(undefined ,true)
    }
})

router.post('/users/me/avatar', auth , upload.single('avatar') ,async (req,res)=>{
    const buffer = await sharp(req.file.buffer).resize({width:200, height:250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
},(error,req,res,next)=>{
    res.status(400).send({error : error.message})
})

router.delete('/users/me/avatar',auth, async (req, res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar' , async (req, res)=>{

    try {
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }

        res.set('Content-Type','image/png')
        res.send(user.avatar)

    } catch (e) {
        res.status(400).send()
    }
})





 module.exports = router