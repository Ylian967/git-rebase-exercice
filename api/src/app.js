const express = require('express');

function createApp({ repository }) {
  const app = express();
  app.use(express.json());

  app.get('/api/tasks', async (req, res) => {
    const sortedTasks = await repository.list();
    sortedTasks.sort((a, b) => Number(a.done) - Number(b.done));
    res.json(sortedTasks);
  });

  return app;
}

module.exports = { createApp };
