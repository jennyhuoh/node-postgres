const db = require('../models');
const bcrypt = require('bcrypt');
const UserProfile = db.userProfiles;
const Op = db.Sequelize.Op;

// Create and save new User(register)
exports.create = (req, res) => {
// Validate request
    if(!(req.body.userName && req.body.userEmail && req.body.userRole && req.body.userPassword)){
        res.status(400).send({
            message: 'Content can not be empty!'
        });
        return;
    }

// Create a User
    const userProfile = {
        userName: req.body.userName,
        userEmail: req.body.userEmail,
        userRole: req.body.userRole,
        userPassword: bcrypt.hashSync(req.body.userPassword, 10)
    }
    UserProfile.findOne({where: {userEmail:req.body.userEmail}})
    .then(user => {
        // if userEmail is unique
        if(!user){
            UserProfile.create(userProfile)
            .then((data) => {
                console.log('successfully registered!')
                return res.send(data)
            })
            .catch(err => {
                res.status(500).send({
                    message:
                        err.message || "Some error occurred while creating the UserProfile."
                })
            })
        } else {
            // userEmail 重複
            return res.status(400).send({
                status: 1,
                message: 'The user email already exists.'
            })
        }
    })
    .catch(err => {
        res.send('error:'+err)
    });
};

// Login User
exports.login = (req, res) => {
    UserProfile.findOne({where: {userEmail: req.body.userEmail}})
    .then(user => {
        if(!user) {
            return res.status(400).send({
                status: 2,  
                message: "Email is not exists."
            })
        } else if(!bcrypt.compareSync(req.body.userPassword, user.dataValues.userPassword)){
            return res.status(400).send({
                status: 3,
                message: "Password wrong."
            })
        } else {
            return res.send(user)
        }
    })
}

// Get all users
exports.getAll = (req, res) => {
    UserProfile.findAll()
    .then((data) => {
        res.send(data);
    })
    .catch((err) => {
        res.status(500).send({
            message:
                err.message || "Some error occurred while creating the UserProfile."
        })
    })
}

// Find a single user with an email
// exports.findOne = (req, res) => {
//     const user = {d//         }else {
//             res.send(data);
//         }
        

//     })
//     .catch((err) => {
//         res.status(500).send({
//             message:
//                 err.message || "Some error occurred while getting the user."
//         })
//     })
// };

// Update a User by the id in the request
// exports.update = (req, res) => {

// };

// Delete a User with the specified id in the request
// exports.delete = (req, res) => {

// };

// Delete all Users from the database.
// exports.deleteAll = (req, res) => {

// };
