import express from 'express'

import {
    getUsers,
    getBasicUsers,
    updateUsers,
    addUsers,
    deleteUsers
} from '../controllers/users.js'

const user = express.Router()

user.get('/', getUsers)
user.get('/basic', getBasicUsers)
user.post('/', addUsers)
user.put('/:id', updateUsers)
user.delete('/:id', deleteUsers)

export default user