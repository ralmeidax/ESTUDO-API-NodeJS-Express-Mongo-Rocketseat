const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const mailer = require('../../modules/mailer');
const authJWT = require('../../credentials/auth-jwt.json');

const router = express.Router();

function generateToken(params = {}){
    return jwt.sign(params, authJWT.secret,{
        expiresIn: 86400,
    });
}


router.post('/register', async(req, res) => {
    const { email }  = req.body;
    try {

        if(await User.findOne({ email })){
            console.log('User already exists')
            return res.status(400).send({ error: 'User already exists' });
        }   

        const user = await User.create(req.body)

        user.password = undefined;

        return res.send({ 
            user,
            token: generateToken({ id: user.id }),
        });
    } catch (err) {
        return res.status(400).send({ error: 'Registration failed!'})
    }
});

router.post('/authenticate', async(req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if(!user)
        return res.status(400).send({error: 'User not found' });

    if(!await bcrypt.compare(password, user.password))
        return res.status(400).send({ error: 'Invalid password'});

        user.password = undefined;

    // const token = jwt.sign({ id: user.id }, authJWT.secret, {
    //     expiresIn: 86400,
    // });

    res.send({ 
        user, 
        token: generateToken({ id: user.id}) });
});

router.post('/forgot_password', async(req, res) => {
    const { email } = req.body;

    try{
        const user = await User.findOne({ email });

        if(!user)
            return res.status(400).send({ error: 'User not found' });

        const token = crypto.randomBytes(20).toString('hex');

        const now = new Date();
        now.setHours(now.getHours() + 1);

        await User.findByIdAndUpdate(user.id, {
          '$set': {
              passwordResetToken: token,
              passwordResetExpires: now,
              
          }  
        });

        console.log(`Email: ${email} Token: ${token} `, `Expires in: ${now}`);
        
        console.log(mailer);
        
        mailer.sendMail({
            to: email,
            from: 'ricardo.de.almeidax@gmail.com',
            subject: 'Reset de Senha',
            template: 'auth/forgot_password',
            context: { token },
        }, (err) => {
            if(err){
                console.log(err)
                return res.status(400).send({ error: 'Cannot send forgot passowrd email'})
            }
                

            return res.send({ messageUser: `The mail was send for your e-mail box: ${ email } `});
        })

    } catch (err) {
        console.log(err)
        res.status(400).send({ error: 'Error on forgot password. Try again!' });
    }
});

router.post('/reset_password', async(req, res) => {
    const { email, token, password } = req.body;

    // console.log("email 1: ", email);
    // console.log("token: 1", token);
    // console.log("password 1: ", password);

    try {
        const user = await User.findOne({ email })
            .select('+passwordResetToken +passwordResetExpires');

            console.log("email 2: ", user.email);
            console.log("Token 2: ", user.passwordResetToken);
            console.log("Expire:", user.passwordResetExpires)

        if(!user)
            return res.status(400).send({ error: 'User not found' });

        if(token !== user.passwordResetToken)
            return res.status(400).send({ error: 'Token invalid' });

        const now = Date();
        
        if(now > user.passwordResetExpires)
            return res.status(400).send({ error: 'Token expired. Generate a new one!'});

        user.password = password;
        
        // await (await user).save();
        await user.save();

        res.send({ ok: true });

    } catch (err) {
        console.log(err)
        res.status(400).send({ error: 'Cannot reset password, try again!'})
    }

});

module.exports = app => app.use('/auth',router);