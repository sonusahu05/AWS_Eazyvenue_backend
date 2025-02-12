const express = require('express');
const router = express.Router();
const { adminGuard } = require('../auth/aclService');
const UserService = require('./userService');
const CustomErrorService = require('../../../utils/customErrorService');
const userService = new UserService();

router.get('/', adminGuard, (req, res) => {
  userService
    .list(req.query)
    .then(users => res.send(users));
});

router.post('/', adminGuard, (req, res) => {
  userService
    .addUser(req.body)
    .then(user => res.send(user))
    .catch(err => res.status(400).send({ error: err.message }));
});

router.get('/current', (req, res) => {
  userService
    .findById(req.user.id)
    .then(user => res.send(user));
});

router.put('/current', (req, res) => {
  userService
    .editCurrentUser(req.body, req.user.id)
    .then(user => res.send(user))
    .catch(error => {
      if (error instanceof CustomErrorService) {
        res.status(error.metadata && error.metadata.error.code)
          .send(error);
      }
    });
});

router.get('/:id', adminGuard, (req, res) => {
  userService
    .findById(req.params.id)
    .then(user => res.send(user));
});

router.put('/:id', adminGuard, (req, res) => {
  userService
    .editUser(req.body, req.params.id)
    .then(user => res.send(user))
    .catch(error => {
      if (error instanceof CustomErrorService) {
        res.status(error.metadata && error.metadata.error.code)
          .send(error);
      }
    });
});

router.delete('/:id', adminGuard, (req, res) => {
  userService
    .deleteUser(req.params.id)
    .then(() => res.send({ id: req.params.id }));
});

module.exports = router;
