const jwt = require('jsonwebtoken')
const User = require('../models/users');

const auth = async (req, res,next)=>{
    try{
        const token = req.header('Authorization').replace('Bearer ','')
        const decode = jwt.verify(token,process.env.JWT_SECRET)
        const user = await User.findOne({_id : decode._id,'tokens.token':token})
        if(!user){
            throw new Error()
        }
        req.token = token
        req.user = user
        console.log(user)
        next()
    }catch(e){
        console.log(e)
        res.status(401).send({error: 'please authenticate'})
    }
}
module.exports = auth