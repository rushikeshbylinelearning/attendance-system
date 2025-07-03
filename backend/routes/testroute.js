// /routes/test.js or inside your controller
app.get('/api/test', async (req, res) => {
  const data = await YourModel.find({});
  res.json(data);
});
