const express = require('express');

function createApp({ repository }) {
  const app = express();
  app.use(express.json());

  app.get('/api/tasks', async (req, res) => {
    res.json(await repository.list());
  });

  return app;
}

module.exports = { createApp };
