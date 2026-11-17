const express = require('express');

function createApp({ repository }) {
  const app = express();
  app.use(express.json());

  app.get('/api/tasks', async (req, res) => {
    const tasks = await repository.list();
    tasks.sort((a, b) => Number(a.done) - Number(b.done));
    res.json(tasks);
  });

  return app;
}

module.exports = { createApp };
